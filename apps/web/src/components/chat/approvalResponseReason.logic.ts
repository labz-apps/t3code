import type { ProviderApprovalDecision } from "@t3tools/contracts";

/**
 * A reason is a one-line aside, not a second prompt. Long enough to say what
 * was wrong, short enough that the agent reads it before the next turn.
 */
export const MAX_APPROVAL_REASON_LENGTH = 500;

/**
 * Only a refusal carries a reason back to the model — OpenCode accepts a
 * `message` on a permission rejection and nothing on an approval, so offering
 * the field next to "Approve" would collect text the server has to discard.
 */
export function isRejectionDecision(decision: ProviderApprovalDecision): boolean {
  return decision === "decline" || decision === "cancel";
}

/** Blanks collapse to `undefined` so an untouched field sends no field at all. */
export function normalizeApprovalReason(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.slice(0, MAX_APPROVAL_REASON_LENGTH);
}
