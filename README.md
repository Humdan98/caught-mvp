# Caught — Nothing slips.

A link-in-bio for TikTok Shop affiliates. Every product gets a short number. The creator says “it’s **#47** in my bio”, the viewer types `47` on the creator’s page, and they’re one tap from buying on TikTok Shop, Amazon or the brand’s site. The creator gets credit whichever store the viewer picks.

This repo is a working MVP that runs locally: real SQLite persistence, auth, event tracking and analytics. Everything external (TikTok Shop, Amazon, SMS, affiliate postbacks) is simulated.

---

## Run it

Requires **Node 20.19+** (22 LTS recommended).

```bash
npm install          # also generates the Prisma client
npm run setup        # creates prisma/dev.db, runs migrations, seeds the demo
npm run dev          # http://localhost:3000
```

| | |
|---|---|
| Demo creator page | http://localhost:3000/mayafinds |
| Second demo account | http://localhost:3000/mayakitchen |
| Dashboard login | **demo@caughtshop.com** / **caught-demo** |

Other scripts:

```bash
npm run db:reset     # wipe the database and re-seed (stop the dev server first on Windows)
npm test             # 19 unit tests (search, sold-out fallback, validation/URL hardening)
npm run typecheck    # tsc --noEmit
npm run build && npm start   # production build
```

No `.env` is needed. `.env.example` lists the two optional settings (`DATABASE_URL`, `CAUGHT_SANDBOX`).

### Try the core loop (about 30 seconds)

