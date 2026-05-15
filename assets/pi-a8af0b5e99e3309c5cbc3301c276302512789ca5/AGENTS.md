```yaml
quick_entry:
  project_name: pi-monorepo
  project_type: library
  capabilities:
    - project.acp_bootstrap
    - project.routing.project_map
    - workspace.packages
    - coding_agent.runtime
    - coding_agent.resources
    - ai.unified_provider_api
    - agent.runtime_core
    - tui.terminal_ui
    - web_ui.chat_surface
  active_request_id: req_20260515_pi_acp_bootstrap
  status: active development
  next_step: read PROJECT_MAP.yaml for root and package routing
```

# pi Agent Guide

## ACP Configuration

```yaml
acp:
  kernel_root: .acp/kernel
  support_root: .acp/support

  execution_order:
    - AGENT.md
    - PROJECT_MAP.yaml
    - LOAD_RULES.yaml
    - CHANGE_POLICY.yaml
    - capabilities.yaml
```

## Project Overview

`pi` is a TypeScript monorepo for a coding-agent stack. The root workspace
coordinates package builds and checks; `packages/ai` implements provider/model
abstractions, `packages/agent` implements the tool-calling agent loop,
`packages/coding-agent` provides the end-user CLI/runtime, `packages/tui`
provides terminal UI primitives, and `packages/web-ui` provides browser-facing
chat components.

## Working Rules

- Read `PROJECT_MAP.yaml` before scanning package directories.
- Use `LOAD_RULES.yaml` to route by capability or semantic target.
- Treat `.pi/` as local pi resources, not ACP metadata.
- Prefer package entry files and root manifests before drilling into deep implementation paths.
- Keep ACP kernel updates append-only for new work; do not rewrite historical request/plan/change objects.

## Notes

- Root `AGENTS.md` contains repository-specific engineering rules and command constraints.
- The initial ACP layer is intentionally package-level. Add narrower slice docs only when future work needs them.
- `packages/web-ui/example/` is an example app surface, not the primary library API.
