# Fiscal Year Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared pinned fiscal year, destructive budget deletion, and a restored add-fiscal-year control to the budget dashboard.

**Architecture:** Supabase stores one shared `is_pinned` flag and exposes a transactional pinning RPC. A pure selection helper chooses an explicit year, then the pinned year, then the newest year. A focused client component owns the context menu, confirmation prompt, and create-form visibility while server actions perform authenticated mutations.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, Vitest, Playwright, Tailwind CSS

---

### Task 1: Default fiscal-year selection

**Files:**
- Create: `src/features/budget/fiscal-year-selection.ts`
- Create: `src/features/budget/fiscal-year-selection.test.ts`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/roadmap/page.tsx`
- Modify: `src/app/content-review/page.tsx`

- [ ] **Step 1: Write the failing selection tests**

Test `selectFiscalYear` with rows shaped as `{ id, is_pinned }`. Assert that a valid explicit ID wins, an invalid or absent ID falls back to the pinned row, the first row is used when nothing is pinned, and an empty list returns `null`.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/features/budget/fiscal-year-selection.test.ts`

Expected: FAIL because `fiscal-year-selection.ts` does not exist.

- [ ] **Step 3: Implement the minimal helper**

```ts
export function selectFiscalYear<T extends { id: string; is_pinned: boolean }>(rows: T[], selectedId?: string): T | null {
  return rows.find((row) => row.id === selectedId) ?? rows.find((row) => row.is_pinned) ?? rows[0] ?? null;
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/features/budget/fiscal-year-selection.test.ts`

Expected: all selection tests pass.

- [ ] **Step 5: Use the helper on all fiscal-year-backed pages**

Add `is_pinned` to each `fiscal_years` select and replace repeated selection expressions with `selectFiscalYear(fiscalYears ?? [], selectedFiscalYearId)`.

### Task 2: Shared pin database contract

**Files:**
- Create: `supabase/migrations/20260623120000_add_pinned_fiscal_year.sql`
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Add the schema migration**

Add `is_pinned boolean not null default false`, a partial unique index that permits only one `is_pinned = true` row, and `public.pin_fiscal_year(uuid)`. The function must reject an unknown ID, clear the existing pin, and pin the selected row within the RPC's single database transaction.

- [ ] **Step 2: Mirror the migration in the canonical schema**

Keep `supabase/schema.sql` aligned with the migration, including the column, index, function, and execution grants.

- [ ] **Step 3: Validate the local database definitions**

Run: `supabase db lint --local`

Expected: no schema errors. If a local Supabase instance is unavailable, verify the migration through the linked database workflow before production deployment.

### Task 3: Authenticated pin and delete actions

**Files:**
- Modify: `src/features/budget/budget-actions.ts`
- Test: `tests/e2e/budget-flow.spec.ts`

- [ ] **Step 1: Add failing browser assertions for the action menu**

Assert that right-clicking a fiscal-year control exposes **Pin as default** and **Delete budget**, and that the three-dot button exposes the same actions.

- [ ] **Step 2: Run the focused browser test and verify RED**

Run: `npm run test:e2e -- --grep "fiscal year management"`

Expected: FAIL because the menu and server actions do not exist.

- [ ] **Step 3: Add minimal server actions**

Implement `pinFiscalYear(formData)` and `deleteFiscalYear(formData)` with a UUID schema, `requireInternalSession()`, Supabase error checks, and route revalidation for `/dashboard`, `/roadmap`, and `/content-review`. Pin through `admin.rpc("pin_fiscal_year", { target_fiscal_year_id: id })`; delete through `admin.from("fiscal_years").delete().eq("id", id)` and redirect to `/dashboard`.

- [ ] **Step 4: Keep destructive behavior explicit**

Return a clear error when a fiscal year is missing or invalid. Let foreign-key cascades remove content licenses, roadmap records, ongoing series, reviews, memberships, and provider settings.

### Task 4: Fiscal-year menus and add-year form

**Files:**
- Create: `src/features/budget/components/fiscal-year-manager.tsx`
- Modify: `src/features/budget/components/budget-dashboard.tsx`
- Modify: `src/features/budget/components/fiscal-year-settings.tsx`
- Modify: `tests/e2e/budget-flow.spec.ts`

- [ ] **Step 1: Extend failing browser coverage**

Add checks that the pinned year shows a pin icon, **Add fiscal year** opens the create form without hiding the active dashboard, **Cancel** closes it, canceling deletion preserves the year, and confirming deletion navigates to the next available year.

- [ ] **Step 2: Run the focused browser test and verify RED**

Run: `npm run test:e2e -- --grep "fiscal year management"`

Expected: FAIL on the first missing UI behavior.

- [ ] **Step 3: Build the focused client component**

`FiscalYearManager` receives fiscal-year rows and the active ID. It renders links, pin indicators, per-year three-dot buttons, an `onContextMenu` handler, accessible menu roles, forms bound to the pin/delete server actions, and an **Add fiscal year** toggle.

- [ ] **Step 4: Add safe deletion confirmation**

The delete form must call `window.confirm` with the selected fiscal-year label and state that all linked budget, roadmap, and content-review data will be permanently deleted. Canceling must prevent submission.

- [ ] **Step 5: Restore fiscal-year creation**

Render `FiscalYearSettings` in create mode when the toggle is open, add a cancel callback/button for this mode, and keep the active-year editing panel unchanged.

- [ ] **Step 6: Replace the header link list**

Use `FiscalYearManager` in `BudgetDashboard` and pass `is_pinned` through the fiscal-year row type.

- [ ] **Step 7: Run focused unit and browser checks**

Run: `npm test -- src/features/budget/fiscal-year-selection.test.ts`

Run: `npm run test:e2e -- --grep "fiscal year management"`

Expected: both commands pass.

### Task 5: Full verification

**Files:**
- Review: all files changed by Tasks 1-4

- [ ] **Step 1: Apply the migration to the intended Supabase project**

Run the repository's established Supabase migration command and confirm the `is_pinned` column, unique index, and RPC exist before testing live mutations.

- [ ] **Step 2: Run all automated checks**

Run: `npm run lint`

Run: `npm test`

Run: `npm run build`

Expected: each command exits successfully with no failures.

- [ ] **Step 3: Verify the complete browser flow**

Start the app with its local password configuration, then verify: add a temporary year, pin it, leave and return to `/dashboard`, confirm it opens by default, cancel deletion once, delete it, and confirm the prior year becomes the fallback. Also confirm Roadmap and Content Review use the shared pinned default.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check` and `git status --short`. Confirm no unrelated user files are staged or changed.