1. Open `/mayafinds` on a phone-sized window and type `47`. The match card shows up with its buy buttons right away. Press Enter to go to the product page.
2. Tap **Buy on TikTok Shop**. The click is recorded and you land on the **sandbox checkout**, which stands in for the real store. Tap **Place order (simulated)**.
3. Log in to the dashboard. The sale shows up in Overview → Recent activity as `Caught: $2.80 from #47`, and under **Sales** with a shareable receipt.
4. Open `/mayafinds/42`. It's sold out, so it shows the creator's backup (#47) with its own buy buttons and a "Text me when it's back" form.

---

## What's built

### Public page (`/[handle]`), the most important part
- Creator header with photo, name, handle, bio and social links.
- **One search box for everything.** `47`, `#47` and `# 47` all match exactly. Words do case-insensitive partial matching across name and description (every word has to match somewhere; name hits rank above description hits). Results filter instantly as you type because the whole catalogue ships with the page. There's no network round trip, which matters inside TikTok's in-app browser.
- An exact number match gets **buy buttons inline in the results**, so going from "47" to a buy button is one tap. Enter jumps to the product page.
- **Product grid** (image, `#number`, price, sold-out stamp) and a **video grid** (9:16 thumbnails, captions, `#number` chip). Tapping a video opens its product with a "From the video" strip, and the click is credited to that video.
- **Product page** at `/[handle]/[number]`. That's a real URL, so a creator can also say "caughtshop.com/maya/47". TikTok Shop is the primary button; Amazon and brand site sit below it when set.
- **Sold-out fallback**: a clear "#42 is sold out" banner with the creator's chosen backup and its buy buttons, plus "Text me when it's back".
- **Text me when it's on sale**: takes a phone number or email, validated and de-duplicated per product. Nothing is sent; the list lives in the dashboard.
- A dead number (deleted or hidden product) shows a friendly page and gets logged as a failed search, so the creator finds out an old video points nowhere.
- Visitors never log in.

### Creator dashboard (`/dashboard`)
- Sign up and claim a handle (validated, reserved words blocked), log in and out.
- **Products**: create, edit, delete, upload an image or paste a URL, price, commission %, TikTok/Amazon/brand links, available/sold out, backup picker, show/hide, reorder (↑/↓). Numbers are assigned on the server.
- **Videos**: TikTok URL, thumbnail (upload or URL), caption, linked product, reorder, edit, delete.
- **Profile**: photo, name, handle (with a warning that changing it breaks the bio link), bio, up to 8 social links.
- **Sign-ups**: waiting count per product, full list with filter, CSV export.
- **Sales**: every caught sale with GMV and commission totals, plus a shareable receipt for each.
- Copy-link and preview are always one tap away (sidebar on desktop, header on phone). There's a bottom tab bar on phones.

### Analytics (Overview)
All of it is computed from recorded events. Nothing is hard-coded. There's a 7/30/90-day range and an "all accounts" scope.
- Page visits, product clicks (with click-through rate), commission caught (with sales count and GMV), sign-ups waiting. Each shows the change against the previous period.
- Daily traffic chart (clicks as bars, visits as a line).
- **Where they chose to buy**: the TikTok Shop / Amazon / brand split, with the share of clicks that skipped TikTok Shop. That's the Amazon-spillover number a creator cares about.
- **How viewers found products**: search, video grid, product grid, sold-out backup, direct link.
- Per-product table: clicks, destination split, sales, commission, people waiting.
- **Searches that found nothing**, grouped and counted, with a one-tap "Add" that pre-fills a new product with that name.
- **Needs attention**: sold-out products, flagged louder when they have no backup.
- Recent activity: a mixed feed of sales, clicks, sign-ups and failed searches.

### Extras from the brief
- **Several accounts under one login** (e.g. a skincare account and a kitchen account). There's an account switcher, each account has its own page and numbering, and Overview can combine totals across accounts. The demo user owns two.
- **Shareable receipt card** at `/receipt/[id]` for every caught sale, plus a 1080×1350 PNG (`/receipt/[id]/image`) sized for a photo post.
- **Sandbox checkout** that simulates the store and the affiliate conversion postback, so the whole click → sale → commission loop can be demoed end to end.

---

## Stack, and why

| | |
|---|---|
| **Next.js 15 (App Router) + React 19 + TypeScript** | One codebase for the public page, dashboard and API. Server Components keep the public page light (~110 kB first load) and render it with data already in place. |
| **Prisma 7 + SQLite** via `@prisma/adapter-libsql` | A real relational schema with migrations and zero infrastructure. I chose the libSQL adapter over better-sqlite3 because it ships prebuilt binaries for Windows/macOS/Linux, so `npm install` never needs a C++ toolchain. Moving to Postgres/Turso is a provider and adapter swap. |
| **Tailwind CSS 4** | Brand tokens live in one `@theme` block (`src/app/globals.css`). |
| **Zod 4** | Every form and every public event endpoint is validated on the server. |
| **Recharts**, **Lucide** | As suggested. Recharts is only loaded on the dashboard. |
| **Geist Sans / Geist Mono** (npm package) | Clean sans for text and a true monospace for every number. Fonts are self-hosted, with no runtime request to Google. |
| Auth | Hand-rolled on purpose. It's small and auditable: scrypt from `node:crypto`, random 256-bit session tokens stored **hashed** in a `Session` table, an httpOnly SameSite=Lax cookie that's `Secure` over HTTPS, and a 30-day expiry. No auth library needed for email + password. |

No other runtime dependencies (`server-only` is a build-time guard).

---

## Architecture

```
prisma/
  schema.prisma            data model
  migrations/              SQL migrations (prisma migrate deploy)
  seed.ts                  deterministic demo data (90 days of events)
src/
  app/
    page.tsx               landing
    (auth)/                login, signup + server actions
    [handle]/              public page, [number] product page, notify action
    go/[productId]/        click tracking → redirect
    api/events/{visit,search}  beacons from the public page
    sandbox/checkout/      simulated store + conversion postback
    receipt/[id]/          shareable receipt + PNG (next/og)
    media/[file]/          serves uploaded images from ./uploads
    dashboard/             overview, products, videos, signups, sales, profile, accounts
      _actions/            server actions (all scoped to the session's creator)
  components/
    ui/                    Button, Field, SubmitButton, ActionForm, ConfirmButton, CopyButton, Badge, Money…
    storefront/            public-page pieces (search view, buy buttons, notify form…)
    dashboard/             nav, account switcher, forms, charts, stats
  lib/
    db.ts auth.ts password.ts validation.ts
    search.ts              pure search logic (unit-tested)
    products.ts            sold-out backup resolution (unit-tested)
    storefront.ts          public data loaders (no destination URLs sent to the browser)
    analytics.ts           everything on Overview, from events
    uploads.ts             image upload handling
tests/                     node:test unit tests
```

### Data model

```
User 1─* Session
User 1─* Creator  1─* SocialLink
                  1─* Product ──(backupProductId)──▶ Product
                  1─* Video ──▶ Product?
                  1─* PageView
                  1─* ClickEvent ──▶ Product?, Video?
                  1─* SearchEvent
                  1─* NotificationSignup ──▶ Product
                  1─* Sale ──▶ Product?, ClickEvent? (1:1)
```

Key constraints and indexes:
- `Product @@unique([creatorId, number])`. Numbers are unique per creator, enforced by the database.
- `Creator.nextProductNumber` is a monotonic counter, incremented atomically inside the create transaction.
- `NotificationSignup @@unique([productId, contact])`, so signing up twice doesn't duplicate.
- `Sale.clickId @unique`: one conversion per click.
- `(creatorId, createdAt)` indexes on every event table for range queries.
- Events snapshot `productNumber` and `productName`, and their product FK is `SET NULL`. Deleting a product never erases its history.

### Authorization
- `requireCreator()` resolves the session and the **active creator**. Every dashboard read and write is filtered by that creator's id: `updateMany`/`deleteMany` with `{ id, creatorId }`, and `findFirst` with both for reads. Another creator's id just 404s.
- Backup products and video→product links are checked to belong to the same creator.
- The account switcher only accepts creator ids owned by the session user. The analytics scope is built from the session's accounts, never from the query string.
- Middleware does a cheap cookie check for `/dashboard`; the real check lives in the server code.

### Security hardening
- Every link a creator enters (store links, socials, videos) must be `http(s)`. Zod's `.url()` on its own accepts `javascript:` and `data:` URLs, which would have been clickable on the public page. Video links must be on `tiktok.com`.
- Images are an `http(s)` URL or one of the app's own files (`/media/<uuid>`, `/demo/*.svg`). An image can't point at an app route like `/go/...` to fake clicks.
- Uploads are checked by their actual file bytes, not the browser's content type, and served with `nosniff`. SVG uploads aren't accepted.
- Login always runs scrypt, even for unknown emails, so response time doesn't reveal which emails have accounts. Expired sessions are deleted when seen.
- Forms keep their server-action `action`, so a submit that happens before the page's JavaScript loads still POSTs. It never falls back to a GET that would put field values (like a password) in the URL.
- The sandbox checkout and its simulated-sale action are switched off when `CAUGHT_SANDBOX=false`.
- Security headers are set on every response (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`), and CSV export guards against spreadsheet formula injection.

---

## Decisions I made where the brief was open

**Numbers**
- **Numbers are never reused.** If #38 is deleted, the next product is still #52. Old videos keep saying "#38" forever, and reusing it would send those viewers to the wrong product, which is worse than a dead end. A dead number gets a friendly page, and the miss is logged so the creator sees it.
- Numbers start at 1 for new creators and are assigned by the server only. Creators can't type them, so they can't collide.
- Searching `4` matches #4 only, never #44 or #47. Numbers match exactly; words match partially.

**Viewer experience**
- **Built for ten seconds of patience in an in-app browser.** The search box is the first thing on the page and stays pinned. Results update with no network round trip. An exact match shows buy buttons in the results. 16px inputs avoid iOS zoom. Logged search queries are debounced so typing "4", "47" doesn't log twice.
- **TikTok Shop is always the primary button.** It's where the creator's commission is usually highest and the brief calls it the main option. Amazon and brand site are secondary but visible, because that spillover is exactly the revenue Caught exists to catch.
- **Sold-out shows the backup first**, with its buy buttons right there, plus a line saying it's the creator's pick. The original product's details drop below, with the restock sign-up. If the backup is also sold out, the fallback follows the chain up to 3 hops and stops on loops or hidden products.
- **"Text me when it's on sale" accepts a phone number or an email in one field** and works out which it is. For sold-out products the wording becomes "Text me when it's back" and the sign-up is tagged `restock`. The creator sees why each person signed up.
- **Hidden products are hidden everywhere**, including number search. The creator hid it for a reason, like an ended collab.
- **Buy buttons are plain links to `/go/:id`**, not JavaScript handlers. They work without JS, survive in-app browsers, and aren't triggered by Next.js link prefetching (which would log fake clicks). Destination URLs never reach the browser.

**Creator experience**
- Marking a product sold out from the list jumps straight to the backup picker, because a sold-out product with no backup is a dead end for viewers. Overview flags any that are missing one.
- New products and videos go to the top of the page; ↑/↓ reorders.
- Deleting uses a two-tap confirm instead of `window.confirm`, which some in-app browsers block.
- Forms keep what you typed when validation fails. React 19 resets `<form action>` forms after submit, so `ActionForm` handles the submit itself and keeps `action` for no-JS/pre-hydration submits.
- No route-level `loading.tsx` skeletons. In testing they made the client router occasionally hang when an action redirect and a navigation overlapped, and they hide streamed pages from no-JS clients. Taps get instant feedback from `useLinkStatus` on links, and "Saving…" on buttons, instead.
- Changing your handle shows a warning, since it breaks the link already in your bio.
- Commission % is stored per product and used to estimate the commission on a caught sale.

**Analytics**
- One visit per browser session per page, sent with `sendBeacon`.
- Visits and clicks from the creator themselves are **counted** in this build, so a reviewer can watch the numbers move. In production I'd exclude the owner's sessions.
- "Searches that found nothing" are grouped case-insensitively. Text queries get an "Add" button; number queries don't, because you can't choose a number.

**Brand**
- Paper `#F4F1E8`, ink `#141413`, and green `#157A48` **only on money that was earned**: commission totals, caught sales, the receipt. Buttons, charts and badges use ink tones only. Destination splits use three ink shades so no color suggests money.
- Every number (product numbers, prices, counts, dates in tables) is set in Geist Mono with tabular figures.
- Receipt cues: dashed rules, a torn bottom edge on the product and receipt cards, and copy like "Caught: $2.80 from #47".

**Demo assets**
- Product photos and video thumbnails are illustrated SVG packshots generated for this repo (`public/demo`). They load offline and carry no licensing questions. Uploads accept real JPG/PNG/WebP/GIF photos up to 5 MB.

---

## Known limitations

- **Everything external is simulated.** There are no TikTok Shop, Amazon or SMS APIs. `CAUGHT_SANDBOX=false` makes `/go` redirect to the real URLs, but nothing reports real sales back.
- Sign-ups are collected, not sent. Export the CSV and message people yourself.
- Uploaded images go to the local `./uploads` folder. That's fine locally, but a real deployment needs object storage (S3/R2).
- There's no password reset or email verification, and no rate limiting on the public event endpoints or login. Anyone can send fake visit/search events for a creator (as with any client-side analytics).
- Replaced or abandoned uploads aren't cleaned up from `./uploads`.
- `npm audit` reports 5 advisories, all in build/CLI tooling rather than the running app: `effect` inside Prisma's CLI config loader (fix = downgrade to Prisma 6) and `postcss` bundled inside Next 15 for compiling our own CSS (fix = Next 16). Zod, which validates public input at runtime, is on the patched 4.x line.
- Bot filtering for visits and clicks is basic.
- Analytics are aggregated in the app server. That's fine for thousands of events; at scale I'd move to SQL aggregates or rollup tables.
- The SQLite migration SQL was written by hand, because the sandbox I built in couldn't download Prisma's schema engine. On Windows I verified it with Prisma itself: `prisma migrate diff` reports "No difference detected" against `schema.prisma`, and it matches Prisma's own generated SQL line for line.

## What I'd build next

1. **Real attribution**: TikTok Shop affiliate API + Amazon Associates reports to match sales to Caught clicks, so "Commission caught" is real money.
2. **Sending the notifications**: Twilio/Resend, plus a one-click "Product is back — notify 23 people" button when a creator flips a product to available.
3. **Pulled-link rescue**: paste a video URL whose basket was removed and get a pinned-comment snippet ("#47 in bio") plus a short link straight to that product.
4. **TikTok oEmbed import**: paste a video URL and the thumbnail and caption fill in automatically.
5. **Bulk import from the Showcase tab** (CSV first), with automatic numbering.
6. Owner-traffic exclusion, bot filtering, rate limits, and Postgres + object storage for deployment.
7. Price-drop alerts that actually send when a product's price changes, which is what "on sale" really means.

---

## Five-minute walkthrough (screen-recording script)

**0:00 – The idea (20s).** Open the landing page. "Creators say 'it's #47 in my bio'. Caught makes that number work."

**0:20 – Viewer: find by number (60s).** Open `/mayafinds` in a phone-size window. Type `47`: the match and its buy buttons show up instantly. Press Enter for the product page. Tap **Buy on TikTok Shop**, which lands on the sandbox checkout ("in production this goes straight to TikTok Shop"). Place the simulated order. Go back, search `heatless` to show keyword search, then `retinol` to show the empty state.

**1:20 – Viewer: find by video and the sold-out fallback (45s).** Videos tab → tap the vitamin C video. The product page shows "From the video". Go back, tap the overnight-lip video (#42, sold out). The banner explains it, the backup #47 is right there with buy buttons, and "Text me when it's back" takes a phone number.

**2:05 – Creator: log in and products (60s).** Log in with the demo credentials. On Products, add one with an uploaded image. It gets **#52** automatically. Mark #47 sold out: it jumps to the backup picker, so choose one and save. Reorder with the arrows, hide one, delete one, then add another: it's **#53**, because numbers are never reused.

**3:05 – Creator: videos and profile (30s).** Add a video with a TikTok URL, thumbnail and caption linked to the new product. Show it on the public page. Edit the bio and a social link.

**3:35 – Analytics (60s).** Overview: visits, clicks, **commission caught in green** (the only green in the app), the traffic chart, and where people chose to buy ("29% skipped TikTok Shop"). Then the per-product table, the searches that found nothing with **Add**, and recent activity, which includes the sale placed at 0:20. Switch 7d/30d/90d.

**4:35 – Extras (25s).** Switch to "All 2" accounts for combined totals, then open the account switcher (`@mayakitchen`). Go to Sales → a receipt → Save image. Sign-ups → Export CSV.
