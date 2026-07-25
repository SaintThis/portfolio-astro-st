---
title: The Antipatterns of Coding With an AI Agent
description: Vibe-merging diffs you never read, letting the agent choose the architecture, and shipping with no test to catch it — the failure modes that show up once you're past the demo, and the fix for each.
date: 2026-07-25
tags: ['ai', 'claude-code', 'agentic-coding', 'best-practices']
category: 'engineering'
cover: /uploads/hero-agent-antipatterns.svg
featured: true
draft: false
---

Roughly half of developers now use an AI coding tool every single day — 51% in the 2025 Stack Overflow survey, with 84% using or planning to. So the interesting question stopped being "does this work" a while ago. It's "what does it quietly make worse." Because an agent doesn't just accelerate the good habits; it accelerates whatever habits you already have, including the bad ones, at a speed where the damage compounds before you notice.

I've shipped real work this way — [Nocturne](/projects/nocturne-market) was built and screenshotted end-to-end with Claude Code ([here's the unfiltered log](/blog/shipping-with-an-ai-coding-agent)). This isn't a "don't use agents" post. It's the opposite: the practices worth keeping, and the specific ways the same workflow turns into an antipattern when you stop paying attention.

## Where agentic coding genuinely earns its place

Give it the credit it's due before the criticism, because the strengths are real and they're exactly what makes the failure modes seductive:

- **The mechanical feedback loop is where it shines.** Compile errors, a failing test, a 404 that should be a 200 — anything with a fast, unambiguous signal, the agent grinds through with a patience no human sustains. On Nocturne it chased a font-loading rabbit hole and hand-wrote a fake `HttpClient` to satisfy a test harness, correctly, without getting bored.
- **It flattens the cost of the boring 80%.** Scaffolding eight screens, wiring Riverpod providers, writing the CRUD, filling out the test table — the work that's tedious rather than hard collapses from days to hours.
- **It's a tireless rubber duck that also edits.** Explaining a bug to it often surfaces the fix, except it also writes the patch while you think.

Hold onto that first point — **fast, mechanical feedback loop** — because every antipattern below is what happens when you let the agent operate *without* one.

## Antipattern 1: Vibe-merging — accepting diffs you never actually read

The single most common one, and the most expensive. The agent produces a confident, well-formatted diff; it compiles; you approve it without reading it. Do this fifty times and you've shipped a codebase whose author is nobody — you can't answer basic questions about it in review, and neither can the person who inherits it.

```text
// Antipattern: the whole review, every time.
"looks good, apply it" → merge → next prompt
```

The tell is that you'd fail a code review of your own PR. The fix isn't "read every character" — it's to **make the agent produce a diff you *can* review**, then actually review the parts that carry risk:

```text
Keep each change small and single-purpose. Before applying, tell me:
what changed, why, and what could break. Flag anything touching auth,
money, migrations, or data deletion for a closer look.
```

You stay the author. The agent drafts; the judgment about whether the draft is correct is the one thing you can't delegate, because you're the one who'll be paged when it isn't. This is the same **God Object** smell from [my web-dev antipatterns field guide](/blog/antipatterns-in-web-development) — a change nobody understands as a whole — just arriving faster than before.

## Antipattern 2: Letting the agent pick the architecture

Agents are superb at *filling in* a structure and dangerously agreeable about *inventing* one. Ask "how should I structure this" and you'll get a plausible answer, delivered with the same confidence whether it's right for your system or generically right for a tutorial. Accept enough of those and your codebase becomes an average of every blog post in the training data — internally inconsistent, because no single mind chose the trade-offs.

```text
// Antipattern: outsourcing the decision, not the typing.
"what's the best state management / folder structure / auth approach? set it up"
```

Architecture is where the constraints live — your team's size, your latency budget, what you'll regret in a year — and none of that is in the prompt. The fix is to **decide the shape yourself, then let the agent execute it**:

```text
We use Riverpod with code-gen, autoDispose by default, keepAlive only for
cart and auth session. Follow that existing pattern — don't introduce a new
state approach. If you think it's wrong, say so and stop; don't refactor.
```

That last clause matters. Left unconstrained, an agent will "helpfully" rewrite a working convention into a different one mid-task. Direction is a human call; the agent implements a decision, it doesn't get to make it. (The `keepAlive`-as-a-deliberate-exception reasoning is from [my Flutter production post](/blog/flutter-best-practices-context-and-providers) — worth having an opinion *before* you ask.)

## Antipattern 3: No test as the safety net — trusting the loop you removed

