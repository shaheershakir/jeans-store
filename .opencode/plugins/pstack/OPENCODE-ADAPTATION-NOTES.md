# OpenCode adaptation notes

pstack (`cursor/plugins` → `pstack/`, v0.14.5) was installed into `.opencode/skills/`, `.opencode/agents/`, and mirrored verbatim here. All changes below were applied **only** to the copies under `.opencode/skills/` and `.opencode/agents/` — the files in this directory are the untouched upstream plugin.

## Tooling / environment renames

- `subagent_type: generalPurpose` / `"generalPurpose"` → `general` (OpenCode's subagent type) across all skills and reviews.
- `~/.cursor/rules/pstack-models.mdc` → `.opencode/pstack-models.md` (model-role config read by `poteto-mode`, `how`, `why`, `arena`, `swarm`, `architect`, `interrogate`, `reflect`, `setup-pstack`).
- `.cursor/skills` → `.opencode/skills`, `~/.cursor/skills` → `~/.config/opencode/skills` (skill authoring and verification-skill paths).

## Model defaults generalized

Cursor-only model slugs replaced with role descriptions (single-model environments run every role on the session model):

- `claude-fable-5-thinking-max` → "a strong reasoning model"
- `gpt-5.6-sol-max` → "a precise instruction-following model"
- `grok-4.6-fast-xhigh` → "a fast code model"
- `claude-opus-5-thinking-xhigh` → "a second strong reasoning model"

`poteto-mode`'s Task-call defaults paragraph was rewritten: keep the tiering logic (judgment vs. instruction-following vs. mechanical), but if OpenCode exposes no model choice, run every role on the session model.

## Features with no OpenCode equivalent (called out inline, not removed)

- `/deslop` and `cursor-team-kit`: `poteto-mode` triggers and `playbooks/opening-a-pr.md`, `autopilot-full.md`, `autopilot-stack.md` now say "run project checks + slop self-review" and note the skill is Cursor-only.
- `control-ui` / `control-cli`: `poteto-mode` and `playbooks/multi-phase-plan.md` now say "reproduce on the real surface yourself (`npm run dev`)" and note these ship in Cursor's `cursor-team-kit`.
- Cursor's built-in `create-skill`: `poteto-mode`, `automate-me`, `reflect`, `authoring-a-skill` playbook now point to hand-authoring SKILL.md per the authoring-a-skill playbook.
- Cursor's built-in `/loop`: `playbooks/autonomous-run.md` and `bug-fix.md` now say to keep the loop via your own re-check cadence; autopilot playbooks still mention `/loop` in audit-tick prose (treat as: periodic re-read of the playbook).
- Cursor's built-in babysit skill: disambiguation line removed from `poteto-mode`; the local Babysit playbook is the only one here.
- "a Cursor restart" → "an OpenCode restart"; `setup-pstack` model detection now mentions `opencode models`.

## Agent files

- `agents/poteto-agent.md`: `is_background: true` → `mode: subagent`.
- `agents/comment-sicko.md`: added `mode: subagent`.

## Intentionally left as-is

- Transcript paths (`~/.cursor/projects/...`, `agent-transcripts/`) in `recall`, `reflect`, `show-me-your-work`, `eval`, `session-pickup`: OpenCode transcripts live elsewhere; these skills degrade gracefully (skip the transcript step when the path doesn't exist).
- Graphite (`gt`) references in shipping/autopilot playbooks: optional tool; fall back to plain git/PR flows.
- `scripts/` (watch-pr, check-plan, worktree-audit): shell/bun, Cursor-agnostic except `worktree-audit.sh`'s transcript-dir comment.
- `make-bot-ui`: inherently tied to Cursor's automation webhooks.
- Frontmatter keys OpenCode ignores (`icon`, `color`, `reminder`, `disable-model-invocation`): harmless.
