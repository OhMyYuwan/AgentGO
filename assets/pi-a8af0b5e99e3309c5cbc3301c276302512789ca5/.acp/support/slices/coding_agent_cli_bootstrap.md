# coding_agent.runtime / cli_bootstrap

## Purpose

Describe how the `pi` coding agent enters from the Node CLI, resolves runtime
mode and session context, builds runtime services, and finally hands off to
interactive, print, or RPC execution.

## Primary Files

- `packages/coding-agent/src/cli.ts`
- `packages/coding-agent/src/main.ts`
- `packages/coding-agent/src/cli/args.ts`
- `packages/coding-agent/src/core/agent-session-runtime.ts`
- `packages/coding-agent/src/core/agent-session-services.ts`

## Flow

1. `src/cli.ts` is the executable entry:
   it sets process-wide runtime flags and delegates to `main(process.argv.slice(2))`.
2. `main.ts` parses CLI args, handles package/config subcommands, export/version/help/list-models, and decides the app mode:
   `interactive`, `print`, `json`, or `rpc`.
3. Session context is resolved before runtime services are built:
   `createSessionManager()` handles `--session`, `--resume`, `--continue`, and `--fork`, including cross-project session fork prompts.
4. The final runtime `cwd` is derived from the selected session, not blindly from startup `cwd`.
5. `createAgentSessionRuntime()` builds runtime services via `createAgentSessionServices()` and then materializes the session with `createAgentSessionFromServices()`.
6. After diagnostics and initial message preparation, `main.ts` dispatches to:
   `runRpcMode`, `InteractiveMode`, or `runPrintMode`.

## Key Routing Notes

- The startup path is not just CLI parsing; it also resolves migrations, settings, session cwd reconciliation, auth storage, resource loading, and scoped model selection.
- When reasoning about startup bugs, read `main.ts` before drilling into lower-level service factories.
- Questions about `--fork`, `--resume`, or missing session cwd should stay in `main.ts` and `session-manager`/`session-cwd` territory before touching UI code.

## Cautions

- `main.ts` is a large orchestrator. Do not infer sub-flow ownership from imports alone; follow the explicit sequence in the function body.
- Runtime diagnostics are accumulated before fatal exit checks. Issues can originate from settings, extensions, model resolution, or runtime service creation.
