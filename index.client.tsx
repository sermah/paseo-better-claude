import type { PluginClientContext } from "@getpaseo/plugin/client";
import { AllowlistSettingsScreen } from "./client/allowlist-settings";

export default function contribute(client: PluginClientContext) {
  const remove = client.addSettingsScreen({
    id: "allowlist",
    title: "Claude Artifact entrypoint",
    icon: "PanelsTopLeft",
    Component: AllowlistSettingsScreen,
  });
  return () => remove();
}
