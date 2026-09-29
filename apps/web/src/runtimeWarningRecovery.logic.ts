import { resolveExternalWebLinkHost } from "./components/chat/externalLinkContextMenu";

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Recovery affordance a provider attached to a runtime warning — OpenCode ships
 * one on a retry status ("Sign in", "Add credit") — so the user has something to
 * do instead of guessing. It reaches the timeline as an untyped payload field,
 * so the scheme is checked here: only http(s) becomes a clickable row, never a
 * `javascript:` payload dressed as a fix.
 */
export function resolveRuntimeWarningRecoveryLink(
  payload: Record<string, unknown> | null,
): string | null {
  const link = asTrimmedString(payload?.link);
  if (link === null) return null;
  return resolveExternalWebLinkHost(link) === null ? null : link;
}

/**
 * The provider sends a URL rather than a verb, so the row names the destination
 * it would open. The full URL stays in the row's tooltip for the cases where the
 * host is not enough to identify the page.
 */
export function runtimeWarningRecoveryLabel(link: string): string {
  const host = resolveExternalWebLinkHost(link);
  return `Open ${host === null ? link : host.replace(/^www\./, "")}`;
}
