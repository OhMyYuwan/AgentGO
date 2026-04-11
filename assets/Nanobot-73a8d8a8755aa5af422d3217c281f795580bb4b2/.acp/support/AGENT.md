```yaml
role: quick_entry
project:
  name: nanobot
  description: Lightweight personal AI assistant framework with Python agent runtime, channel integrations, WebUI, bridge service, and deployment tooling.
acp_version: "1.0.0"
profiles:
  kernel: required
  capability: enabled
  support: enabled
active_request_id: null
last_completed_request_id: REQ-0001
entry_order:
  - .acp/support/AGENT.md
  - .acp/support/PROJECT_MAP.yaml
  - .acp/support/LOAD_RULES.yaml
  - .acp/support/CHANGE_POLICY.yaml
  - .acp/capability/capabilities.yaml
primary_capabilities:
  - project-foundation
  - python-agent-runtime
  - llm-provider-layer
  - channel-integrations
  - api-and-websocket
  - webui
  - bridge-service
  - persistence-and-memory
  - security-and-tools
  - docs-and-deployment
agent_hint: Repository root is the application source root. Use capability-first routing; do not scan .git, node_modules, dist, build artifacts, or runtime user config. Treat acp-protocol/ as read-only.
```

# nanobot Agent Guide

## ACP Configuration

```yaml
acp:
  kernel_root: .acp/kernel
  support_root: .acp/support
  capability_root: .acp/capability

  execution_order:
    - AGENT.md
    - PROJECT_MAP.yaml
    - LOAD_RULES.yaml
    - CHANGE_POLICY.yaml
    - capabilities.yaml
```

## Project Overview

`nanobot` is a Python 3.11+ lightweight personal AI assistant framework. The
core package owns the agent loop, context/memory/session management, LLM
provider adapters, channel plugins, command routing, cron/heartbeat services,
security/tooling, and an OpenAI-compatible API/WebSocket surface. The repository
also contains a React/Vite WebUI, a TypeScript bridge service, documentation,
Docker packaging, and an extensive test suite.

## Working Rules

- Read `PROJECT_MAP.yaml` before non-trivial scans.
- Read `LOAD_RULES.yaml` before deeper expansion; respect forbidden paths.
- Read `CHANGE_POLICY.yaml` before editing protected or high-risk files.
- Every mutation goes through Request -> Plan -> Change. Save kernel objects
  under `.acp/kernel/`.
- Keep `acp-protocol/` read-only.
- Do not edit local runtime user config such as `~/.nanobot/config.json` unless
  a user explicitly asks for a local operational change.

## Code Layout Snapshot

```text
.
├── nanobot/                    Python package
│   ├── agent/                  core agent loop, runner, hooks, memory, skills
│   ├── api/                    OpenAI-compatible API server
│   ├── bus/                    event queue and event contracts
│   ├── channels/               chat/channel integrations
│   ├── cli/                    Typer CLI and onboarding
│   ├── command/                slash command routing
│   ├── config/                 settings schema, loader, paths
│   ├── cron/                   scheduled task service
│   ├── heartbeat/              heartbeat service
│   ├── providers/              LLM/image/transcription provider adapters
│   ├── security/               network and execution guardrails
│   ├── session/                session persistence and history
│   ├── skills/                 built-in skill docs
│   ├── templates/              prompt/context templates
│   ├── utils/                  shared helpers, documents, media, restart
│   └── web/                    web package surface
├── webui/                      React 18 + Vite + Tailwind chat UI
├── bridge/                     TypeScript bridge/WhatsApp service
├── tests/                      pytest and WebUI test coverage
├── docs/                       documentation and guides
├── images/                     README/docs images
├── case/                       demo GIFs
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
└── pyproject.toml
```

## How To Start a New Task

1. Classify the request by capability and slice in `capabilities.yaml`.
2. Load only the files listed for that slice in `LOAD_RULES.yaml`.
3. Create the next `REQ-NNNN.yaml` under `.acp/kernel/requests/`.
4. Create the linked `PLN-NNNN.md` under `.acp/kernel/plans/`.
5. Execute within the plan's file matrix. Re-plan if scope expands.
6. Record `CHG-NNNN.yaml` under `.acp/kernel/changes/`.

## Recent Kernel Activity

- `REQ-0001` / `PLN-0001` / `CHG-0001`: initialized nanobot as an ACP-managed
  reference project and generated support/capability routing.

