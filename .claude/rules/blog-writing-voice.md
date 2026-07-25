# Blog writing — voice, hook, and structure

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this **before drafting or editing any `src/content/blog/*.md` post**. It exists so every new post lands in the same voice the existing ten were written in — expressive, convincing, and catchy — instead of drifting into generic "10 tips" filler. The bar is the posts already in `src/content/blog/`; when in doubt, open [`flutter-best-practices-context-and-providers.md`](../../src/content/blog/flutter-best-practices-context-and-providers.md) or [`shipping-with-an-ai-coding-agent.md`](../../src/content/blog/shipping-with-an-ai-coding-agent.md) and match them.

This is a **voice/craft** rule. The mechanical contract (frontmatter schema, where files go, content-collection wiring) lives in [`data-flow.md`](data-flow.md) and `src/content.config.ts` — don't duplicate it here. A post must satisfy **both**.

## The house voice in one line

> Honest, specific, anti-hype. Earn every claim with a concrete receipt, then reframe it into a takeaway the reader can act on.

Three failure modes this rule prevents: (1) breathless hype with no receipts, (2) a generic listicle any AI could've written, (3) hedged, throat-clearing mush that buries the point. Every guideline below pushes away from one of those.

## 1. The hook — first sentence does the work

Never open with "In this post…", "Let's talk about…", a dictionary definition, or a history lesson. Open on the sharpest true thing you can say. Proven opener shapes from existing posts:

- **Name the enemy, then promise the real thing.** _"Most posts about coding with an AI agent are either breathless hype or a five-minute demo where everything works on the first try. Neither matches what actually happened…"_ ([shipping-with-an-ai-coding-agent](../../src/content/blog/shipping-with-an-ai-coding-agent.md))
- **State the pitch, then the twist.** _"Flutter's pitch is a single codebase that renders its own pixels… That same pitch is also where the confusion starts."_ ([flutter-best-practices](../../src/content/blog/flutter-best-practices-context-and-providers.md))
- **Redefine the term the reader thinks they know.** _"An anti-pattern isn't 'bad code' — it's a recognizable, repeated solution that looks reasonable in isolation and reliably causes damage as the codebase grows."_ ([antipatterns-in-web-development](../../src/content/blog/antipatterns-in-web-development.md))

If the first sentence would survive being pasted into a tweet on its own, it's strong enough.

## 2. Titles & descriptions — the catch happens here

The `title` and `description` frontmatter are the whole click decision on the blog index. Rules, drawn from the titles that already exist:

- **Title = specific subject + a promise of honesty or payoff.** `X in Production: Best Practices and the Anti-Patterns That Sneak In` beats `A Guide to X`. First-person declaratives land (`I Let an AI Agent Build and Ship a Production UI Kit`). A colon-subtitle is the house pattern, not a requirement.
- **Description names the concrete artifacts, not the topic.** The winning move is listing the specific things the reader will get: _"a stuck browser renderer, a font-loading rabbit hole, and a database secret that quietly pointed at the wrong database."_ That's a promise with receipts. Avoid _"everything you need to know about X."_ (Hard limits: title ≤ 90, description ≤ 200 — see `content.config.ts`.)
- **No clickbait you don't pay off.** Catchy is earned by specificity, never by a curiosity gap the post doesn't close. Overpromising is the fastest way to break trust with a developer audience.

## 3. The signature arc — "what it gets right → where it bites"

The most-used and most-effective structure in this blog: lead with an honest account of **what the technology genuinely gets right**, *then* pivot to **where that same strength becomes the antipattern**. Both `react-best-practices-and-antipatterns.md` and `flutter-best-practices-context-and-providers.md` run this arc, and it's what makes them convincing — praise first buys credibility for the criticism. Reach for it whenever a post evaluates a tool, framework, or approach.

Pair it with the **antipattern → fix** code idiom this blog uses everywhere:

```ts
// Antipattern: <one line naming why this is wrong>
<the tempting-but-wrong code>
```

…immediately followed by the corrected version and one sentence on *why the fix is the framework-provided right answer*, not just a style preference. Label the bad block with a `// Antipattern:` comment so it's unmistakable at a skim.

## 4. Convincing = receipts, not adjectives

- **Cite real numbers and real sources** when making a trend or performance claim; link them inline. Don't assert "everyone's doing X" — show the survey.
- **Draw on real project experience.** Reference actual work (e.g. `[Nocturne](/projects/nocturne-market)`, this site's own stack) with an internal link. A pattern shown running in production beats a toy example every time.
- **Show the bug you actually hit.** The config-drift `DATABASE_URL` story is persuasive *because it happened*. War stories with a real root cause are the blog's most convincing device — use them over hypotheticals.
- **Qualifiers are a feature, used sparingly.** "genuinely," "actually," "the part that didn't" signal you're distinguishing real strengths from marketing. They build trust — but one per idea, not per sentence, or they turn into hedging mush (failure mode #3).

## 5. Expressive = rhythm and specificity

- **Vary sentence length.** Follow a long, clause-heavy explanation with a short punch. _"Not slow. Nothing, indefinitely."_ Rhythm is what makes technical prose readable.
- **Em-dashes for the aside, not commas** — this blog leans on them for the mid-sentence pivot. Keep it.
- **Prefer the concrete noun.** "tofu boxes instead of text," "blank grey circles instead of photos" — not "rendering issues." Specific images make abstract bugs stick.
- **Bold lead-ins in lists** when each item is a named concept (see the Flutter best-practices numbered list). The bold term is the thing to remember; the sentence explains it.

## 6. Cross-link and close

- **Link to sibling posts** where a concept overlaps (the Flutter post links to the web-dev antipatterns post for the shared "God component" shape). It builds the blog into a connected body of work and keeps readers on the site.
- **Close with a reframe, not a recap.** The ending should reframe what the reader now understands, not list what was covered. The AI-agent post's close — _"less 'type a prompt, get an app,' more 'the agent handles the mechanical parts, you own the judgment'"_ — is the model: a one-line mental model they'll remember.
- **A `## References` section is the house style for deep-dives** — annotate each link with *why* it's worth clicking (see the Flutter post's references), don't just dump URLs.

## Pre-publish voice checklist

Run alongside the [verification protocol](verification-protocol.md) (`npm run build` still has to pass) before calling a post done:

- [ ] First sentence works as a standalone claim — no throat-clearing.
- [ ] Title is specific; description names concrete artifacts/payoff (within 90/200 char limits).
- [ ] Every strong claim has a receipt: a number+source, real-project link, or reproduced bug.
- [ ] If it evaluates a tool: leads with what it gets right *before* the criticism.
- [ ] Antipattern code blocks are labelled `// Antipattern:` and followed by the fix + the *why*.
- [ ] At least one internal cross-link to a related post or project.
- [ ] Closes on a reframe/mental model, not a summary.
- [ ] Read it aloud once — sentence length varies, nouns are concrete, qualifiers aren't doing hedging work.
