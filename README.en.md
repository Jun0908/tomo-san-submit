# AI Political Secretary — Tomo-san

**An AI secretary that remembers citizens' voices, connects them to the council schedule and public information, and delivers briefings every morning and before each meeting.**

> 🇯🇵 日本語版は [README.md](README.md) を参照してください。

---

## Why We Built This

Tomo-san is a city council member in Kesennuma, Miyagi. She handles citizen consultations, meeting preparation, and information gathering entirely on her own — with no dedicated secretary, growing caseloads, and a flood of public council documents she can barely keep up with.

This system acts as her AI secretary. It organizes information and delivers it proactively so she can focus on making political decisions — which only she can do.

---

## Tomo-san

<img src="public/fbfbc9a3-afcf-43f3-8a2f-f1a8608cbbcc.png" width="200" alt="Tomo-san" />

---

## System Architecture

```
Citizen
 │  Opens browser to submit a consultation
 ▼
[ Frontend / Next.js ]
 · Accepts consultations via conversational UI
 · Returns Tomo-san's reply as a talking head video (SadTalker + edge-tts)
 · Shows citizens that their case is not being ignored
 │  Sends conversation log as a case
 ▼
[ AI Secretary Backend / OpenClaw ]
 · Automatically converts consultations into structured cases
 · Matches against similar past cases
 · Links cases to public council and city hall RSS feeds
 · Integrates with Google Calendar / Gmail / Tasks
 · Generates morning briefs and pre-meeting briefs
 │  Sends via Telegram
 ▼
[ Tomo-san's device / Telegram Bot ]
 · Every morning: schedule, important emails, and case summary
 · 30 minutes before each meeting: related cases, public info, 3 key points
 · /search /case /today commands for instant case lookup
```

---

## Key Features

### For Citizens

- **Conversational intake**: Submit consultations in natural language from any browser
- **Tomo-san video reply**: A talking head video generated from a single photo via SadTalker
- **Case status visibility**: Citizens can see their consultation has been received and is being handled

### For Tomo-san (via Telegram)

- **Morning brief**: One message every morning — today's schedule, important emails, deadline tasks, and new cases
- **3-minute brief**: Auto-sent before each meeting — related citizen cases, public information, and 3 confirmation points
- **Daily citizen digest**: Count of today's consultations, top themes, and high-urgency cases in one message
- **Telegram commands**: `/search school route`, `/case <id>`, `/today` for instant search and reference
- **Public information linking**: Automatically pulls relevant items from Kesennuma city council and city hall RSS feeds and links them to cases
- **SNS draft generation**: Generates Note articles, Instagram captions, carousel outlines, and hashtags from case notes and public info, along with volunteer handoff memos

### Learning & Optimization

- **Tomo Profile**: Gradually optimizes brief order, emphasis, and regional weighting based on Telegram feedback

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript |
| Talking Head Video | SadTalker, edge-tts |
| AI Secretary Core | Python, Claude API (OpenClaw) |
| Data Integration | Google Gmail / Calendar / Tasks API |
| Notifications | Telegram Bot API |
| Information Gathering | RSS (Kesennuma City Council & City Hall) |
| Knowledge Base | Obsidian Markdown |
| Human Verification | World / Human Badge |
| On-chain Record | NEAR Protocol |

---

## How World and NEAR Are Used

### World — Human Verification at Consultation Start

When a citizen clicks "Start a consultation", **World Human Badge** verification runs first.
This blocks bots and automated scripts, ensuring one verified human per case.

```
Citizen clicks the button
  → World Human Badge verifies identity (nullifier hash obtained)
  → Verified flag saved to session
  → Redirected to conversation page
```

| Item | Detail |
|---|---|
| When | Before session creation (`frontend/app/page.tsx`) |
| API route | `frontend/app/api/world/verify/route.ts` |
| Client helper | `frontend/lib/world.ts` |
| Stored as | `world.verified` / `world.nullifierHash` in session |
| UI | "✅ Human verified (World)" badge on conversation and case pages |
| Demo mode | Set `NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY=true` to run without a real Badge |

---

### NEAR — On-chain Receipt When a Case Is Generated

When OpenClaw converts a consultation into a case, a **hash of the public case metadata is recorded on the NEAR chain**.
Raw consultation text is never stored on-chain — only a proof that the case was received.

```
Citizen clicks "Generate public case page"
  → OpenClaw generates the case
  → Public metadata is SHA-256 hashed
  → Receipt sent to NEAR (txHash returned)
  → near.caseReceiptTxHash saved to session
  → "⛓ NEAR receipt" badge shown on case page
```

| Item | Detail |
|---|---|
| When | Immediately after OpenClaw case generation (`frontend/lib/server/store.ts`) |
| Logic | `frontend/lib/server/near.ts` |
| On-chain data | sessionId, publicCaseId, title, summaryHash, worldVerified, timestamps |
| **Not** on-chain | Raw consultation text, citizen personal information |
| UI | "⛓ NEAR: xxxx..." badge on conversation and case pages |
| Demo mode | Set `ENABLE_DEMO_NEAR_RECEIPT=true` for a deterministic mock txHash |

---

### Environment Variables

See `frontend/.env.local.example`. For demo mode, only two lines are needed:

```bash
NEXT_PUBLIC_ENABLE_DEMO_WORLD_VERIFY=true
ENABLE_DEMO_NEAR_RECEIPT=true
```

For production, set `WORLD_APP_ID` and `NEAR_ACCOUNT_ID` / `NEAR_PRIVATE_KEY` / `NEAR_CONTRACT_ID`.

---

## Repository Structure

```
tomo-san/
├── frontend/          # Citizen-facing Next.js UI
├── backend/           # SadTalker + edge-tts video generation
└── agents-OpenClaw/   # AI secretary backend
    ├── scripts/       # 21 Python scripts
    ├── obsidian/      # Human-readable knowledge base
    └── data/          # Gmail / Calendar / cases / public info
```

---

## Getting Started

### Frontend (Citizen UI)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Talking Head Video Generation (Windows)

```powershell
cd backend
.\run_talking_photo.bat --text "Thank you for your consultation."
# → outputs/<timestamp>/talking-head.mp4
```

### AI Secretary Scripts

```bash
cd agents-OpenClaw
pip install -r requirements.txt
python scripts/morning_brief.py    # Send morning brief to Telegram
python scripts/citizen_digest.py   # Generate daily citizen summary
python scripts/telegram_bot.py     # Start Telegram command layer
```

For detailed setup (Google auth, Telegram configuration), see [agents-OpenClaw/SETUP.md](agents-OpenClaw/SETUP.md).

---

## One-line summary

> An AI secretary that remembers citizens' voices, connects them to the council schedule and public information, and delivers briefings every morning and before each meeting.
