---
title: "Agile and the SDLC: The Phases Don't Vanish, They Compress"
description: Waterfall's six phases didn't disappear under Agile — they got smaller and started repeating. What it genuinely fixed, the ceremonies that rot into theater, and how to tell which you run.
date: 2026-08-02
tags: ['agile', 'sdlc', 'process', 'software-engineering']
category: 'engineering'
cover: /uploads/hero-agile-sdlc.svg
featured: true
draft: false
---

Every team says it's Agile. A lot of them are running waterfall in two-week costumes — the same six phases, the same handoffs, the same signoffs, just chopped small enough that the seams stopped showing. That's not a gotcha, and it's not a reason to sneer at the process. It's the single most useful thing to understand about how software actually gets built: the software development life cycle didn't go away in 2001 when [the Agile Manifesto](https://agilemanifesto.org/) shipped. It got smaller, started repeating, and moved inside the team instead of between departments.

Miss that, and you end up with a calendar full of ceremonies and no idea why none of them help.

## The six phases, and why they never left

Requirements → Design → Implementation → Testing → Deployment → Maintenance.

Under waterfall, each one is a stage gate: a document, a signoff, a handoff to a different group of people. Under Agile you still do **every single one of them** — you just do all six inside a two-week window, against a thin vertical slice of the product, and then do it again. A user story is a requirements phase. A spike is a design phase. CI running on every push is the testing phase, executed continuously instead of saved for the end. A deploy pipeline is the deployment phase, minus the ceremony.

The mistake was never *running* the phases. The mistake is running them **once**.

## What Agile genuinely got right

Give it real credit before criticizing it, because the wins are structural, not vibes:

- **Feedback beats prediction.** A big upfront specification is a guess with a signature on it. Every assumption in it decays from the moment it's signed, and you don't find out which ones were wrong until integration. Short cycles replace guessing with measuring.
- **The cost-of-change curve is the whole bet.** A misunderstood requirement caught in week one costs a conversation. The same misunderstanding caught in production costs a migration, a rollback, and someone's weekend. Agile's core move is shrinking the distance between "we decided" and "we found out."
- **Working software is the unit of progress.** "Eighty percent done" is not a state that exists. Something that runs, deploys, and can be demoed is a fact; a percentage on a status slide is an opinion.
- **Authority moved to the people holding the information.** The person who just spent three days inside the payment module knows more about the estimate than anyone in the planning meeting. Agile's structural argument is that decisions should happen there.

Hold onto the first one — **feedback beats prediction** — because every antipattern below is the same failure: the ceremony survived, and the feedback loop it existed to serve quietly died.

## Antipattern 1: The standup as a status report

The most universal one. Fifteen minutes, eight people, each narrating yesterday to a manager who is the only real audience.

```text
// Antipattern: three questions answered upward, not to the team.
"Yesterday I worked on the login page.
 Today I'll keep working on the login page.
 No blockers."      × 8 people, every morning
```

Nothing about the day changes as a result, which is the tell: it's a meeting impersonating a mechanism. The fix isn't a better-worded update — it's remembering the standup exists so the team can **re-plan the next 24 hours together**:

```text
"Auth is blocked on the API contract — Sam, ten minutes after this?
 That pushes checkout to Thursday. Anyone depending on checkout,
 speak now."
```

If a standup never changes who works on what, delete it and reclaim the hour. A ritual that produces no decision is cargo.

## Antipattern 2: Velocity as a target

Velocity is a *capacity forecast* — a rough sense of how much a team absorbs in a sprint, useful for planning the next one. Point it at people as a performance score and Goodhart's law does the rest: when a measure becomes a target, it stops being a good measure.

The failure is fully mechanical. Estimates inflate. Tickets get split to pad the count. Refactoring, tests, and documentation — none of which carry points — quietly stop happening. The number goes up every sprint while the software gets worse, and the chart says everything is fine.

