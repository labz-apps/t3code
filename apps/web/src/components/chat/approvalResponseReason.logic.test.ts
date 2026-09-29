import { describe, expect, it } from "vite-plus/test";

import {
  isRejectionDecision,
  MAX_APPROVAL_REASON_LENGTH,
  normalizeApprovalReason,
} from "./approvalResponseReason.logic";

describe("isRejectionDecision", () => {
  it.each(["decline", "cancel"] as const)("treats %s as a rejection", (decision) => {
    expect(isRejectionDecision(decision)).toBe(true);
  });

  it.each(["accept", "acceptForSession", "acceptAlways"] as const)(
    "does not offer a reason for %s",
    (decision) => {
      expect(isRejectionDecision(decision)).toBe(false);
    },
  );
});

describe("normalizeApprovalReason", () => {
  it("drops a blank or whitespace-only reason so no field is sent", () => {
    expect(normalizeApprovalReason("")).toBeUndefined();
    expect(normalizeApprovalReason("   \n  ")).toBeUndefined();
  });

  it("trims the reason the user typed", () => {
    expect(normalizeApprovalReason("  no schema changes  ")).toBe("no schema changes");
  });

  it("caps the reason at the single-line budget", () => {
    expect(normalizeApprovalReason("x".repeat(MAX_APPROVAL_REASON_LENGTH + 40))).toHaveLength(
      MAX_APPROVAL_REASON_LENGTH,
    );
  });
});
