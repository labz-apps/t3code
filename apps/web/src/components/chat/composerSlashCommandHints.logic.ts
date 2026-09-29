import { getProviderSlashCommandsForSlashMenu } from "@t3tools/client-runtime/providerSkills";
import type { ServerProviderSkill, ServerProviderSlashCommand } from "@t3tools/contracts";

/** Model slugs run long; the row is narrow, so a pinned value is clipped to one line. */
const MAX_HINT_VALUE_LENGTH = 32;

type ProviderSlashCommandHintKind = "model" | "agent" | "subtask" | "mcp" | "skill";

interface ProviderSlashCommandHint {
  readonly kind: ProviderSlashCommandHintKind;
  readonly label: string;
}

function shorten(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= MAX_HINT_VALUE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_HINT_VALUE_LENGTH - 1)}…`;
}

/**
 * What a command does beyond running a prompt. OpenCode reports a command's
 * source plus the agent, model and subtask flag it forces, so the composer can
 * say up front that `/review` runs on `gpt-5` in a subtask rather than letting
 * the user find out after the turn starts. A plain command yields nothing, which
 * keeps the suffix off the rows that do not need it.
 */
export function resolveProviderSlashCommandHints(
  command: Pick<ServerProviderSlashCommand, "source" | "agent" | "model" | "subtask">,
): ProviderSlashCommandHint[] {
  const hints: ProviderSlashCommandHint[] = [];
  if (command.model) {
    hints.push({ kind: "model", label: `model: ${shorten(command.model)}` });
  }
  if (command.agent) {
    hints.push({ kind: "agent", label: `agent: ${shorten(command.agent)}` });
  }
  if (command.subtask) {
    hints.push({ kind: "subtask", label: "Subtask" });
  }
  if (command.source === "mcp") {
    hints.push({ kind: "mcp", label: "MCP" });
  }
  if (command.source === "skill") {
    hints.push({ kind: "skill", label: "Skill" });
  }
  return hints;
}

/**
 * A skill and a skill-backed command are two ways to run one skill, and the
 * composer offers both: the skill row inserts `$name`, which the server
 * dispatches from any position in the prompt and the transcript highlights,
 * while `/name` only expands when it opens the whole message. So the skill row
 * wins — by name, and by `source: "skill"` for the commands whose name the
 * provider namespaces and would therefore not collide. A skill-backed command
 * whose skill is not in the list is the only affordance left, so it stays.
 */
export function providerSlashCommandsForComposerMenu(
  commands: ReadonlyArray<ServerProviderSlashCommand>,
  visibleSkills: ReadonlyArray<ServerProviderSkill>,
): ServerProviderSlashCommand[] {
  const deduped = getProviderSlashCommandsForSlashMenu(commands, visibleSkills);
  if (visibleSkills.length === 0) {
    return deduped;
  }
  return deduped.filter((command) => command.source !== "skill");
}
