# agent.runtime_core / loop_execution

## Purpose

Describe how the low-level agent loop executes turns, streams assistant output,
executes tool calls, and decides whether the loop continues or stops.

## Primary Files

- `packages/agent/src/agent-loop.ts`
- `packages/agent/src/types.ts`

## Flow

1. `agentLoop()` starts a fresh run with new prompt messages.
   `agentLoopContinue()` resumes from an existing context whose last message is not `assistant`.
2. Both delegate into `runLoop()` after emitting `agent_start` and initial turn/message events.
3. `runLoop()` maintains two nested control loops:
   the inner loop processes assistant turns, tool calls, and steering messages;
   the outer loop handles follow-up messages that arrive after the agent would otherwise stop.
4. Each assistant turn calls `streamAssistantResponse()`:
   optional `transformContext` runs first, then `convertToLlm`, then the configured `streamFn`.
5. Tool calls are collected from the final assistant message and dispatched via `executeToolCalls()`:
   it chooses sequential or parallel execution depending on global config and per-tool execution mode.
6. `prepareToolCall()` resolves the tool, normalizes arguments, validates args, and applies `beforeToolCall`.
7. Executed tool results pass through `afterToolCall`, then become `toolResult` messages emitted in assistant source order.
8. After each turn, `prepareNextTurn` can mutate the next-turn context/model, and `shouldStopAfterTurn` can terminate the loop gracefully.

## Execution Guarantees

- Assistant messages are streamed into context as partials, then replaced with the finalized message.
- In parallel tool mode, `tool_execution_end` may reflect completion order, but persisted `toolResult` messages still follow assistant source order.
- A tool batch only short-circuits the next assistant turn when every finalized result sets `terminate: true`.

## Key Routing Notes

- For bugs around context conversion or provider calls, stay near `streamAssistantResponse()`.
- For tool ordering, validation, blocking, or termination behavior, stay near `executeToolCalls*()` and `prepareToolCall()`.
- For queue behavior after a turn ends, pair this doc with `agent_state_and_queues.md`.

## Cautions

- The loop works on `AgentMessage[]` until the LLM boundary; do not reason about the transcript as `Message[]` too early.
- Steering and follow-up behavior is split between the low-level loop and the higher-level `Agent` wrapper.
