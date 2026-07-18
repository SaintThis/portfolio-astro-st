# Rule generation

Linked from [`CLAUDE.md`](../../CLAUDE.md). Governs when and how the agent creates or updates a `.claude/rules/*.md` file off the back of a feature or update the user describes — so best practices compound across sessions instead of being re-derived, forgotten, or hallucinated each time.

## Why this exists

The user wants every future feature/update to optionally teach the agent a durable convention, without having to re-explain it next session. This file is the protocol for recognizing when that's warranted and doing it consistently, matching this repo's existing rule-file style.

## How rules actually get fed into a new session

This repo's session tooling auto-loads `CLAUDE.md` plus the full content of every `.md` file it links from the "Agent rules" section, into context **before the first tool call** of each new session (confirmed empirically: all five original rule files arrived verbatim in-context at the start of the session that added this file). Consequences:

1. A new or edited rule file only takes effect next session if it's **linked from `CLAUDE.md`'s "Agent rules" section**, in the same commit. An orphaned rule file under `.claude/rules/` that isn't linked will not be auto-loaded.
2. Only `.md` files get this treatment. Keep operational logs and rules in Markdown — this is why [`known-errors.md`](../known-errors.md) is `.md`, not `.txt`.

## When to generate or update a rule

Trigger: the user describes a new feature, integration, external service, data source, naming pattern, or a fix for a class of bug — anything that establishes a convention future work should follow. Ask:

> If a fresh session next week had to build on this, what would it need to know that isn't derivable just by reading the code?

If the answer is non-trivial, it's rule-worthy. Skip it for one-off content edits, copy tweaks, or anything already covered by an existing rule file (extend that file instead — see the table in `CLAUDE.md`).

## What makes a good rule (match the existing bar)

- **Concrete, not generic.** Real file paths, function/prop/token names, exact values — not restated general Astro/React/web-dev advice the model already knows. `component-inventory.md`'s prop tables and `theme-tokens.md`'s token tables are the bar.
- **One topic per file.** Extend an existing file (`astro-vite-best-practices.md`, `data-flow.md`, etc.) if the topic overlaps; only create a new file for a genuinely new topic.
- **Include the why.** The incident, constraint, or decision that produced the convention, so future edge cases can be judged rather than followed blindly — same reasoning as the feedback/project memory format.
- **Short.** A checklist or table, not an essay.

## Workflow

1. After implementing a feature/fix that establishes a new convention, apply the test above.
2. If it's rule-worthy: write or extend the relevant `.claude/rules/<topic>.md` file in the **same commit** as the feature.
3. Add or update its one-line entry in `CLAUDE.md`'s "Agent rules" section — this is what makes it load next session.
4. If the change was a bug/build/run error (not a feature), also append an entry to [`known-errors.md`](../known-errors.md) per its own format, and cross-link it from the new rule if relevant (see `astro-vite-best-practices.md` for the pattern).
5. Say so in the end-of-turn summary — a rule was added/updated and why. Don't silently grow the ruleset with no visible trace.
6. No need to ask permission first — this is a docs-only, local, reversible change — but surface it, since it edits the agent's own operating instructions.

## Non-goals

- Don't write a rule for a speculative feature that hasn't been built yet.
- Don't duplicate what `ARCHITECTURE.md`/`DESIGN.md` already cover (project architecture, not agent behavior — `CLAUDE.md` already draws this line).
- Don't over-document trivial changes. Most edits need zero new rules; that's the common case, not the exception.
