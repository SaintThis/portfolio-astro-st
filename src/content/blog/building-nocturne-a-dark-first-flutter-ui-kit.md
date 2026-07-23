---
title: 'Nocturne: A Dark-First Flutter NFT-Marketplace UI Kit'
description: Eight responsive, production-styled Flutter screens with a frosted-glass dark theme — built on Riverpod and go_router, ready to reskin and ship.
date: 2026-07-23
tags: ['flutter', 'ui-kit', 'design-systems', 'riverpod']
category: 'flutter'
cover: ./nocturne-images/nocturne-desktop.png
featured: true
draft: false
---

Most Flutter UI kits look like a Material Design demo with the colors swapped. Nocturne doesn't — it's a dark-first, glass-morphic NFT-marketplace kit built to look like a real, funded product from the first screen, not a template.

![Nocturne desktop home screen with the frosted-glass hero, trending rail, and Top Creators panel](/blog/nocturne-desktop.png)

## What you get

**Eight full screens**, not eight components: Home, Item Detail, Collection Listing, Search, Creator Profile, Cart, Wallet-Auth, and Account Settings — the complete flow a real marketplace needs, already wired together with real navigation, not static mockups.

- **A signature frosted-glass toolkit** — `GlassSurface`, `GlassIconButton`, `GlassButton`, and a rating badge — applied consistently across the header, hero card, category pills, and every card action. This is the detail that makes a UI kit look expensive instead of generic.
- **Fully responsive, not just "mobile + a stretched desktop."** Below 768px you get a native-feeling floating pill bottom nav; above it, the layout reflows into a proper desktop grid with a hero column, trending rail, and a right sidebar (Top Creators, Join the Community, Marketplace Info). Same screen, same code, two completely different — and correct — layouts.
- **Full dark/light theming from one file.** Every color, radius, and shadow traces back to a single token file. Reskinning the entire kit for a client is a find-and-replace on values, not a hunt through sixty widgets for hardcoded hex codes.
- **A mock backend with documented swap points.** The kit ships fully functional with zero backend — seeded JSON catalog data and a mock auth/wallet flow — but every data access goes through a repository interface. Point `catalogRepositoryProvider` at a real API and every screen keeps working, unchanged.

![Nocturne on mobile: floating bottom nav, glass hero card, and the trending feed](/blog/nocturne-mobile.png)

## Built on a real architecture, not a pile of widgets

- **Flutter + Riverpod** for state management — typed, testable providers instead of scattered `setState` calls.
- **go_router** with a `StatefulShellRoute` for the tab shell, deep-linkable routes, and an auth-aware redirect guard.
- **Feature-first structure** — `marketplace-home`, `item-detail`, `cart`, `wallet-auth`, and every other feature owns its own `presentation/{screens,widgets,providers}`. Delete a feature, delete a folder. No hunting across a shared `screens/` directory that mixes every feature together.
- **Freezed domain entities** for listings, creators, and collections — immutable, type-safe models instead of raw JSON maps floating through the app.

## Quality bar

Zero analyzer issues. The suite covers unit tests (formatters, validators, cart math), widget tests for every shared UI primitive, an end-to-end smoke test on the full Home → Item Detail → Cart flow, and golden tests locking down the visual primitives in both themes — so a redesign pass can't quietly break the pixels a buyer is paying for.

## Who this is for

Freelancers and agencies who need a marketplace-grade dark UI fast, indie teams prototyping an NFT or digital-collectibles product, and anyone tired of retrofitting a generic admin-dashboard template into something that's supposed to feel premium. Bring your own backend, your own brand, and ship.
