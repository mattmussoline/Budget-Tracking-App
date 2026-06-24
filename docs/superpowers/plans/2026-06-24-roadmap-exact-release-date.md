# Roadmap Exact Release Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let roadmap items save and display an exact calendar date while remaining grouped in monthly timeline columns.

**Architecture:** Keep the existing Supabase `release_month` date column to avoid a migration, but rename the application-facing property and form field to `releaseDate`. The timeline continues to group by the first seven date characters, while a small formatting helper renders the complete date without timezone drift.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zod, Supabase, Vitest, Testing Library

---

## File Map

- Modify `src/features/planning/planning-types.ts`: rename the roadmap domain property to `releaseDate`.
- Modify `src/features/planning/planning-model.ts`: add exact-date display formatting.
- Modify `src/features/planning/planning-model.test.ts`: test exact-date formatting.
- Modify `src/features/planning/components/roadmap-timeline.test.tsx`: test full-date display and date-input behavior.
- Modify `src/features/planning/components/roadmap-dashboard.tsx`: group by month but display and edit the full date.
- Modify `src/features/planning/planning-actions.ts`: validate and save the exact form date without month normalization.
- Modify `src/app/roadmap/page.tsx`: map the database date to the renamed domain property.

### Task 1: Specify exact-date behavior with failing tests

**Files:**
- Modify: `src/features/planning/planning-model.test.ts`
- Modify: `src/features/planning/components/roadmap-timeline.test.tsx`

- [ ] **Step 1: Write the failing model test**

Import `formatRoadmapDate` and add:

```ts
it("formats an exact roadmap date without timezone drift", () => {
  expect(formatRoadmapDate("2027-01-24")).toBe("January 24, 2027");
});
```

- [ ] **Step 2: Update the component fixture and add exact-date assertions**

Change fixture properties from `releaseMonth` to `releaseDate`, use `2027-01-24` for Aquinas 101, and add:

```ts
it("shows and edits the exact release date", () => {
  render(<RoadmapDashboard {...props} />);

  expect(screen.getByText("January 24, 2027")).toBeVisible();
  const dateInput = screen.getByLabelText("Release date", { selector: "#road-1-date" });
  expect(dateInput).toHaveAttribute("type", "date");
  expect(dateInput).toHaveValue("2027-01-24");
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run: `npm test -- src/features/planning/planning-model.test.ts src/features/planning/components/roadmap-timeline.test.tsx`

Expected: FAIL because `formatRoadmapDate` and `RoadmapItem.releaseDate` do not exist yet.

### Task 2: Implement the exact roadmap date flow

**Files:**
- Modify: `src/features/planning/planning-types.ts`
- Modify: `src/features/planning/planning-model.ts`
- Modify: `src/features/planning/components/roadmap-dashboard.tsx`
- Modify: `src/features/planning/planning-actions.ts`
- Modify: `src/app/roadmap/page.tsx`

- [ ] **Step 1: Rename the domain property**

Use this field in `RoadmapItem`:

```ts
releaseDate: string | null;
```

- [ ] **Step 2: Add timezone-safe display formatting**

Add to `planning-model.ts`:

```ts
export function formatRoadmapDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}
```

- [ ] **Step 3: Update the timeline and form**

Use `releaseDate?.slice(0, 7)` only for monthly grouping. Render `formatRoadmapDate(item.releaseDate)` on each card. Replace the month input with:

```tsx
<SoftInput
  id={`${item?.id ?? "new"}-date`}
  type="date"
  label="Release date"
  name="releaseDate"
  defaultValue={item?.releaseDate ?? ""}
  disabled={isDemo}
/>
```

- [ ] **Step 4: Save the exact date**

Replace the month schema and form field with:

```ts
const nullableDateSchema = z.union([
  z.literal(""),
  z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
]).optional();
```

Use `releaseDate: nullableDateSchema`, write `release_month: optionalText(parsed.data.releaseDate)`, update both error messages to mention `release date`, and remove `normalizeReleaseMonth`.

- [ ] **Step 5: Update database mapping**

Map the existing column without changing the database:

```ts
releaseDate: item.release_month,
```

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run: `npm test -- src/features/planning/planning-model.test.ts src/features/planning/components/roadmap-timeline.test.tsx`

Expected: both files PASS.

### Task 3: Verify the complete change

**Files:**
- Verify only; do not change unrelated files.

- [ ] **Step 1: Confirm old application names are gone**

Run: `rg -n "releaseMonth|normalizeReleaseMonth|Release month" src`

Expected: no matches.

- [ ] **Step 2: Run all automated checks**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`

Expected: every command exits successfully with no new warnings or errors.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check && git diff -- src/features/planning src/app/roadmap/page.tsx`

Expected: no whitespace errors; the diff contains only the exact-date implementation and its tests alongside pre-existing user changes.
