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
  // Stored data: sessionId, openClawCaseId, publicCaseId,
  // summaryHash, worldVerified, timestamps. Never submit raw transcript.

  return {
    network,
    caseReceiptTxHash: `pending-real-near-${sha256Json(receiptPayload).slice(0, 32)}`,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
}