The fix is to measure outcomes instead of effort. The [DORA](https://dora.dev/) four keys — deployment frequency, lead time for changes, change failure rate, and time to restore service — are hard to game precisely because you can't fake them by talking louder in planning. Shipping more often with fewer failures is the actual goal; story points were only ever a proxy.

## Antipattern 3: The sprint that's a tiny waterfall

This one hides in the calendar:

```text
// Antipattern: the sprint schedule IS a waterfall, just faster.
Mon: design  ·  Tue–Thu: code  ·  Fri: QA + "hardening"  ·  demo
```

Testing at the end of a sprint is still testing at the end — you've compressed the phases without actually overlapping them, so every defect is still found after the work is nominally complete, and "hardening Friday" reliably becomes "hardening weekend."

The fix is the vertical slice: pick something thin enough that requirements, implementation, tests, and a deploy all happen for it **together**, then repeat. One fully-shipped feature beats four features stuck at 90% with a QA phase bolted on the end. If a slice can't be finished inside the iteration, it's too big — that's information, not a scheduling problem.

## Antipattern 4: The backlog as a landfill

Four hundred open items. Half were written for a product that no longer exists, a third are duplicates phrased differently, and nobody can grep it for what matters — so planning defaults to whatever's loudest this week. A backlog nobody trusts isn't a plan; it's a graveyard with a search box.

The fix is unsentimental: if an item hasn't been touched in six months, close it. A real need will come back, better-specified and with a fresher reason. Keeping "someday" tickets costs a little storage and an enormous amount of attention.

## Antipattern 5: A Definition of Done that erodes under pressure

The most expensive one, because it converts process debt directly into technical debt.

```text
// Antipattern: "done" renegotiated per ticket, under deadline pressure.
Done = "it works on my machine — tests next sprint"
```

"Next sprint" is where tests go to not exist. Every erosion is individually reasonable and collectively fatal: the definition ratchets down, never back up, and eighteen months later nobody can change the checkout flow without fear. That's the same shape as the [anti-patterns I keep seeing in web codebases](/blog/antipatterns-in-web-development) — a locally sensible decision that compounds into something nobody wants to touch.

The fix is that Definition of Done is a **team contract, not a per-ticket negotiation**: written down, identical for every story, and only changed deliberately when everyone's in the room. Merged, reviewed, tested, deployed to staging, documented — whatever you choose, the point is that deadline pressure isn't an input to it.

This got sharper, not softer, once AI agents entered the loop. An agent can produce a sprint's worth of plausible code in an afternoon, which makes the definition of "done" the main thing standing between you and a large pile of code nobody has actually reviewed — see [the antipatterns of coding with an AI agent](/blog/antipatterns-of-coding-with-an-ai-agent) for how that plays out in practice.

## How to tell which one you're actually running

Skip the labels and ask what happens when reality disagrees with the plan:

- Something urgent lands mid-sprint. Does the team **renegotiate scope**, or absorb it and work later? (Agile / waterfall in costume.)
- A requirement turns out to be wrong in week three. Is that a **normal Tuesday**, or a change-request process?
- Can you ship to production **today** if you decide to, or does deployment need a window and a committee?
- Does anyone look at retro actions again, or do the same complaints resurface every month?
- Is testing a *phase*, or a thing that happens continuously?

One "no" is a smell. Three is a waterfall wearing a lanyard that says Scrum.

## The reframe

Agile isn't a set of meetings, and the SDLC isn't a rival methodology it replaced. The phases are the **work** — you cannot skip requirements, design, testing, or deployment, only choose when to do them. Agile is a claim about *frequency*: run all six phases every two weeks against a thin slice, and the feedback loop gets short enough that being wrong stays cheap.

So the honest question isn't "are we Agile?" It's **"how fast do we find out we were wrong, and what does it cost us when we do?"** Every ceremony that shortens that distance is worth keeping. Every one that doesn't is a meeting you're paying for out of shipping time.

## References

- [The Agile Manifesto](https://agilemanifesto.org/) — four values and twelve principles, still one page, still worth re-reading annually. Notice how few of the rituals people argue about actually appear in it.
- [DORA — the four keys](https://dora.dev/guides/dora-metrics-four-keys/) — the research-backed replacement for velocity as a health metric, with guidance on measuring each one honestly.
- [Standish Group CHAOS reports](https://www.standishgroup.com/) — the long-running dataset behind the "iterative projects succeed more often than big-bang ones" claim; read the methodology critiques alongside it rather than quoting the headline number.
- [Anti-Patterns: The Ones I Keep Seeing in Web Development](/blog/antipatterns-in-web-development) — the code-level consequences of the process failures above, especially the eroded Definition of Done.
- [The Antipatterns of Coding With an AI Agent](/blog/antipatterns-of-coding-with-an-ai-agent) — why a fast, mechanical feedback loop is the thing that makes both a process and an agent trustworthy.
