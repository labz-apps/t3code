import { describe, expect, it } from "vite-plus/test";

import {
  resolveRuntimeWarningRecoveryLink,
  runtimeWarningRecoveryLabel,
} from "./runtimeWarningRecovery.logic";

describe("resolveRuntimeWarningRecoveryLink", () => {
  it("returns the provider's http(s) fix", () => {
    expect(resolveRuntimeWarningRecoveryLink({ link: "https://opencode.ai/auth/device" })).toBe(
      "https://opencode.ai/auth/device",
    );
  });

  it("accepts a protocol-relative URL", () => {
    expect(resolveRuntimeWarningRecoveryLink({ link: "//opencode.ai/billing" })).toBe(
      "//opencode.ai/billing",
    );
  });

  it("drops a link that is not http(s)", () => {
    expect(resolveRuntimeWarningRecoveryLink({ link: "javascript:alert(1)" })).toBeNull();
    expect(resolveRuntimeWarningRecoveryLink({ link: "file:///etc/passwd" })).toBeNull();
    expect(resolveRuntimeWarningRecoveryLink({ link: "opencode.ai/auth" })).toBeNull();
  });

  it("drops a blank, missing, or non-string link", () => {
    expect(resolveRuntimeWarningRecoveryLink({ link: "   " })).toBeNull();
    expect(resolveRuntimeWarningRecoveryLink({})).toBeNull();
    expect(resolveRuntimeWarningRecoveryLink({ link: 42 })).toBeNull();
    expect(resolveRuntimeWarningRecoveryLink(null)).toBeNull();
  });
});

describe("runtimeWarningRecoveryLabel", () => {
  it("names the destination host", () => {
    expect(runtimeWarningRecoveryLabel("https://opencode.ai/auth/device")).toBe("Open opencode.ai");
  });

  it("drops a www prefix", () => {
    expect(runtimeWarningRecoveryLabel("https://www.opencode.ai/billing")).toBe("Open opencode.ai");
  });

  it("falls back to the raw value when there is no host to read", () => {
    expect(runtimeWarningRecoveryLabel("not a url")).toBe("Open not a url");
  });
});