Remember the one strength to hold onto: the agent is only reliable when it has a **fast, mechanical feedback signal**. A test suite *is* that signal. Generate code with no tests and you've deleted the exact thing that makes the agent trustworthy, then asked it to work blind — and it will still sound just as confident.

```dart
// Antipattern: "it looks right and it compiles" as the entire bar.
Future<Cart> applyDiscount(Cart cart, Coupon c) async {
  final next = cart.copyWith(total: cart.total * (1 - c.rate));
  return next; // rounding? stacked coupons? expired code? nothing checks.
}
```

Compiling proves the types line up, nothing more. The fix is to make the agent close its own loop — **write the test first, or alongside, and let a red bar be the arbiter instead of your eyeballs**:

```dart
test('discount is clamped, rounded, and rejects expired coupons', () {
  expect(applyDiscount(cart, expired).total, cart.total);   // no change
  expect(applyDiscount(cart, half).total, closeTo(5.00, 0.001));
});
```

Now the agent iterates against something real. This is the difference between the parts of Nocturne that felt like magic — the ones with a failing test to grind against — and the parts that needed me to step in. Take away the signal and you're not getting AI-assisted engineering; you're getting confident autocomplete.

## Antipattern 4: Skipping the human call at the boundaries

Some problems have no mechanical signal at all, and those are precisely the ones to *not* hand off. On Nocturne, the automated screenshot pipeline produced something that looked like a wireframe; the right move was to stop fighting it and take a real screenshot by hand. No test would have told me that — "good enough to ship" is a taste judgment, and the agent has no taste, only compliance.

The sharpest example was a bug with no error at all: a freshly-seeded post simply didn't appear on the live site. Nothing in the code was wrong. The deployed Worker's `DATABASE_URL` secret had **drifted** from what local scripts were writing to — two different databases, same schema, silently diverging. An agent re-running the same "fix" against the same wrong assumption will loop forever; being suspicious enough to check whether the deployment's config still matched reality was the human part. (The full story is in [the shipping log](/blog/shipping-with-an-ai-coding-agent).)

```text
// Antipattern: escalating effort against an unexamined assumption.
try the fix → still broken → try the same fix harder → repeat
```

The fix is a human instinct, not a prompt: when the loop stops converging, **stop and question the premise** instead of asking the agent to try again louder.

## Antipattern 5: Context rot — the 200-message thread that poisons itself

Long agent sessions accumulate their own contradictions: a decision you reversed twenty messages ago, a file that's since been rewritten, a dead end it still "remembers" as fact. Past a point the context is actively working against you — the agent confidently cites a function signature that no longer exists because it saw it earlier in the same thread.

The fix is cheap and underused: **treat context as disposable**. When a task is done, start clean. Keep the durable rules in a file the project owns — this repo has a `CLAUDE.md` and a set of `.claude/rules/*.md` files that get reloaded every fresh session — so a new conversation starts *smarter* than the old one ended, instead of dragging its whole confused history along. Persistent conventions belong in version control, not in a chat scrollback.

## The through-line

Every antipattern here is the same shape: the agent is fastest and most trustworthy when a **fast, mechanical feedback loop** is doing the checking, and most dangerous the moment you remove that loop and substitute its confidence for your judgment. Vibe-merging removes review. Outsourcing architecture removes the decision. No tests removes the signal. Grinding on a bad assumption ignores that the loop stopped converging. Context rot lets stale "facts" masquerade as the signal.

So the mental model isn't "the AI writes the code now." It's narrower and more useful than that: **the agent owns the mechanical loop; you own everything that doesn't have one.** Keep that line sharp and an agent is the biggest productivity gain in years. Blur it, and you're just generating technical debt faster than you ever could by hand.

## References

- [Stack Overflow 2025 Developer Survey — AI section](https://survey.stackoverflow.co/2025/) — the 84%/51% adoption figures, and the trust gap that pairs with them (developers use these tools daily *and* distrust the output, which is exactly the tension this post is about).
- [Anthropic — Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) — the case for small diffs, a `CLAUDE.md`, and tests as the agent's feedback loop, from the people who build the agent.
- [My shipping log: I Let an AI Agent Build and Ship a Production UI Kit](/blog/shipping-with-an-ai-coding-agent) — the war stories these antipatterns are abstracted from, including the `DATABASE_URL` drift bug.
- [Anti-Patterns: The Ones I Keep Seeing in Web Development](/blog/antipatterns-in-web-development) — the non-AI ancestors of these; an agent just reaches them faster.
