# Planning UI Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent duplicate content-review records and improve the roadmap timeline, series table, and key manager.

**Architecture:** Keep the existing Next.js server-action and Supabase structure. Move interaction-heavy key management into a focused client modal, keep month focus as local presentation state, and make content-review creation return the inserted row so the client can turn its draft into a saved record immediately.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase, Vitest, Testing Library

---

## File map

- Modify `src/features/planning/planning-actions.ts`: return inserted review data, simplify category writes, and add category deletion.
- Modify `src/features/planning/components/content-review-dashboard.tsx`: remove blur writes, guard pending saves, and replace a saved draft with its database record.
- Modify `src/features/planning/components/content-review-workspace.test.tsx`: regression coverage for explicit one-time draft saving.
- Create `src/features/planning/components/category-manager-modal.tsx`: accessible modal with controlled name/color forms and confirmed deletion.
- Modify `src/features/planning/components/roadmap-dashboard.tsx`: use the key modal, add focused month state, fixed scrolling dimensions, and striped series rows.
- Modify `src/features/planning/components/roadmap-timeline.test.tsx`: component coverage for all roadmap UI changes.

### Task 1: Stop duplicate content-review creation

**Files:**
- Modify: `src/features/planning/components/content-review-workspace.test.tsx`
- Modify: `src/features/planning/planning-actions.ts`
- Modify: `src/features/planning/components/content-review-dashboard.tsx`

- [ ] **Step 1: Write the failing regression test**

Mock `addContentReviewItem`, create a draft, type its title, blur the field, and assert the action has not run. Click **Save Changes** twice while the first promise is pending and assert only one insert. Resolve the action with a saved `ContentReviewItem`, then assert the editor heading uses the saved title rather than `New Content Review`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/features/planning/components/content-review-workspace.test.tsx`

Expected: FAIL because blur currently inserts the draft and the draft never becomes a saved row.

- [ ] **Step 3: Return the inserted review from the server action**

Change the insert to `.select("id,title,provider,genre,format,review_status,notes,proposed_rate_cents,review_link,comparable_content").single()` and return a camel-cased `ContentReviewItem`. Preserve validation, auth, error handling, and route revalidation.

- [ ] **Step 4: Make saving explicit and idempotent in the client**

Remove every summary-row `onBlur` save. Exit `save()` when `isPending` is true. Await the insert result, replace the draft with the returned row in `records`, clear `draft`, and select the returned ID. Disable **Save Changes** while pending.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- src/features/planning/components/content-review-workspace.test.tsx`

Expected: PASS with no duplicate insert calls.

### Task 2: Add fixed, focusable roadmap months and series striping

**Files:**
- Modify: `src/features/planning/components/roadmap-timeline.test.tsx`
- Modify: `src/features/planning/components/roadmap-dashboard.tsx`

- [ ] **Step 1: Write failing timeline and striping tests**

Assert the timeline has `data-testid="roadmap-month-scroll"`, `md:h-[600px]`, and fixed 320px columns. Click the `January 2027` month button, assert February through June are hidden and **Show all months** appears, then restore the full timeline. Render two series and assert alternating `bg-white` and `bg-orange-50` rows.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/features/planning/components/roadmap-timeline.test.tsx`

Expected: FAIL because month focus, fixed dimensions, and orange striping do not exist.

- [ ] **Step 3: Implement local month focus**

Make `roadmap-dashboard.tsx` a client component, store `focusedMonthKey`, render one full-width month when focused, and render all months as fixed `w-[320px]` columns otherwise. Use a keyboard-accessible month-header button and a **Show all months** button.

- [ ] **Step 4: Implement the fixed scroll box and row colors**

Apply `h-[70vh] md:h-[600px] overflow-auto` to the month container. Alternate existing-series details by index between `bg-white` and `bg-orange-50`; keep the add-series row distinct.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- src/features/planning/components/roadmap-timeline.test.tsx`

Expected: PASS for focus, restoration, dimensions, and striping.

### Task 3: Replace Manage Key with a stable modal and deletion

**Files:**
- Modify: `src/features/planning/components/roadmap-timeline.test.tsx`
- Create: `src/features/planning/components/category-manager-modal.tsx`
- Modify: `src/features/planning/components/roadmap-dashboard.tsx`
- Modify: `src/features/planning/planning-actions.ts`

- [ ] **Step 1: Write failing modal tests**

Open **Manage Key** and assert an accessible dialog appears. Assert category name/color are present while Category status and Category order are absent. Edit a name and color, submit, and verify the controlled values stay visible. Confirm deletion is cancelled when `window.confirm` returns false and submitted when it returns true.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/features/planning/components/roadmap-timeline.test.tsx`

Expected: FAIL because Manage Key is still a `<details>` dropdown without deletion.

- [ ] **Step 3: Simplify category server actions and add delete**

Change category validation to name/color only plus IDs. Let inserts use database defaults for sort position and active state. Update only `name` and `color_key`. Add `deleteRoadmapCategory(formData)` validating `categoryId` and `fiscalYearId`, deleting within the fiscal year, and revalidating planning routes.

- [ ] **Step 4: Build the controlled modal**

Create a client `CategoryManagerModal` using the established native `<dialog>` pattern. Store each category's draft name/color in state, call update actions through guarded transitions, keep values after success, reset the add form only after successful creation, and show the exact delete warning: `Delete this key? Roadmap items will remain, but they will lose this key and color.`

- [ ] **Step 5: Wire the modal into the roadmap**

Remove the inline `CategoryManager` implementation and render `CategoryManagerModal` with the existing fiscal-year ID, categories, and demo flag.

- [ ] **Step 6: Run the focused test and verify GREEN**

Run: `npm test -- src/features/planning/components/roadmap-timeline.test.tsx`

Expected: PASS for modal behavior, simplified fields, stable values, and deletion confirmation.

### Task 4: Full verification

**Files:**
- Verify all modified files

- [ ] **Step 1: Run formatting and type-quality checks**

Run: `npm run lint`

Expected: exit 0 with no ESLint errors.

- [ ] **Step 2: Run the complete automated suite**

Run: `npm test`

Expected: all Vitest files and tests pass.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js production build exits 0.

- [ ] **Step 4: Verify in the browser**

Start the local app and verify: one review insert per explicit save; wider fixed-height roadmap scrolling; month focus and restoration; white/orange series rows; Manage Key modal edit persistence and confirmed deletion behavior. Check the browser console for errors.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intentional files modified.
