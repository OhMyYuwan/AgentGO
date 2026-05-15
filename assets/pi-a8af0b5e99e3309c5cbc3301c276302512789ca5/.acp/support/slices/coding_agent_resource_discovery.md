# coding_agent.resources / resource_discovery

## Purpose

Describe how `pi` discovers, merges, deduplicates, and annotates project/user
resources such as AGENTS files, skills, prompt templates, themes, and
extensions.

## Primary Files

- `packages/coding-agent/src/core/resource-loader.ts`
- `packages/coding-agent/src/core/skills.ts`
- `packages/coding-agent/src/core/prompt-templates.ts`
- `packages/coding-agent/src/core/package-manager.ts`
- `.pi/`

## Flow

1. `DefaultResourceLoader.reload()` is the central refresh path.
2. It reloads settings, resolves package-managed resources, resolves CLI-provided temporary paths, and merges them with project/user defaults.
3. Extensions are loaded first because they can contribute additional resource paths and runtime behaviors.
4. Skills, prompt templates, and themes are then reloaded from the merged path sets:
   `updateSkillsFromPaths()`, `updatePromptsFromPaths()`, and `updateThemesFromPaths()`.
5. `loadProjectContextFiles()` walks from the working directory to `/`, collecting `AGENTS.md` / `CLAUDE.md` context files plus the global agent-dir context file.
6. System prompt and append-system-prompt text are resolved from explicit CLI inputs or discovered `SYSTEM.md` / `APPEND_SYSTEM.md` files.

## Resource Semantics

- Skills:
  `skills.ts` discovers `SKILL.md`, validates frontmatter/name/description rules, respects ignore files, and treats a directory containing `SKILL.md` as a skill root.
- Prompt templates:
  `prompt-templates.ts` loads `.md` files, parses frontmatter, deduplicates by command name, and supports argument substitution patterns such as `$1`, `$@`, and `${@:N}`.
- Themes:
  theme JSON files are loaded and deduplicated by theme name.
- Extensions:
  load order matters; conflicts are reported as diagnostics rather than preventing all loading.

## Key Routing Notes

- If the problem is "why didn't my skill/prompt/theme load?", start in `resource-loader.ts`, then jump to the specific loader (`skills.ts`, `prompt-templates.ts`, or theme loading helpers).
- `.pi/` is a project-local customization surface and should be read together with `resource-loader.ts` when debugging repository-scoped prompts/extensions.
- Source provenance is tracked with `SourceInfo`; this matters when explaining where a loaded resource came from.

## Cautions

- Resource merging uses canonicalized paths and precedence order; duplicate-looking paths may collapse.
- The loader can run with flags like `--no-skills` or `--no-context-files`, so absence of resources may be intentional rather than a discovery bug.
