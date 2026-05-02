# plan4.md — World × NEAR integration plan for Tomo-san

## Goal

Integrate the existing Tomo-san civic intake product with:

1. **World / Human Badge**: verify that a citizen intake is submitted by a real human before it becomes a public case.
2. **NEAR**: record a privacy-preserving case receipt when OpenClaw generates a case.

The result should be a demoable flow:

```txt
Citizen opens Tomo-san
  -> World human verification
  -> Conversation is created
  -> Citizen submits consultation
  -> OpenClaw generates a public case
  -> NEAR records a receipt/hash for the case
  -> UI shows World verified + OpenClaw case ID + NEAR receipt status
```

Do **not** put raw citizen consultation text on-chain. Store only public metadata and hashes.

---

## Current repo context

Repository: `Jun0908/tomo-san-submit`

Relevant structure:

```txt
frontend/          # Next.js App Router + TypeScript citizen UI
backend/           # SadTalker + edge-tts talking-head generation
agents-OpenClaw/   # Python AI secretary / OpenClaw scripts
```

Existing frontend flow:

- `frontend/app/page.tsx`
  - calls `createSession()` when the user clicks 「新しい相談を始める」
- `frontend/lib/session.ts`
  - client fetch helpers for `/api/conversations`, `/api/conversations/[id]`, `/generate`, etc.
- `frontend/app/api/conversations/route.ts`
  - `GET`: list sessions
  - `POST`: create session
- `frontend/app/api/conversations/[id]/generate/route.ts`
  - calls `generateStoredCase(params.id)`
- `frontend/lib/server/store.ts`
  - stores sessions in `.data/public-intake.json`
  - `generateStoredCase()` builds intake draft, sends it to OpenClaw via `ingestOpenClawCaseDraft()`, then saves `generated`, `openClawCaseId`, and `openClawPublicJsonPath`
- `frontend/lib/types.ts`
  - defines `Session`, `PublicCase`, `Message`, etc.

---

## Implementation strategy

Use a minimal, hackathon-friendly integration:

1. Add World verification metadata to `Session`.
2. Add NEAR receipt metadata to `Session`.
3. Add a World verification API route.
4. Update session creation so a verified World result can be attached.
5. Add a NEAR receipt helper that records or mocks a receipt depending on environment variables.
6. Call the NEAR receipt helper after OpenClaw case generation.
7. Show verification / receipt badges in the citizen UI and case UI.

Keep all changes inside `frontend/` unless absolutely necessary.

---

## Environment variables

Add these to `frontend/.env.local.example` or document them in `frontend/README.md` if no example file exists.

```bash
# World / Human Badge
WORLD_APP_ID=
WORLD_ACTION=create_citizen_case
WORLD_VERIFY_API_URL=https://developer.worldcoin.org/api/v2/verify

# NEAR
NEAR_NETWORK_ID=testnet
NEAR_ACCOUNT_ID=
NEAR_PRIVATE_KEY=
NEAR_CONTRACT_ID=

# Demo fallback
NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY=true
ENABLE_DEMO_NEAR_RECEIPT=true
```

Behavior:

- If real World credentials are present, use real verification.
- If not and `NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY=true`, allow a demo verification path clearly marked as demo.
- If real NEAR credentials are present, submit a real receipt.
- If not and `ENABLE_DEMO_NEAR_RECEIPT=true`, create a deterministic local mock tx hash so the demo still works.

---

## Step 1 — Extend shared types

Edit: `frontend/lib/types.ts`

Add these types:

```ts
export type WorldVerification = {
  verified: boolean;
  nullifierHash?: string;
  credentialType?: string;
  action?: string;
  verifiedAt?: string;
  demo?: boolean;
};

export type NearExecution = {
  network: 'testnet' | 'mainnet' | 'local' | string;
  caseReceiptTxHash?: string;
  intentId?: string;
  status?: 'pending' | 'submitted' | 'settled' | 'failed' | 'mocked';
  submittedAt?: string;
  demo?: boolean;
};
```

