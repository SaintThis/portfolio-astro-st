/**
 * Content upsert for the project case studies (Marlowe, Nocturne, Sundry).
 *
 * Descriptions are authored as plain text with blank-line paragraph breaks,
 * "## " section headings and "- " bullet lines — the shapes the project detail
 * page renders (see src/pages/projects/[slug].astro). Idempotent: upserts by
 * slug, so re-running just refreshes the copy.
 *
 *   npx tsx scripts/upsert-projects.ts
 *   npx dotenv-cli -e .env.production -- npx tsx scripts/upsert-projects.ts
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');
const db = drizzle(neon(url), { schema });

type Entry = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  category: string;
  status: string;
  date: string;
  featured: boolean;
  cover: string;
  screenshots?: { url: string; caption: string }[];
  metrics?: { label: string; value: string }[];
  links?: Record<string, string>;
};

const ENTRIES: Entry[] = [
  {
    slug: 'marlowe-people',
    title: 'Marlowe',
    summary:
      'A tablet-first Flutter people-operations dashboard kit — twelve production screens, a signature segment-bar data widget, and a data layer you swap in an afternoon.',
    category: 'mobile',
    status: 'live',
    date: '2026-08-05',
    featured: true,
    cover: '/uploads/marlowe/dashboard-dark.png',
    screenshots: [
      {
        url: '/uploads/marlowe/dashboard-light.png',
        caption:
          'The same dashboard bento in light — all twelve screens ship both themes authored separately, not one palette inverted and hoped for.',
      },
    ],
    tags: [
      'Flutter',
      'Dart',
      'Riverpod 3',
      'go_router',
      'Material 3',
      'riverpod_annotation',
      'UI kit',
      'Responsive',
    ],
    metrics: [
      { label: 'Screens', value: '12' },
      { label: 'Tests passing', value: '84' },
      { label: 'Breakpoints', value: '4' },
      { label: 'Analyzer issues', value: '0' },
    ],
    description: `Marlowe is a people-operations dashboard kit for Flutter, built for the app that lives on an HR lead's iPad and still has to survive on a phone. Twelve screens, both themes, every nav destination resolving to a finished screen — not one gorgeous dashboard and eleven dead links.

The category's usual failure is scope theatre: a beautiful overview screen, then placeholder sub-pages. Marlowe's bet is the opposite — the hard, unglamorous parts (a bento that fills a tablet viewport without scrolling, a schedule grid with events floating over a real time axis, a nav shell that reflows from a centered capsule to a floating bottom bar) are the actual product.

## What's in it

- Twelve screens: Dashboard, People directory, Person profile, Hiring board, Candidate, Onboarding, Time tracker, Calendar, Compensation, Devices, Reviews, and Settings.
- Every screen ships three real states — a loading skeleton that mirrors its own layout, a designed empty state, and an error state that says what happened and what to do next.
- Light and dark authored separately, not one palette inverted and hoped for.
- Zero third-party assets: no font licence to chase, no stock photo to replace.

## The signature element: the segment bar

Rather than pulling in six chart types for six different questions, Marlowe uses one primitive everywhere — a capsule split into filled, accent, and hatched-void segments. It reads as capacity on the dashboard, as pipeline progress on hiring, and as completion on onboarding. One widget to learn, one widget to restyle, six places it pays off.

## Architecture

- Riverpod 3 with riverpod_annotation code generation — one provider per question, no god object holding the whole app's state.
- go_router with twelve typed routes, deep-linkable from day one.
- No backend by design. \`shared/domain/repositories.dart\` declares eight interfaces; \`shared/data/mock_repositories.dart\` implements them in memory. Swapping in a real API means writing one implementation per interface — no screen changes.
- Material 3 tonal surfaces under frosted glass over a three-stop seafoam gradient. Blur is tokenised, so a buyer targeting low-end Android turns it off by editing four values.

## The quality bar

Zero analyzer issues and 84 passing tests. The suite renders every screen at 360, 768, 1024, and 1440 in both themes, and asserts the dashboard's composition as actual geometry — so a layout regression fails the build instead of reaching a buyer. Responsiveness is verified by the test suite, not by eye.

## Built for

Flutter developers and small studios building an internal HR, people-ops, or workforce tool who can already write a ListView — and who don't want to spend three weeks on the bento, the schedule grid, and a token system that holds together in dark mode.`,
  },
  {
    slug: 'nocturne-market',
    title: 'Nocturne',
    summary:
      'A dark-first, glass-morphic Flutter NFT-marketplace UI kit — eight wired-together screens on Riverpod and go_router, built to look like a funded product rather than a template.',
    category: 'mobile',
    status: 'live',
    date: '2026-07-23',
    featured: true,
    cover: '/uploads/nocturne-desktop.png',
    screenshots: [
      {
        url: '/uploads/nocturne-mobile.png',
        caption:
          'The marketplace home on mobile — a native-feeling floating pill bottom nav below 768px; the same screen reflows into the three-column desktop grid above it.',
      },
    ],
    tags: [
      'Flutter',
      'Dart',
      'Riverpod',
      'go_router',
      'Freezed',
      'Design systems',
      'UI kit',
      'Golden tests',
    ],
    metrics: [
      { label: 'Screens', value: '8' },
      { label: 'Themes', value: '2' },
      { label: 'Analyzer issues', value: '0' },
    ],
    description: `Most Flutter UI kits are a Material Design demo with the colors swapped. Nocturne is built the other way around — dark-first and glass-morphic, designed to look like a real, funded marketplace from the first screen rather than a template someone will have to redesign before showing a client.

## Eight screens, not eight components

Home, Item Detail, Collection Listing, Search, Creator Profile, Cart, Wallet-Auth, and Account Settings — the complete flow a marketplace actually needs, already wired together with real navigation instead of static mockups you have to connect yourself.

## The frosted-glass toolkit

A small set of primitives — \`GlassSurface\`, \`GlassIconButton\`, \`GlassButton\`, and a rating badge — applied consistently across the header, hero card, category pills, and every card action. Consistency at that level is the difference between a kit that looks expensive and one that looks generated.

## Genuinely responsive, not a stretched phone layout

Below 768px the app uses a native-feeling floating pill bottom nav. Above it, the same screen reflows into a real desktop grid: hero column, trending rail, and a right sidebar carrying Top Creators, Join the Community, and Marketplace Info. Same code, two correct layouts — not one layout apologising for the other.

## Architecture

- Riverpod for state — typed, testable providers instead of scattered setState calls.
- go_router with a StatefulShellRoute for the tab shell, deep-linkable routes, and an auth-aware redirect guard.
- Feature-first structure: marketplace-home, item-detail, cart, wallet-auth and the rest each own their \`presentation/{screens,widgets,providers}\`. Delete a feature, delete a folder.
- Freezed domain entities for listings, creators, and collections — immutable, type-safe models instead of raw JSON maps drifting through the app.
- Every color, radius, and shadow traces to a single token file, so reskinning for a client is editing values rather than hunting hardcoded hex across sixty widgets.

## A mock backend with documented swap points

The kit runs fully functional with zero backend — seeded JSON catalog data and a mock auth/wallet flow — but every data access goes through a repository interface. Point \`catalogRepositoryProvider\` at a real API and every screen keeps working, untouched.

## The quality bar

Zero analyzer issues. The suite covers unit tests (formatters, validators, cart math), widget tests for every shared UI primitive, an end-to-end smoke test across Home → Item Detail → Cart, and golden tests locking the visual primitives in both themes — so a redesign pass can't quietly break the pixels a buyer paid for.

## Built for

Freelancers and agencies who need a marketplace-grade dark UI fast, indie teams prototyping a digital-collectibles product, and anyone tired of retrofitting a generic admin template into something meant to feel premium.`,
  },
  {
    slug: 'carillon',
    title: 'Carillon',
    summary:
      'A tablet-first Flutter finance dashboard kit for student money — tuition, grants, stipends, and term budgets — whose board fills the viewport and never scrolls.',
    category: 'mobile',
    status: 'live',
    date: '2026-08-14',
    featured: true,
    cover: '/uploads/carillon/dashboard-light.png',
    screenshots: [
      {
        url: '/uploads/carillon/dashboard-dark.png',
        caption:
          'The dashboard in dark — funding sources as a swipeable deck, Term Goals and Savings as tuned tube runs, and the Split Circle card, all on the reworked rimless glass.',
      },
      {
        url: '/uploads/carillon/analytics.png',
        caption:
          'Analytics, showing the newest chart form in the chime language — the Spend Rhythm heatmap (ChimeGrid), which answers "which day costs the most" the way a column of tubes structurally cannot.',
      },
      {
        url: '/uploads/carillon/profile.png',
        caption:
          'Profile — enrolment with its new term-progress strip, an appearance control wired to the same theme provider as the chrome toggle, and the split groups you belong to.',
      },
      {
        url: '/uploads/carillon/wallet.png',
        caption:
          'Wallet, showing "Where the month goes" — ChimeFlow, a tube laid on its side and divided into shares, the chart form built to answer composition rather than magnitude.',
      },
    ],
    tags: [
      'Flutter',
      'Dart',
      'Riverpod 3',
      'go_router',
      'Freezed',
      'Material 3',
      'UI kit',
      'Responsive',
      'Golden tests',
    ],
    metrics: [
      { label: 'Screens', value: '5' },
      { label: 'Tests passing', value: '118' },
      { label: 'Breakpoints', value: '4' },
      { label: 'Analyzer issues', value: '0' },
    ],
    description: `Carillon is a tablet-first Flutter UI kit for student money — tuition, grants, stipends, term budgets, and shared housing costs. The main screen is a board that fills the viewport and never scrolls. No admin sidebar. No data grid. A single dense bento designed for the screen a nineteen-year-old opens to know whether they can afford next month.

The category's common failure is a beautiful overview and four dead links. Carillon ships five complete, wired-together destinations — Dashboard, Analytics, Aid, Wallet, and Profile, every one built to the same contract, not just the hero screen — sitting behind a real sign-in flow, not a stub.

## The chime language

Carillon's signature element is a run of tuned vertical tubes — capsule tracks with capsule fills rising inside them, named for the bell tower on a university campus. What started as one primitive is now a small language of three forms, because a column of tubes can only answer one question. \`ChimeColumn\` compares magnitude — spend by month, funding by source. \`ChimeFlow\` lays a tube on its side and divides it into shares, for "what is this made of" — the composition question separate bars structurally cannot answer. \`ChimeGrid\` turns the tubes end-on into a small grid, for "when, and how regularly" — the shape an average hides. The savings tile, the term chart, the funding mix, the monthly commitments, the spend-rhythm heatmap, the loading skeleton, and the brand mark are all the same visual family at different sizes and orientations.

## Sign-in, with a floor under it

A complete \`features/auth\`: an \`AuthRepository\` interface, a mock implementation with real failure outcomes — a locked account, a wrong password, a provider that refuses — and client-side validation, because a kit whose auth always succeeds ships an error state nobody has ever seen. Provider buttons carry lettermarks, not brand logos; the marks are trademarks and aren't redistributable inside a kit sold to a third party. Deep links survive the trip through sign-in — the attempted destination rides along in a query parameter and gets restored afterward. And \`AuthPhase\` has three states, not two, so "we don't know yet" is never collapsed into "signed out," which is what makes an app flash its sign-in screen for a frame on every cold start.

## What's on the board

- Full-width stat band with live balance, grant total, and term spend.
- Ten cards: funding deck, action triad, term ledger, goal tile, savings tile, earn prompt, term overview, payment history, split circle (the one inverse card), and literacy guides.
- Three columns at 1024+, two at 768, one scrolling column below — the board never scrolls above the breakpoint, and the breakpoint reads height as well as width.
- All three states, on every screen: a skeleton that mirrors the composition card-for-card, a designed empty state, and an error surface that says what happened — governed by one \`LoadingPolicy\`, so nothing flashes a skeleton under 120ms or redraws one over a screen the reader is already looking at during a refetch.

## Design

Obsidian-iris and citron — no gold, no brown, no Material defaults. Cards no longer cast a shadow; a translucent card with a blur pooled under it says the card is paper hovering above the page, and glass doesn't hover. Depth is now a painted rim — lit along the top, shaded along the bottom — and each card samples the page's own gradient at its position and tints itself with the answer, so a card in the iris corner reads iris and one in the citron corner reads citron, continuously, without anyone assigning a colour per card. Type is Bricolage Grotesque for headings, Plus Jakarta Sans for body, IBM Plex Mono for data — all under SIL OFL 1.1, no licence to chase.

## Architecture

- Riverpod 3 with riverpod_annotation code generation — one provider per question, no god object.
- go_router with typed, deep-linkable routes and an auth-aware redirect guard.
- Freezed domain models — immutable, type-safe, no raw JSON maps drifting through the widget tree.
- No backend by design, but the seam is documented, not just declared: \`docs/data/\` has the schema, an ERD, the REST contract, a field-to-widget map, a runnable PostgreSQL migration with row-level security, and the four steps from mock to live. The bundled fixtures are the exact payloads the docs describe — a server that matches the contract needs no other change.
- All painted assets — no stock images, no font licences beyond OFL. Every colour traces to \`AppTokens\`, a \`ThemeExtension\` that is the single source for the whole kit.

## The quality bar

Zero analyzer issues. 118 tests: a screen × breakpoint × theme matrix, an auth guard suite covering every failure mode the mock repository can produce, chrome and board geometry assertions, primitive widget tests, formatter unit tests, and golden baselines across every screen — sign-in included. Responsiveness and the auth flow are both verified by the suite, not by eye.

## Built for

Flutter developers and small teams building a student-finance or campus-life app who can already write a ListView — and who don't want to spend three weeks on the bento layout, the chart language, a real sign-in flow, and a token system that holds together in both themes.`,
  },
  {
    slug: 'sundry',
    title: 'Sundry',
    summary:
      'A colorful retro-pixel marketplace app for buying, selling, and boosting indie-made goods — Deno + Fresh islands, Tailwind, and a mock-but-swappable backend seeded from JSON.',
    category: 'web',
    status: 'live',
    date: '2026-07-25',
    featured: true,
    cover: '/uploads/sundry/home-light.png',
    screenshots: [
      {
        url: '/uploads/sundry/home-dark.png',
        caption:
          'Home in dark — the same server-rendered marketplace page; only three components on the whole site hydrate as islands.',
      },
      {
        url: '/uploads/sundry/browse-light.png',
        caption:
          'Browse, with the sort/filter controls — one of the three islands. The product grid itself is plain server-rendered HTML with zero client JS.',
      },
      {
        url: '/uploads/sundry/product-light.png',
        caption:
          'A product detail page showing the Pixel Price Tag\'s "boosted" state — the same tag component that marks a listing for sale or sold.',
      },
    ],
    tags: [
      'Deno',
      'Fresh 1.7',
      'Preact',
      'Islands architecture',
      '@preact/signals',
      'Tailwind CSS',
      'TypeScript',
      'Zod',
    ],
    metrics: [
      { label: 'Screens', value: '8' },
      { label: 'Themes', value: '2' },
      { label: 'Breakpoints', value: '4' },
      { label: 'Client JS', value: '3 islands' },
    ],
    description: `Sundry is a complete two-sided marketplace — browse, search, product detail, cart and mock checkout, a Sell flow with paid "Boost" ad tiers, seller storefronts, and an account area. It's a full application built to be reskinned and shipped, not a UI kit that stops at the pretty parts.

The interesting constraint was doing all of it on Deno + Fresh, where shipping JavaScript to the browser is opt-in rather than the default.

## The islands split

Pages render as server HTML and ship nothing to the client unless a component is explicitly an island. In Sundry that meant only three things hydrate: the cart drawer, the sort/filter controls, and the theme toggle. The product grid, category rails, seller cards, and price tags are plain server-rendered components with zero client JavaScript.

Everything else that looks like state — filters, sort, tabs, the search query — lives in the URL instead. Every view is shareable, the back button behaves, and there's no client store to keep in sync. Cross-island state that genuinely needs to be shared (the cart, the theme) rides on \`@preact/signals\`.

## The signature element: the Pixel Price Tag

A chunky pixel-bordered tag with a hard offset shadow, angled on every listing card across every screen. Its color and label encode listing state — for sale, sold, or **boosted** — which makes the app's advertising business model visible in the interface itself rather than buried in the Sell flow. One component doing product work, not decoration.

## A backend-shaped hole, deliberately

There's no database. The catalog and listings are seeded from JSON behind \`MockCatalogRepository\` and \`MockListingRepository\`, each hidden behind an interface with a documented \`HttpRepository\` swap point. Routes depend on the interface, never the mock — so wiring in a real backend never touches a page. The Sell flow is honest about the seam: new listings are created against the repository but aren't persisted into the browsable catalog, and the success state says so.

## Theming and craft

Every color, radius, shadow, and motion value comes from one file — recolor the entire app by editing the \`:root\` and \`.dark\` custom-property blocks, nothing else. All eight screens are verified at four breakpoints in both themes, and the product art is self-authored flat pixel-tile SVG, so there's no stock photography or font licence to inherit.

## Honest by design

No real payments, no real auth, no tracking. "Place Mock Order" clears the cart and says exactly what it did. A demo storefront that tells the truth about what it is.`,
  },
];

for (const e of ENTRIES) {
  const row = {
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    description: e.description,
    tags: e.tags,
    category: e.category,
    status: e.status,
    date: new Date(e.date),
    featured: e.featured,
    links: e.links ?? {},
    cover: e.cover,
    metrics: e.metrics ?? null,
    meta: e.screenshots ? { screenshots: e.screenshots } : {},
    updatedAt: new Date(),
  };

  await db
    .insert(schema.projects)
    .values(row)
    .onConflictDoUpdate({
      target: schema.projects.slug,
      // Keep the original `date` and the accumulated view count on update.
      set: { ...row, date: undefined },
    });
  console.log(`upserted project: ${e.slug}`);
}
