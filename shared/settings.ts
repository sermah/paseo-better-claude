import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

/** Entrypoint value that makes Claude Code expose the built-in Artifact tool. */
export const ARTIFACT_ENTRYPOINT = "claude-vscode";

export const allowlistSettings = defineSettings({
  id: "allowlist",
  scope: "host",
  version: 1,
  schema: z.object({
    /** Every interactive Claude agent gets the entrypoint; the allowlist is ignored. */
    applyToAll: z.boolean().default(false),
    /** Absolute directory prefixes. Claude agents whose cwd is inside one get the entrypoint. */
    cwdPrefixes: z.array(z.string()).default([]),
  }),
});

export type AllowlistValues = { applyToAll: boolean; cwdPrefixes: readonly string[] };

/** True when an interactive Claude agent opened in cwd should get the entrypoint. */
export function shouldApply(cwd: string, values: AllowlistValues): boolean {
  return values.applyToAll || matchesAllowlist(cwd, values.cwdPrefixes);
}

function trimTrailingSlashes(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** Keeps non-empty absolute paths, trimmed and de-duplicated. */
export function normalizePrefixes(prefixes: readonly string[]): string[] {
  const result: string[] = [];
  for (const raw of prefixes) {
    const value = raw.trim();
    if (!value.startsWith("/")) continue;
    const normalized = trimTrailingSlashes(value);
    if (!result.includes(normalized)) result.push(normalized);
  }
  return result;
}

/** True when cwd equals a prefix or lies inside it (path-segment boundary). */
export function matchesAllowlist(cwd: string, prefixes: readonly string[]): boolean {
  const target = trimTrailingSlashes(cwd);
  return normalizePrefixes(prefixes).some(
    (prefix) => prefix === "/" || target === prefix || target.startsWith(`${prefix}/`),
  );
}
