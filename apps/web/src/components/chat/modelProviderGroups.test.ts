import { describe, expect, it } from "vite-plus/test";

import {
  groupModelsByModelProvider,
  shouldRenderModelProviderHeaders,
} from "./modelProviderGroups";

const model = (
  slug: string,
  modelProviderId: string | undefined,
  subProvider?: string,
): { slug: string; modelProviderId?: string; subProvider?: string } => ({
  slug,
  ...(modelProviderId === undefined ? {} : { modelProviderId }),
  ...(subProvider === undefined ? {} : { subProvider }),
});

describe("groupModelsByModelProvider", () => {
  it("groups by upstream provider and labels from the display name", () => {
    const groups = groupModelsByModelProvider([
      model("openai/gpt-5", "openai", "OpenAI"),
      model("anthropic/claude-opus-5", "anthropic", "Anthropic"),
      model("openai/o3", "openai", "OpenAI"),
    ]);

    expect(groups.map((group) => [group.label, group.models.map((entry) => entry.slug)])).toEqual([
      ["Anthropic", ["anthropic/claude-opus-5"]],
      ["OpenAI", ["openai/gpt-5", "openai/o3"]],
    ]);
  });

  it("orders groups by label, not by input order", () => {
    const groups = groupModelsByModelProvider([
      model("openai/gpt-5", "openai", "OpenAI"),
      model("amazon/nova", "amazon", "Amazon Bedrock"),
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Amazon Bedrock", "OpenAI"]);
  });

  it("falls back to a humanized id when no display name is reported", () => {
    const groups = groupModelsByModelProvider([
      model("some_vendor/model-x", "some_vendor"),
      model("openRouter/model-y", "openRouter", ""),
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Open Router", "Some Vendor"]);
  });

  it("keeps models with no reported provider in one trailing ungrouped bucket", () => {
    const groups = groupModelsByModelProvider([
      model("openai/gpt-5", "openai", "OpenAI"),
      model("local-model", undefined),
      model("anthropic/claude-opus-5", "anthropic", "Anthropic"),
      model("other-local", undefined),
    ]);

    expect(groups.map((group) => [group.modelProviderId, group.label])).toEqual([
      ["anthropic", "Anthropic"],
      ["openai", "OpenAI"],
      ["", ""],
    ]);
    expect(groups[2]?.models.map((entry) => entry.slug)).toEqual(["local-model", "other-local"]);
  });

  it("does not merge providers that share a display name", () => {
    // OpenCode and a fork can both report the label "OpenAI"; the ids are the
    // identity, so collapsing them would hide a whole provider's models.
    const groups = groupModelsByModelProvider([
      model("openai/gpt-5", "openai", "OpenAI"),
      model("azure/gpt-5", "azure", "OpenAI"),
    ]);

    expect(groups.map((group) => group.modelProviderId)).toEqual(["azure", "openai"]);
  });
});

describe("shouldRenderModelProviderHeaders", () => {
  it("is false when nothing reports a model provider", () => {
    const groups = groupModelsByModelProvider([model("a", undefined), model("b", undefined)]);

    expect(shouldRenderModelProviderHeaders(groups)).toBe(false);
  });

  it("is true for a single named provider, since the list would otherwise be unattributed", () => {
    const groups = groupModelsByModelProvider([model("openai/gpt-5", "openai", "OpenAI")]);

    expect(shouldRenderModelProviderHeaders(groups)).toBe(true);
  });

  it("is true for mixed lists so named models are not mistaken for ungrouped ones", () => {
    const groups = groupModelsByModelProvider([
      model("openai/gpt-5", "openai", "OpenAI"),
      model("local", undefined),
    ]);

    expect(shouldRenderModelProviderHeaders(groups)).toBe(true);
  });
});
