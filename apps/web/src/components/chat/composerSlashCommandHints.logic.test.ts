import type { ServerProviderSkill, ServerProviderSlashCommand } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import {
  providerSlashCommandsForComposerMenu,
  resolveProviderSlashCommandHints,
} from "./composerSlashCommandHints.logic";

function skill(name: string): ServerProviderSkill {
  return { name, enabled: true, path: `/skills/${name}/SKILL.md` };
}

describe("resolveProviderSlashCommandHints", () => {
  it("says nothing about a plain command", () => {
    expect(resolveProviderSlashCommandHints({ source: "command" })).toEqual([]);
    expect(resolveProviderSlashCommandHints({})).toEqual([]);
  });

  it("names the agent and model the command pins", () => {
    expect(
      resolveProviderSlashCommandHints({
        source: "command",
        agent: "plan",
        model: "anthropic/claude-opus-4-5",
      }),
    ).toEqual([
      { kind: "model", label: "model: anthropic/claude-opus-4-5" },
      { kind: "agent", label: "agent: plan" },
    ]);
  });

  it("truncates a long pinned value so the row stays one line", () => {
    const [hint] = resolveProviderSlashCommandHints({
      model: "anthropic/claude-opus-4-5-20260219-thinking-128k",
    });

    expect(hint?.label).toBe("model: anthropic/claude-opus-4-5-20260…");
  });

  it("marks a command that runs as a subtask", () => {
    expect(resolveProviderSlashCommandHints({ source: "command", subtask: true })).toEqual([
      { kind: "subtask", label: "Subtask" },
    ]);
  });

  it("attributes an MCP prompt", () => {
    expect(resolveProviderSlashCommandHints({ source: "mcp" })).toEqual([
      { kind: "mcp", label: "MCP" },
    ]);
  });

  it("attributes a skill-backed command", () => {
    expect(resolveProviderSlashCommandHints({ source: "skill" })).toEqual([
      { kind: "skill", label: "Skill" },
    ]);
  });

  it("does not attribute a command whose source the driver does not report", () => {
    expect(resolveProviderSlashCommandHints({ source: "unknown" })).toEqual([]);
  });
});

describe("providerSlashCommandsForComposerMenu", () => {
  const hiddenSkills: ReadonlyArray<ServerProviderSkill> = [];

  it("keeps every command when the skills list is hidden", () => {
    const commands: ReadonlyArray<ServerProviderSlashCommand> = [
      { name: "unslop", source: "skill" },
      { name: "review" },
    ];

    expect(providerSlashCommandsForComposerMenu(commands, hiddenSkills)).toEqual(commands);
  });

  it("drops a skill-backed command the skills list already offers", () => {
    const commands: ReadonlyArray<ServerProviderSlashCommand> = [
      { name: "skill:unslop", source: "skill" },
      { name: "review", source: "command" },
    ];

    expect(providerSlashCommandsForComposerMenu(commands, [skill("unslop")])).toEqual([
      commands[1],
    ]);
  });

  it("drops a non-skill command that collides with a visible skill name", () => {
    const commands: ReadonlyArray<ServerProviderSlashCommand> = [
      { name: "Unslop" },
      { name: "review" },
    ];

    expect(providerSlashCommandsForComposerMenu(commands, [skill("unslop")])).toEqual([
      commands[1],
    ]);
  });

  it("returns a fresh list so the composer cannot mutate the snapshot", () => {
    const commands: ReadonlyArray<ServerProviderSlashCommand> = [{ name: "review" }];

    expect(providerSlashCommandsForComposerMenu(commands, hiddenSkills)).not.toBe(commands);
  });
});
