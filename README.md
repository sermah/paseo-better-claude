# Claude Artifact entrypoint for Paseo

A [Paseo](https://paseo.sh) plugin that gives Claude Code agents launched by Paseo the built-in `Artifact` tool.

## Problem

Claude Code exposes the `Artifact` tool (list, read and publish claude.ai artifacts, including Claude Design canvases) only when it runs with `CLAUDE_CODE_ENTRYPOINT=claude-vscode`. That is what the VS Code extension sets.

Paseo runs the same Claude Code binary, but it removes `CLAUDE_CODE_ENTRYPOINT` from every agent's environment. It does that so a daemon started from inside a Claude Code session does not leak the parent session's identity. Paseo agents therefore run as `sdk-cli` and have no `Artifact` tool. Setting the variable in `providers.claude.env` doesn't help, because Paseo strips it there too.

## Solution

Paseo lets a plugin's session-open hook (`agent.session_open`) supply an explicit client identity, and passes that through to the launch. This plugin uses the hook to set `CLAUDE_CODE_ENTRYPOINT=claude-vscode` for the Claude agents you choose. It runs on every session open, so new, resumed and reloaded agents all get it.

Only that one variable is set. `CLAUDECODE` and the other parent-session variables stay cleared, so nested-session detection is unaffected. Other providers and read-only history sessions are left alone.

## Setup

Requires Paseo 0.15.4 or later.

1. Enable plugins on the daemon, either in **Settings → Plugins** or with:

   ```bash
   paseo daemon config set pluginsEnabled true
   ```

2. Install the plugin:

   ```bash
   paseo plugin install github:sermah/paseo-better-claude
   ```

3. Open **Settings → Plugins → Claude Artifact entrypoint** and choose the agents:
   - **Apply to all Claude agents**: every Claude agent on this daemon gets the tool.
   - **Allowed directories**: one absolute path per line. An agent gets the tool when its working directory is one of these paths or inside one. An empty list affects no agents.

Settings apply to agents opened after you save. Reload a running agent to apply them there.

To check, ask a new agent to run `printenv CLAUDE_CODE_ENTRYPOINT`. It should print `claude-vscode`, and `Artifact` should be in the agent's tool list. `paseo plugin logs claude-artifact-entrypoint` logs one line per session open, showing whether the variable was applied.

## Limits

- The agent identifies itself to Claude Code as VS Code. Features that need a real editor, such as the `Artifact` `open` action, may fail. Listing and reading work.
- This depends on how Claude Code gates the tool and on Paseo's hook. An update to either can break it.

## Development

```bash
npm install
npm run typecheck
paseo plugin install "$PWD"          # install from this checkout
paseo plugin reload claude-artifact-entrypoint
```

Paseo provides `@getpaseo/plugin` and `zod` at runtime. `node_modules` is only needed for typechecking.

## License

Public domain, under [the Unlicense](LICENSE). Do whatever you want with it.
