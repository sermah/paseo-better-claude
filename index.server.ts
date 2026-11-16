import type { PluginServerContext } from "@getpaseo/plugin/server";
import {
  ARTIFACT_ENTRYPOINT,
  type AllowlistValues,
  allowlistSettings,
  shouldApply,
} from "./shared/settings";

const EMPTY: AllowlistValues = { applyToAll: false, cwdPrefixes: [] };

export default function contribute(server: PluginServerContext) {
  const settings = server.registerSettings(allowlistSettings);
  let values: AllowlistValues = EMPTY;
  let loaded: Promise<void> | null = null;

  const apply = (state: Awaited<ReturnType<typeof settings.read>>) => {
    if (state.status === "ready") {
      values = state.values;
    } else {
      console.error(`Settings are invalid, applying to no agents: ${state.error}`);
      values = EMPTY;
    }
  };

  const ensureLoaded = () => {
    loaded ??= settings.read().then(apply, (error: unknown) => {
      loaded = null;
      console.error("Failed to read settings", error);
    });
    return loaded;
  };

  const unsubscribe = settings.subscribe(apply);
  void ensureLoaded();

  const off = server.before("agent.session_open", async ({ request }) => {
    if (request.provider !== "claude" || request.purpose !== "interactive") return;
    await ensureLoaded();
    const applied = shouldApply(request.cwd, values);
    console.log(
      `session_open agent=${request.agentId} reason=${request.reason} cwd=${request.cwd} applyToAll=${values.applyToAll} applied=${applied ? "yes" : "no"}`,
    );
    if (!applied) return;
    return {
      ...request,
      env: { ...request.env, CLAUDE_CODE_ENTRYPOINT: ARTIFACT_ENTRYPOINT },
    };
  });

  return () => {
    off();
    unsubscribe();
  };
}
