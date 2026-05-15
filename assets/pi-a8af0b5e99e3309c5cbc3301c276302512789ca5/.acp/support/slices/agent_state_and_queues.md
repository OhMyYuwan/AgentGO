# agent.runtime_core / harness_support

## Purpose

Describe how the high-level `Agent` wrapper owns mutable transcript state,
queueing, abort behavior, and listener lifecycle on top of the low-level loop.

## Primary Files

- `packages/agent/src/agent.ts`
- `packages/agent/src/agent-loop.ts`

## Flow

1. `Agent` stores mutable state:
   transcript messages, tools, current streaming message, pending tool-call ids, and error state.
2. `prompt()` normalizes text/messages into `AgentMessage[]` and runs `runAgentLoop()`.
3. `continue()` resumes only when the current transcript tail is valid; otherwise it may drain queued steering/follow-up messages first or throw.
4. `steer()` and `followUp()` enqueue messages into separate `PendingMessageQueue`s.
5. `createLoopConfig()` bridges high-level state into low-level loop callbacks:
   it supplies `convertToLlm`, `transformContext`, API-key resolution, queue drains, tool hooks, and next-turn hooks.
6. `runWithLifecycle()` owns the active abort controller and ensures `finishRun()` clears runtime-owned state after the loop or failure path settles.
7. `processEvents()` reduces loop events into local mutable state before notifying subscribed listeners.

## Queue Semantics

- Steering messages are injected after the current assistant turn finishes.
- Follow-up messages are only consumed once the loop would otherwise stop.
- Queue drain behavior is configurable with `one-at-a-time` vs `all`.

## Error and Abort Semantics

- `abort()` cancels the active run via the stored abort controller.
- `handleRunFailure()` synthesizes an assistant failure message with `stopReason: "aborted"` or `"error"` and then emits terminal lifecycle events.
- `waitForIdle()` resolves only after the active run and awaited listeners have settled.

## Key Routing Notes

- Questions about visible session state, listener timing, queue draining, or abort behavior should start in `agent.ts`, not the lower-level loop.
- Questions about actual assistant/tool turn sequencing should be checked against `agent-loop.ts` in parallel.

## Cautions

- `processEvents()` mutates `state.messages` only on `message_end`; partial streaming lives in `streamingMessage`.
- The high-level agent can surface queued messages during `continue()`, which means "continue behavior" is partly a queue policy question.