Update `Session`:

```ts
export type Session = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  generated?: PublicCase;
  openClawCaseId?: string;
  openClawPublicJsonPath?: string;
  world?: WorldVerification;
  near?: NearExecution;
};
```

Update formatting if the file is currently minified into one line. Prefer readable multiline TypeScript.

---

## Step 2 — Add server-side hash helper

Create: `frontend/lib/server/hash.ts`

```ts
import { createHash } from 'crypto';

export function sha256Json(input: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');
}
```

Use this for public case hashing before NEAR receipt submission.

---

## Step 3 — Add World verification API route

Create: `frontend/app/api/world/verify/route.ts`

Purpose:

- Accept World / Human Badge proof payload from the browser.
- Verify it server-side when credentials exist.
- Return normalized `WorldVerification` metadata.
- Support a clearly marked demo fallback.

Suggested implementation shape:

```ts
import { NextResponse } from 'next/server';
import type { WorldVerification } from '@/lib/types';

type WorldVerifyRequest = {
  merkle_root?: string;
  nullifier_hash?: string;
  proof?: string;
  credential_type?: string;
  action?: string;
  signal?: string;
  demo?: boolean;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as WorldVerifyRequest;
  const action = process.env.WORLD_ACTION ?? 'create_citizen_case';

  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY === 'true';

  if (payload.demo && demoEnabled) {
    const result: WorldVerification = {
      verified: true,
      nullifierHash: payload.nullifier_hash ?? `demo-${Date.now()}`,
      credentialType: payload.credential_type ?? 'demo',
      action,
      verifiedAt: new Date().toISOString(),
      demo: true,
    };

    return NextResponse.json(result);
  }

  const appId = process.env.WORLD_APP_ID;
  const verifyUrl = process.env.WORLD_VERIFY_API_URL;

  if (!appId || !verifyUrl) {
    return NextResponse.json(
      { error: 'World verification is not configured.' },
      { status: 500 },
    );
  }

  const response = await fetch(`${verifyUrl}/${appId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      action,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'World verification failed.' },
      { status: 401 },
    );
  }

  const result: WorldVerification = {
    verified: true,
    nullifierHash: payload.nullifier_hash,
    credentialType: payload.credential_type,
    action,
    verifiedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
```

Notes:

- Adjust the exact payload fields to match the Human Badge / World ID SDK actually used.
- Keep `action` stable as `create_citizen_case` so the nullifier can be used to prevent duplicate submissions for this action if needed.
- Do not store any personally identifying information from World.

---

## Step 4 — Update client session helper

Edit: `frontend/lib/session.ts`

Change `createSession()` so it can send optional World metadata:

```ts
import type { ApiCaseRecord, Session, WorldVerification } from '@/lib/types';

export async function createSession(input?: {
  world?: WorldVerification;
}): Promise<Session> {
  return request('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(input ?? {}),
  });
}
```

Keep existing call sites working by making the argument optional.

---

## Step 5 — Update conversation creation API

Edit: `frontend/app/api/conversations/route.ts`

Change `POST()` to read optional body data:

```ts
import { NextResponse } from 'next/server';
import { createStoredSession, listStoredSessions } from '@/lib/server/store';
import type { WorldVerification } from '@/lib/types';

export async function GET() {
  const sessions = await listStoredSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    world?: WorldVerification;
  };

  const session = await createStoredSession({
    world: body.world,
  });

  return NextResponse.json(session, { status: 201 });
}
```

---

## Step 6 — Update store session creation

Edit: `frontend/lib/server/store.ts`

Change `createStoredSession()` signature:

```ts
import type { ApiCaseRecord, Session, WorldVerification } from '@/lib/types';

