Gives selected Claude Code agents in Paseo the built-in Artifact tool, the one VS Code sessions get. With it an agent can list and read Claude artifacts and Claude Design canvases by URL.

Claude Code shows the Artifact tool only when it runs with `CLAUDE_CODE_ENTRYPOINT=claude-vscode`. Paseo removes that variable from every agent launch. This plugin sets it again when an agent session opens, for new and resumed agents.

## Setup

Open the plugin's settings screen and choose which Claude agents get the tool:

- **Apply to all Claude agents**: every Claude agent on this daemon gets it.
- **Allowed directories**: one absolute path per line. A Claude agent gets the tool when its working directory is one of these paths or inside one. Used only while the switch is off. An empty list affects no agents.

Other providers and read-only history sessions are never affected. A change applies to agents opened after you save. To apply it to an agent that is already running, reload that agent.

## Limits

- The agent identifies itself to Claude Code as VS Code. Features that need a real editor, such as the Artifact `open` action, may fail. Reading and listing artifacts works.
- The variable is the only thing set. `CLAUDECODE` and the other parent-session variables stay cleared.
- A Claude Code or Paseo update can change how the tool is gated, and then this plugin stops working.
- Requires Paseo 0.15.4 or later.
