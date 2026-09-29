/**
 * BUILT_IN_DRIVERS — the static set of `ProviderDriver`s this build ships
 * with.
 *
 * OpenCode is the only driver this build offers. Every other provider
 * adapter still lives under `Drivers/`, but it is not registered, so
 * `deriveProviderInstanceConfigMap` drops any settings entry naming it and
 * the registry never materializes it. A user upgrading from a multi-provider
 * install therefore stops seeing those providers in Settings and the model
 * pickers without losing the stored config, and threads bound to them are
 * filtered out of the thread lists by the clients.
 *
 * Adding a new first-party driver means:
 *   1. implement `ProviderDriver` in a sibling `Drivers/<Name>Driver.ts`,
 *   2. add it to this array and widen `BuiltInDriversEnv`,
 *   3. ensure the runtime layer satisfies its declared `R`.
 *
 * @module provider/builtInDrivers
 */
import { OpenCodeDriver, type OpenCodeDriverEnv } from "./Drivers/OpenCodeDriver.ts";
import type { AnyProviderDriver } from "./ProviderDriver.ts";

/**
 * Union of infrastructure services required to construct any built-in
 * driver. The registry layer declares `R = BuiltInDriversEnv`; the runtime
 * layer must provide every service in this union.
 */
export type BuiltInDriversEnv = OpenCodeDriverEnv;

/**
 * Ordered list of built-in drivers. Order matters only for tie-breaking in
 * UI presentation — the registry itself is keyed by `driverKind`, so
 * iteration order has no functional effect on instance lookup.
 */
export const BUILT_IN_DRIVERS: ReadonlyArray<AnyProviderDriver<BuiltInDriversEnv>> = [
  OpenCodeDriver,
];