export async function createStoredSession(input?: {
  world?: WorldVerification;
}): Promise<Session> {
  const store = await readStore();
  const session = createInitialSession();

  const updated: Session = {
    ...session,
    world: input?.world,
  };

  store.sessions.unshift(updated);
  await writeStore(store);
  return updated;
}
```

No migration is required because old sessions can simply have `world` and `near` undefined.

---

## Step 7 — Add client-side World verification helper

Create: `frontend/lib/world.ts`

Minimal version for demo:

```ts
import type { WorldVerification } from '@/lib/types';

export async function verifyHumanWithWorld(): Promise<WorldVerification> {
  // TODO: Replace demo payload with Human Badge / World ID SDK result.
  // The SDK should produce proof fields that are passed to /api/world/verify.
  const demoPayload = {
    demo: true,
    nullifier_hash: `demo-human-${Date.now()}`,
    credential_type: 'demo',
  };

  const response = await fetch('/api/world/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoPayload),
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Human verification failed.';
    try {
      const payload = (await response.json()) as { error?: string };
      message = payload.error ?? message;
    } catch {
      // Keep fallback message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<WorldVerification>;
}
```

Later, replace the demo payload with the actual SDK proof result.

---

## Step 8 — Gate session start with World verification

Edit: `frontend/app/page.tsx`

Import:

```ts
import { verifyHumanWithWorld } from '@/lib/world';
```

Change `start()`:

```ts
const start = async () => {
  setIsCreating(true);
  setError('');

  try {
    const world = await verifyHumanWithWorld();
    const session = await createSession({ world });
    window.location.href = `/conversation/${session.id}`;
  } catch (reason) {
    setError(reason instanceof Error ? reason.message : '新しい相談を開始できませんでした。');
    setIsCreating(false);
  }
};
```

Update the button text or nearby copy to show the new step:

```txt
人間確認して相談を始める
```

or show a small badge:

```txt
World Human Badge required before creating a public intake.
```

---

## Step 9 — Add NEAR receipt helper

Create: `frontend/lib/server/near.ts`

Purpose:

- Build a receipt payload from the generated public case.
- Submit it to NEAR if configured.
- Otherwise return a deterministic mock receipt for demo.

Suggested shape:

```ts
import { sha256Json } from '@/lib/server/hash';
import type { NearExecution } from '@/lib/types';

type SubmitCaseReceiptInput = {
  sessionId: string;
  openClawCaseId?: string;
  publicCaseId: string;
  title: string;
  summaryHash: string;
  worldVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function submitCaseReceiptToNear(
  input: SubmitCaseReceiptInput,
): Promise<NearExecution> {
  const network = process.env.NEAR_NETWORK_ID ?? 'testnet';
  const demoEnabled = process.env.ENABLE_DEMO_NEAR_RECEIPT === 'true';

  const hasNearConfig = Boolean(
    process.env.NEAR_ACCOUNT_ID &&
      process.env.NEAR_PRIVATE_KEY &&
      process.env.NEAR_CONTRACT_ID,
  );

  const receiptPayload = {
    schema: 'tomo-san.caseReceipt.v1',
    ...input,
  };

  if (!hasNearConfig) {
    if (!demoEnabled) {
      return {
        network,
        status: 'failed',
        submittedAt: new Date().toISOString(),
      };
    }

    return {
      network,
      caseReceiptTxHash: `mock-near-${sha256Json(receiptPayload).slice(0, 32)}`,
      status: 'mocked',
      submittedAt: new Date().toISOString(),
      demo: true,
    };
  }

  // TODO: Wire real NEAR transaction here.
  // Suggested contract method: record_case_receipt(receiptPayload)
  // Suggested stored data: sessionId, openClawCaseId, publicCaseId,
  // summaryHash, worldVerified, timestamps. Never submit raw transcript.

  return {
    network,
    caseReceiptTxHash: `pending-real-near-${sha256Json(receiptPayload).slice(0, 32)}`,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
}
```

After the demo is stable, replace the TODO with actual NEAR SDK / contract calls.

---

## Step 10 — Record NEAR receipt after OpenClaw case generation

Edit: `frontend/lib/server/store.ts`

Imports:

```ts
import { sha256Json } from '@/lib/server/hash';
import { submitCaseReceiptToNear } from '@/lib/server/near';
```

Inside `generateStoredCase(id)`, after this line:

```ts
const ingestResult = await ingestOpenClawCaseDraft(draft);
```

add:

```ts
const nearReceipt = await submitCaseReceiptToNear({
  sessionId: id,
  openClawCaseId: ingestResult.openClawCaseId,
  publicCaseId: ingestResult.publicCase.id,
  title: ingestResult.publicCase.title,
  summaryHash: sha256Json({
    id: ingestResult.publicCase.id,
    title: ingestResult.publicCase.title,
    summary: ingestResult.publicCase.summary,
    statusPublic: ingestResult.publicCase.statusPublic,
    themeTags: ingestResult.publicCase.themeTags,
    timeline: ingestResult.publicCase.timeline,
  }),
  worldVerified: Boolean(store.sessions[index].world?.verified),
  createdAt: ingestResult.publicCase.createdAt,
  updatedAt: ingestResult.publicCase.updatedAt,
});
```

Then include `near` in the updated session:

```ts
const updated: Session = {
  ...store.sessions[index],
  updatedAt: ingestResult.publicCase.updatedAt,
  generated: ingestResult.publicCase,
  openClawCaseId: ingestResult.openClawCaseId,
  openClawPublicJsonPath: ingestResult.publicJsonPath,
  near: nearReceipt,
};
```

---

## Step 11 — Show badges in UI

Search for UI files under:

```txt
frontend/app/conversation/[id]/
frontend/app/cases/
frontend/app/staff/
```

Add a compact metadata block wherever a generated case or session is displayed.

Example component text:

```tsx
{session.world?.verified ? (
  <span>✅ Human verified by World{session.world.demo ? ' (demo)' : ''}</span>
) : (
  <span>未検証</span>
)}

{session.openClawCaseId ? <span>🧠 OpenClaw case: {session.openClawCaseId}</span> : null}

{session.near?.caseReceiptTxHash ? (
  <span>
    ⛓ NEAR receipt: {session.near.caseReceiptTxHash}
    {session.near.demo ? ' (demo)' : ''}
  </span>
) : null}
```

Do not expose raw transcript or private details on public pages.

---

## Step 12 — Optional duplicate prevention

After World verification is working, consider preventing duplicate public case creation for the same World nullifier.

Minimal implementation:

- In `createStoredSession()` or `generateStoredCase()`:
  - read existing sessions
  - if another session has the same `world.nullifierHash` and a generated case, reject or warn

Suggested error:

```txt
この Human Badge では、すでに相談が案件化されています。
```

Keep this optional for the first integration because the demo flow should not be blocked by accidental duplicate attempts.

---

## Acceptance criteria

The integration is done when:

1. `npm run lint` passes in `frontend/`.
2. Existing conversation creation still works when demo verification is enabled.
3. A created session contains `world.verified === true` after starting from the homepage.
4. Generating a case still calls OpenClaw and saves `openClawCaseId`.
5. After case generation, the session contains `near.caseReceiptTxHash` and `near.status`.
6. The UI displays:
   - World human verification status
   - OpenClaw case ID when available
   - NEAR receipt hash/status when available
7. No raw citizen transcript is included in the NEAR payload.
8. Old sessions without `world` or `near` fields still render without crashing.

---

## Suggested commit message

```txt
Add World verification and NEAR case receipts
```

---

## Notes for real SDK completion

- Replace `frontend/lib/world.ts` demo payload with the actual Human Badge / World ID SDK proof object.
- Replace the TODO in `frontend/lib/server/near.ts` with actual NEAR transaction submission.
- Keep the public on-chain payload limited to hashes and non-sensitive public metadata.
- For the hackathon demo, it is acceptable to show demo-mode badges as long as the code path is clearly separated and environment-controlled.
