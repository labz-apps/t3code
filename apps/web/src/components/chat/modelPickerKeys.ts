import type { ProviderInstanceId } from "@t3tools/contracts";

const MODEL_KEY_PREFIX = "model:";
const LEGACY_SECTION_KEY_PREFIX = "legacy-models:";
const MODEL_PROVIDER_SECTION_KEY_PREFIX = "model-provider:";

export function modelPickerModelKey(instanceId: ProviderInstanceId, slug: string): string {
  return `${MODEL_KEY_PREFIX}${instanceId.length}:${instanceId}${slug}`;
}

export function parseModelPickerModelKey(
  key: string,
): { instanceId: ProviderInstanceId; slug: string } | null {
  if (!key.startsWith(MODEL_KEY_PREFIX)) {
    return null;
  }
  const encoded = key.slice(MODEL_KEY_PREFIX.length);
  const separatorIndex = encoded.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  const instanceIdLengthText = encoded.slice(0, separatorIndex);
  if (!/^\d+$/.test(instanceIdLengthText)) {
    return null;
  }

  const instanceIdLength = Number(instanceIdLengthText);
  const value = encoded.slice(separatorIndex + 1);
  if (!Number.isSafeInteger(instanceIdLength) || instanceIdLength > value.length) {
    return null;
  }

  return {
    instanceId: value.slice(0, instanceIdLength) as ProviderInstanceId,
    slug: value.slice(instanceIdLength),
  };
}

export function modelPickerLegacySectionKey(instanceId: ProviderInstanceId): string {
  return `${LEGACY_SECTION_KEY_PREFIX}${instanceId}`;
}

export function parseModelPickerLegacySectionKey(key: string): ProviderInstanceId | null {
  return key.startsWith(LEGACY_SECTION_KEY_PREFIX)
    ? (key.slice(LEGACY_SECTION_KEY_PREFIX.length) as ProviderInstanceId)
    : null;
}

/**
 * Section header for one upstream model provider (OpenAI, Anthropic, …).
 * Shares the item-key namespace with models and legacy sections so the
 * virtualized list can interleave headers and rows in one pass; the parser
 * prefixes keep the three distinguishable.
 */
export function modelPickerModelProviderSectionKey(modelProviderId: string): string {
  return `${MODEL_PROVIDER_SECTION_KEY_PREFIX}${modelProviderId}`;
}

export function parseModelPickerModelProviderSectionKey(key: string): string | null {
  return key.startsWith(MODEL_PROVIDER_SECTION_KEY_PREFIX)
    ? key.slice(MODEL_PROVIDER_SECTION_KEY_PREFIX.length)
    : null;
}
