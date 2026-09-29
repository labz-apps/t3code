/**
 * `deriveProviderInstanceConfigMap` is the one place that decides which
 * persisted provider instances this build actually offers. It runs pure over
 * a `ServerSettings` snapshot, so it is tested here without any layering.
 *
 * The build ships OpenCode alone, so the load-bearing assertion is that no
 * instance for any other driver ever survives — a provider we stopped
 * offering must not reappear in Settings or the model pickers as either a
 * real entry or an `"unavailable"` shadow card.
 */
import { describe, expect, it } from "@effect/vitest";
import {
  DEFAULT_SERVER_SETTINGS,
  ProviderDriverKind,
  type ProviderInstanceConfig,
  type ProviderInstanceConfigMap,
  type ProviderInstanceId,
  type ServerSettings,
} from "@t3tools/contracts";

import { deriveProviderInstanceConfigMap } from "./ProviderInstanceRegistryHydration.ts";

const instanceFor = (driver: string): ProviderInstanceConfig => ({
  driver: ProviderDriverKind.make(driver),
  config: {},
});

// `providerInstances` is keyed by the branded `ProviderInstanceId`, which no
// plain object literal satisfies. Tests only care about the values, so the
// fixture takes loose string keys and brands them at the boundary.
const settingsWith = (
  providerInstances: Readonly<Record<string, ProviderInstanceConfig>>,
): ServerSettings =>
  ({
    ...DEFAULT_SERVER_SETTINGS,
    providerInstances,
  }) as ServerSettings;

const RETIRED_DRIVERS = ["codex", "claudeAgent", "cursor", "grok", "antigravity"] as const;

/** Read one entry out of the branded `ProviderInstanceConfigMap`. */
const at = (map: ProviderInstanceConfigMap, key: string): ProviderInstanceConfig | undefined =>
  map[key as ProviderInstanceId];

describe("deriveProviderInstanceConfigMap", () => {
  it("synthesizes the OpenCode instance from the legacy mirror, enabled", () => {
    const derived = deriveProviderInstanceConfigMap(settingsWith({}));

    expect(Object.keys(derived)).toEqual(["opencode"]);
    expect(at(derived, "opencode")?.driver).toBe("opencode");
    // Config comes from `settings.providers.opencode`, not an empty envelope.
    expect(at(derived, "opencode")?.config).toMatchObject({
      binaryPath: "opencode",
      enabled: true,
    });
  });

  it("preserves author-named OpenCode instances and their custom config", () => {
    const derived = deriveProviderInstanceConfigMap(
      settingsWith({
        "opencode-work": {
          driver: ProviderDriverKind.make("opencode"),
          displayName: "Work OpenCode",
          config: { binaryPath: "/opt/opencode" },
        },
      }),
    );

    const entry = at(derived, "opencode-work");
    expect(entry?.displayName).toBe("Work OpenCode");
    expect(entry?.config).toMatchObject({ binaryPath: "/opt/opencode" });
  });

  it("drops instances for drivers this build does not ship", () => {
    const derived = deriveProviderInstanceConfigMap(
      settingsWith({
        codex: instanceFor("codex"),
        claudeAgent: instanceFor("claudeAgent"),
        cursor: instanceFor("cursor"),
        grok: instanceFor("grok"),
        antigravity: instanceFor("antigravity"),
      }),
    );

    // Only the synthesized OpenCode mirror survives. The legacy mirror is
    // keyed on `defaultInstanceIdForDriver("opencode")`, so it is present
    // regardless of what else was configured.
    expect(Object.keys(derived)).toEqual(["opencode"]);
    for (const driver of RETIRED_DRIVERS) {
      expect(at(derived, driver)).toBeUndefined();
    }
  });

  it("suppresses the synthesized mirror once the user authors an `opencode` instance", () => {
    const derived = deriveProviderInstanceConfigMap(
      settingsWith({
        codex: instanceFor("codex"),
        opencode: { ...instanceFor("opencode"), config: { binaryPath: "/usr/bin/opencode" } },
      }),
    );

    expect(Object.keys(derived)).toEqual(["opencode"]);
    expect(at(derived, "opencode")?.config).toMatchObject({ binaryPath: "/usr/bin/opencode" });
  });
});
