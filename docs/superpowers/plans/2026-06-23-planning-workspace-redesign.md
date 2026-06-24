# Planning Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved master-detail Content Review workspace, multi-range Roadmap timeline, saved color key, Backlog, and production alias cutover.

**Architecture:** Keep Next.js server pages responsible for loading fiscal-year-scoped data and server actions responsible for all Supabase writes. Use focused client components only where selection, draft state, and auto-save feedback require browser state. Put controlled taxonomies, timeline math, and palette rules in pure modules with direct unit tests.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase Postgres, Zod, Vitest, Testing Library, in-app Browser, Vercel.

---

### Task 1: Planning domain constants and helpers

**Files:**
- Create: `src/features/planning/planning-constants.ts`
- Create: `src/features/planning/planning-model.ts`
- Create: `src/features/planning/planning-model.test.ts`
- Modify: `src/features/planning/planning-types.ts`

- [ ] **Step 1: Write failing tests** for the five review statuses, 13 genres, 15 formats, currency parsing/formatting, 6/9/12-month windows, previous/next anchors, recognized legacy month parsing, and invalid-month Backlog fallback.
- [ ] **Step 2: Run** `npm test -- src/features/planning/planning-model.test.ts` and confirm missing exports fail.
- [ ] **Step 3: Implement exact controlled arrays** with values from the approved spec and stable tone keys.
- [ ] **Step 4: Implement pure helpers** `dollarsToOptionalCents`, `formatOptionalCurrency`, `parseMonthAnchor`, `shiftMonthAnchor`, `buildMonthWindow`, `normalizeMonthRange`, and `parseLegacyReleaseMonth`.
- [ ] **Step 5: Expand types** so `ContentReviewItem` includes `proposedRateCents`, `reviewLink`, `comparableContent`, and `reviewStatus`; `RoadmapItem.releaseMonth` is nullable and includes `categoryId`; add `RoadmapCategory`.
- [ ] **Step 6: Run the focused test** and confirm PASS.

### Task 2: Supabase migration and server write contracts

**Files:**
- Create: `supabase/migrations/20260623213000_planning_workspace_redesign.sql`
- Modify: `supabase/schema.sql`
- Modify: `src/features/planning/planning-actions.ts`

- [ ] **Step 1: Add schema assertions** to `planning-model.test.ts` by reading the migration and checking for the new columns, category table, foreign key, RLS, and review-status constraint.
- [ ] **Step 2: Run the test** and confirm it fails because the migration is absent.
- [ ] **Step 3: Write an idempotent migration** that adds proposed-rate/link/comparable fields, renames or creates `review_status`, maps legacy stage values, replaces the status constraint, converts recognized roadmap month text to nullable dates through a temporary column, creates `roadmap_categories`, adds nullable `category_id`, indexes foreign keys, enables RLS, and adds updated-at triggers.
- [ ] **Step 4: Mirror the final schema** in `supabase/schema.sql`.
- [ ] **Step 5: Update Zod schemas and actions** for new review fields, nullable ISO month values, category assignment, category create/update/retire, and existing series operations.
- [ ] **Step 6: Run** `npm test -- src/features/planning/planning-model.test.ts` and confirm PASS.

### Task 3: Master-detail Content Review workspace

**Files:**
- Create: `src/features/planning/components/colored-select.tsx`
- Create: `src/features/planning/components/content-review-workspace.test.tsx`
- Rewrite: `src/features/planning/components/content-review-dashboard.tsx`
- Modify: `src/app/content-review/page.tsx`

- [ ] **Step 1: Write failing component tests** for Add Content draft behavior, four queue summary fields, selecting a row, full detail fields, exact dropdown options, colored selects, and selected-row accessibility.
- [ ] **Step 2: Run** `npm test -- src/features/planning/components/content-review-workspace.test.tsx` and confirm the old dashboard fails the contract.
- [ ] **Step 3: Build `ColoredSelect`** with label, options, tone classes, and normal native-select accessibility.
- [ ] **Step 4: Build the client workspace** with left queue/right detail layout, mobile inline detail placement, blank local draft, summary auto-save on changed blur/select, Saving/Saved/Error feedback, explicit detailed Save Changes, delete confirmation, and retryable errors.
- [ ] **Step 5: Update the page query and mapping** to load the new columns and renamed review status.
- [ ] **Step 6: Run the focused component tests** and confirm PASS.

### Task 4: Roadmap timeline, Backlog, categories, and recurring table

**Files:**
- Create: `src/features/planning/components/roadmap-timeline.test.tsx`
- Rewrite: `src/features/planning/components/roadmap-dashboard.tsx`
- Modify: `src/app/roadmap/page.tsx`

- [ ] **Step 1: Write failing component tests** for six rendered month columns, 9/12 range links, Previous/Today/Next links, month grouping, outside-range Backlog, undated Backlog, category color propagation, Manage Key controls, card editor, and recurring-series table.
- [ ] **Step 2: Run** `npm test -- src/features/planning/components/roadmap-timeline.test.tsx` and confirm the old dashboard fails.
- [ ] **Step 3: Rebuild the Roadmap dashboard** as a full-width timeline with toolbar links, horizontally scrollable columns, category-accent cards, Backlog, compact ongoing-series table, and collapsible add/edit forms.
- [ ] **Step 4: Add category management** for create, rename, recolor, reorder, and retire using the approved accessible palette.
- [ ] **Step 5: Update the page** to parse `start` and `months`, fetch categories, select nullable release dates/category IDs, and pass normalized view state.
- [ ] **Step 6: Run the focused timeline tests** and confirm PASS.

### Task 5: Full local verification

**Files:**
- Modify tests only when a demonstrated gap requires it.

- [ ] **Step 1: Run** `npm test && npm run lint && npm run build` and require zero failures.
- [ ] **Step 2: Start the local app** with the internal test password on port 5173.
- [ ] **Step 3: Verify Content Review** on desktop and mobile: draft creation, selection, exact dropdowns, summary save feedback, detailed save, and no overflow.
- [ ] **Step 4: Verify Roadmap** on desktop and mobile: 6/9/12 views, Previous/Today/Next, Backlog, card editor, category key, and ongoing series.
- [ ] **Step 5: Create and remove disposable records** to prove the real Supabase write/read/delete boundary without altering user records.

### Task 6: Database deployment, production deployment, and alias cutover

**Files:**
- Deployment operations only.

- [ ] **Step 1: Apply the migration** to the linked Supabase project and query the new columns/table to verify success.
- [ ] **Step 2: Rerun** `npm test && npm run lint && npm run build` after migration verification.
- [ ] **Step 3: Deploy** with `npx vercel --prod --yes` and require READY.
- [ ] **Step 4: Smoke-test the temporary production URL** through authenticated Dashboard, Roadmap, and Content Review flows.
- [ ] **Step 5: Assign** `formedlicensing.vercel.app` to the verified deployment and smoke-test it.
- [ ] **Step 6: Remove** `budgetracking.vercel.app` only after the new alias passes.
- [ ] **Step 7: Scan recent Vercel error logs** and report deployment ID, final alias, and any remaining warning.

## Workspace Safety

The main checkout contains approved but uncommitted fiscal-year and navigation work that is already deployed. Preserve it, implement on top of it, and do not reset or overwrite it. Do not create a misleading implementation commit that claims unrelated existing changes.
