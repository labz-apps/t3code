/**
 * Grouping of model options by their upstream *model provider* — the company
 * that actually serves the model (OpenAI, Anthropic, Google, …), as opposed
 * to the T3 provider/driver that runs the turn.
 *
 * OpenCode is the only driver this build offers, so the model provider is the
 * axis a user actually chooses between: one flat list of every connected
 * provider's models hides that GPT-5 from OpenAI and GPT-5 from Anthropic are
 * different choices with different credentials and different prices. The
 * picker renders one section header per group so that choice is visible.
 *
 * A group with an empty `modelProviderId` holds models that do not report one
 * (a driver whose slugs are not namespaced). Callers render those without a
 * header rather than inventing a provider name for them.
 *
 * @module modelProviderGroups
 */

export interface ModelProviderGroup<T> {
  /** Upstream provider id, or `""` for models that do not report one. */
  readonly modelProviderId: string;
  /** Human label for the header. Empty for the ungrouped bucket. */
  readonly label: string;
  readonly models: ReadonlyArray<T>;
}

interface ModelProviderIdentity {
  readonly modelProviderId?: string | undefined;
  /** Untyped display name the driver attached (OpenCode's `Provider.name`). */
  readonly subProvider?: string | undefined;
}

/** Title-case a slug so a raw id still reads as a name: `openai` -> `Openai`. */
function humanizeModelProviderId(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/gu, (char) => char.toUpperCase());
}

function modelProviderLabel(
  modelProviderId: string,
  models: ReadonlyArray<ModelProviderIdentity>,
): string {
  // Every model in a group shares a driver, so the first non-empty display
  // name wins. `subProvider` is presentation-only on the wire, hence the
  // fallback to the id.
  const displayName = models.map((model) => model.subProvider?.trim()).find(Boolean);
  return displayName ?? humanizeModelProviderId(modelProviderId);
}

/**
 * Split models into one group per upstream model provider, ordered by label.
 *
 * Models with no reported provider keep their relative order in a single
 * trailing group with an empty id, so nothing is dropped when only some
 * drivers namespace their slugs.
 */
export function groupModelsByModelProvider<T extends ModelProviderIdentity>(
  models: ReadonlyArray<T>,
): ReadonlyArray<ModelProviderGroup<T>> {
  const byProvider = new Map<string, Array<T>>();
  for (const model of models) {
    const id = model.modelProviderId?.trim() ?? "";
    const bucket = byProvider.get(id);
    if (bucket) {
      bucket.push(model);
    } else {
      byProvider.set(id, [model]);
    }
  }

  const groups = [...byProvider].map(([modelProviderId, bucket]): ModelProviderGroup<T> => ({
    modelProviderId,
    label: modelProviderId === "" ? "" : modelProviderLabel(modelProviderId, bucket),
    models: bucket,
  }));

  // Ungrouped models trail every named provider — a headerless bucket reads
  // better at the end of the list than at the top. Ids break label ties so
  // ordering never depends on the order the models happened to arrive in
  // (two providers can legitimately share a display name).
  const ungrouped = groups.find((group) => group.modelProviderId === "");
  const named = groups.filter((group) => group.modelProviderId !== "");
  named.sort(
    (left, right) =>
      left.label.localeCompare(right.label) ||
      left.modelProviderId.localeCompare(right.modelProviderId),
  );
  return ungrouped ? [...named, ungrouped] : named;
}

/**
 * Whether group headers are worth rendering at all: with a single model
 * provider a header just repeats the list above it. Mixed lists always need
 * them so the named models are not mistaken for the ungrouped ones.
 */
export function shouldRenderModelProviderHeaders<T>(
  groups: ReadonlyArray<ModelProviderGroup<T>>,
): boolean {
  return groups.some((group) => group.modelProviderId !== "");
}
