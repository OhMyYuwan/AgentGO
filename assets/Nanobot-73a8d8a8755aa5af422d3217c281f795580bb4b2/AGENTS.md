# AGENTS.md

This directory is an ACP-managed reference project for `nanobot`.

```text
nanobot/
├── AGENTS.md
├── acp-protocol/              # ACP consumer package; treat as read-only
├── .acp/                      # nanobot ACP state
│   ├── version.yaml
│   ├── kernel/
│   │   ├── requests/
│   │   ├── plans/
│   │   └── changes/
│   ├── support/
│   │   ├── AGENT.md
│   │   ├── PROJECT_MAP.yaml
│   │   ├── LOAD_RULES.yaml
│   │   └── CHANGE_POLICY.yaml
│   └── capability/
│       └── capabilities.yaml
├── nanobot/                   # Python package source
├── webui/                     # React/Vite WebUI
├── bridge/                    # TypeScript bridge service
├── tests/                     # Python and WebUI tests
└── docs/                      # user/developer docs
```

## Protocol

ACP behavioral instructions are in `acp-protocol/acp_agent_playbook.yaml`.
Load this file at bootstrap before broad repository exploration.

`acp-protocol/` is the protocol authority for this project. Treat it as
read-only and do not store project-local state there.

## Application ACP State

The project's ACP state is in `.acp/`.

Entry point: `.acp/version.yaml`

When ACP is active:

1. Read `.acp/version.yaml`.
2. Read the quick entry block in `.acp/support/AGENT.md`.
3. Use `.acp/support/PROJECT_MAP.yaml` for module routing.
4. Use `.acp/support/LOAD_RULES.yaml` before deeper context expansion.
5. Use `.acp/capability/capabilities.yaml` for capability-first interpretation.
6. Use Request -> Plan -> Change for mutation-oriented work.
7. Store kernel objects under `.acp/kernel/`.

## Active Profile

This project is initialized as `full`:

- `kernel`: required
- `capability`: enabled
- `support`: enabled

The support layer maps nanobot as a Python 3.11+ lightweight personal AI
assistant framework with provider adapters, channel integrations, CLI,
OpenAI-compatible API/WebSocket surfaces, memory/session services, security
guardrails, cron/heartbeat services, a React WebUI, and a TypeScript bridge.

