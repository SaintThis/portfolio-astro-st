---
title: Rust for Web People
description: What a React/Node developer actually gains (and gives up) reaching for Rust on the backend.
date: 2026-06-14
tags: ['rust', 'backend', 'performance']
draft: false
---

I came to Rust from TypeScript and Node. Here's the honest version of what changed.

## The borrow checker is a code reviewer that never sleeps

It's frustrating for a week, then it's the reason your service doesn't segfault at 2am. Ownership makes an entire class of bugs unrepresentable.

## Where it pays off

- Hot paths where Node's GC pauses hurt.
- Anything CPU-bound: parsing, encoding, crypto.
- Long-running services where memory stability matters.

## Where I still reach for Django/Node

Rapid CRUD, admin panels, and glue code where developer velocity beats raw throughput. Use the right tool — being fullstack means owning that choice.

```rust
async fn health() -> &'static str {
    "ok"
}
```

Pragmatism over purity, always.
