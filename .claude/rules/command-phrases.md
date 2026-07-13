# Command phrases (session boundaries)

Linked from [`CLAUDE.md`](../../CLAUDE.md) — read this before acting on any message that looks like it contains one of the phrases below.

This repo uses a small set of **command phrases** so any AI agent — Claude or otherwise — recognizes the same session boundaries the same way, without depending on a tool-specific feature (like a chat UI's own "mark chapter" affordance, which is not a commit and won't survive outside that UI). Match phrases as whole words, case-insensitively, wherever they appear in a message — not just at the start of a line.

| Phrase | Meaning | Agent behavior |
| --- | --- | --- |
| `session start: <description>` | Begin a new unit of work | Treat `<description>` as the task for everything that follows. Do **not** commit anything yet — just do the work. If the description is missing (just `session start`), infer the task from the rest of the message. |
| `session end` | Close out the current unit of work | Stage **only the files actually touched** since the matching `session start` (never a blanket `git add -A`/`git add .`) and create one git commit. This phrase *is* the explicit user request to commit — it satisfies "only commit when asked," it doesn't bypass it. |

## Commit format on `session end`

- **Title**: short imperative summary of what changed (derived from the `session start` description if one was given, otherwise from the diff) — matches this repo's existing commit style (see `git log`).
- **Body**: a bullet list, one bullet per distinct change or file group — not a restatement of the title, and not prose paragraphs.
- Follow the repo's normal commit conventions otherwise (new commit, never `--amend`; never `--no-verify`; don't push unless separately asked).

## Edge cases

- `session end` with no preceding `session start` in the conversation → commit whatever is currently uncommitted, with a message inferred from the diff.
- `session end` with nothing changed → say so; never create an empty commit.
- Multiple distinct changes inside one `session start`/`session end` pair → still one commit (one session = one commit), unless the user's description makes it obvious the work is two unrelated things.
- A message that does the work but uses **neither** phrase → do the work, but don't commit; mention that it's ready and uncommitted.

## Extending this table

More phrases will be added here over time (e.g. a hypothetical `session pause` or `session note: <text>`). Don't assume this table is exhaustive — a phrase following the `session <word>[: <description>]` shape that isn't listed yet should be treated as a request to add a row here (ask the user what behavior they want), not ignored.
