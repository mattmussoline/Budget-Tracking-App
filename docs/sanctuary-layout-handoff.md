# Sanctuary layout pass — in-progress handoff

Goal: make the live app match the **F · Sanctuary** artboards in the
"Licensing Budget Design Directions" artifact
(`https://claude.ai/code/artifact/ea5b3396-d50f-455f-abbc-0b74b4db9a4b`),
keeping the current Formed brand colors and all existing functionality.

Reference artboards are saved locally in `docs/mockups/`:

- `Main.dc.html` — Licensing Summary
- `SanctuaryRoadmap.dc.html` — Roadmap
- `SanctuaryReview.dc.html` — Content Review
- `SanctuaryLogin.dc.html` — Login (already matches)

Colour mapping: mockup green `#2f5d4f` → Formed Blue tokens; mockup
limestone `#f7f4ee` → `--parchment`; card `#fffdf9` → `--panel-warm`;
hairline `#e4ddd0` → `--border`.

## Done

- **New slim top bar** — `src/features/planning/components/app-top-bar.tsx`
  (62px, serif "Licensing" wordmark, section tabs, right-hand slot).
  Exports `AppTopBar`, `TopBarChip`, `TopBarDivider`.
- **`planning-shell.tsx` rewritten** — top bar + `PageHead` (serif h1 +
  description + actions slot). `title`/`description` are now optional so
  client pages can render `PageHead` themselves. `eyebrow` prop removed.
- **`planning-header.tsx` deleted** (the tall navy hero).
- **`planning-navigation.tsx`** — links restyled as light tabs
  (active = `bg-formed-blue-soft text-formed-blue`).
- **Licensing Summary rebuilt** to the artboard: `budget-dashboard.tsx`
  (5-tile KPI row, signals row, two compact collapsible strips,
  348px form column + quarters/table column, FY range chip in page head,
  fiscal-year switcher + account chip in the top bar),
  `summary-metrics.tsx`, `dashboard-insights.tsx`, `month-board.tsx`
  (four quarter cards, open in place), `license-manager.tsx`
  (table-style "Edit content"), `fiscal-year-settings.tsx`,
  `content-license-form.tsx`, `share-panel.tsx`, `fiscal-year-manager.tsx`
  (light chips for the top bar).
- **Primitives tightened** — `soft-button` (min-h-10, 13px),
  `soft-input` / `soft-select` (min-h-10, 14px).
- `dashboard-popout.tsx` — flat trigger, `rounded-soft`, new
  `showExpandIcon` prop for the strips.
- `provider-pie-chart.tsx` — new `centerTextClassName` prop; donut is 84px
  on the dashboard.
- Roadmap modal triggers restyled ("Manage key", "Add roadmap item").

## Remaining

1. **Roadmap page** (`roadmap-dashboard.tsx`, `src/app/roadmap/page.tsx`,
   `src/app/demo/roadmap/page.tsx`):
   - Add `pageTitle`/`pageDescription` props; render `PageHead` with
     "Manage key" + "Add roadmap item" as its actions.
   - Controls row: category key chips left; light segmented
     Previous/Today/Next and 6/9/12 month groups right (drop the navy bar).
   - "Fiscal year at a glance" becomes a compact one-line strip.
   - Month columns as light `panel-warm` cards in a 6-up grid.
   - Bottom row: `[1.6fr, 1fr]` — Ongoing series cadence as a real table
     card, Backlog as a compact card.
   - `SeriesTable` header row: warm `bg-panel` instead of navy.
2. **Content Review page** (`content-review-dashboard.tsx` and its
   `content-review-focus-five.tsx`):
   - `PageHead` with "Weekly recap" + "Add content" actions (move them out
     of the Decision queue card).
   - 5 flat status tiles (`repeat(5,1fr)`), serif numbers, no icon squares.
   - Focus Five as one card with a 5-up grid of small white cards.
   - Radar alert as a slim warm strip.
   - Queue + detail as `[minmax(0,1fr) 468px]`; queue rows as table rows
     with a status pill, not the current heavy bordered cards.
3. **Login** (`src/app/login/page.tsx`) — already structurally correct;
   only field radius/height polish left.
4. **Tests to update** (they assert the old chrome):
   - `planning-shell.test.tsx` — asserted `h-80`/`text-6xl` hero.
   - `planning-navigation.test.tsx` — active class was
     `bg-panel text-augustine-blue`.
   - `budget-dashboard.test.tsx` — hero assertions, "Edit Content" →
     "Edit content", "Other Budgets" → "Other budgets",
     insight value class `xl:text-3xl` → `xl:text-[1.875rem]`,
     `.soft-raised` lookups for the KPI tiles.
   - `license-manager.test.tsx` — "Edit Content" text and summary
     `px-4 py-3` assertion.
5. **Verify** — `npx tsc --noEmit`, `npm test`, `npm run lint`,
   `npm run build`, then browser-check `/demo/dashboard`,
   `/demo/roadmap`, `/demo/content-review`.
6. **Ship** — commit, push, then `npm run cf:build` && `npm run cf:deploy`
   and smoke-check `https://app.formedlicensing.workers.dev`.

## Known state

`npx tsc --noEmit` currently fails only on the removed `eyebrow` prop, in:
`src/app/roadmap/page.tsx` (2), `src/app/content-review/page.tsx` (2),
`src/app/demo/roadmap/page.tsx`, `src/app/demo/content-review/page.tsx`,
`src/app/demo/coproduction/page.tsx`, `planning-shell.test.tsx`.
Nothing is committed yet.
