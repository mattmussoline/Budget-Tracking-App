# Planning Navigation and Form Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dashboard, Roadmap, and Content Review clearly identify the active page, simplify the three add forms, and remove the stretched Saved Content Review block.

**Architecture:** Add one small shared planning-navigation component with an explicit active-page prop. Extend the existing input and select primitives with a white-surface option, then use it only in new-entry forms. Keep all server actions, saved-record forms, and database behavior unchanged.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright, Vercel.

---

### Task 1: Shared active-page navigation

**Files:**
- Create: `src/features/planning/components/planning-navigation.test.tsx`
- Create: `src/features/planning/components/planning-navigation.tsx`
- Modify: `src/features/planning/components/planning-shell.tsx`
- Modify: `src/features/budget/components/budget-dashboard.tsx`
- Modify: `src/app/content-review/page.tsx`
- Modify: `src/app/roadmap/page.tsx`

- [ ] **Step 1: Write the failing navigation test**

```tsx
render(<PlanningNavigation activeSection="content-review" />);
expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
expect(screen.getByRole("link", { name: "Roadmap" })).not.toHaveAttribute("aria-current");
expect(screen.getByRole("link", { name: "Content Review" })).toHaveAttribute("aria-current", "page");
expect(screen.getByRole("link", { name: "Content Review" })).toHaveClass("bg-white", "text-blue-700");
```

- [ ] **Step 2: Run the test and verify the red state**

Run: `npm test -- src/features/planning/components/planning-navigation.test.tsx`

Expected: FAIL because `planning-navigation.tsx` does not exist.

- [ ] **Step 3: Implement the shared navigation**

Create a component with `activeSection: "dashboard" | "roadmap" | "content-review"`. Render the three links in Dashboard, Roadmap, Content Review order. For the matching link, add `aria-current="page"` and `bg-white text-blue-700`; use `bg-blue-400 text-white hover:bg-white/20` for the other links.

- [ ] **Step 4: Wire navigation into each header**

Add `activeSection` to `PlanningShellProps`, render `PlanningNavigation`, and remove the unused `fiscalYearLabel` output. Pass `activeSection="content-review"` from both Content Review shell branches and `activeSection="roadmap"` from both Roadmap shell branches. Replace the Dashboard’s hand-written links with `<PlanningNavigation activeSection="dashboard" />`.

- [ ] **Step 5: Run the navigation test**

Run: `npm test -- src/features/planning/components/planning-navigation.test.tsx`

Expected: PASS with the Content Review link as the only current page.

### Task 2: White new-entry fields and shorter headings

**Files:**
- Create: `src/features/planning/components/planning-dashboards.test.tsx`
- Modify: `src/components/ui/soft-input.tsx`
- Modify: `src/components/ui/soft-select.tsx`
- Modify: `src/features/planning/components/content-review-dashboard.tsx`
- Modify: `src/features/planning/components/roadmap-dashboard.tsx`

- [ ] **Step 1: Write failing form-surface tests**

Render `ContentReviewDashboard` with no items and `RoadmapDashboard` with no roadmap items or ongoing series. Assert that Title, Stage, Release month, Status, Series, and Cadence controls have `bg-white`. Assert that the three removed helper descriptions are absent.

```tsx
expect(screen.getByLabelText("Title")).toHaveClass("bg-white");
expect(screen.getByLabelText("Stage")).toHaveClass("bg-white");
expect(screen.queryByText("This queue saves to Supabase.")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the tests and verify the red state**

Run: `npm test -- src/features/planning/components/planning-dashboards.test.tsx`

Expected: FAIL because add-form controls still use `bg-gray-100` and helper descriptions still render.

- [ ] **Step 3: Add an explicit field surface prop**

Add `surface?: "muted" | "white"` to `SoftInputProps` and `SoftSelectProps`, defaulting to `"muted"`. Choose exactly one background class in each primitive:

```tsx
surface === "white" ? "bg-white" : "bg-gray-100"
```

- [ ] **Step 4: Apply the white surface only to new-entry forms**

Pass `surface="white"` to every `SoftInput` and `SoftSelect` inside Add Review Content, Add Roadmap Content, and Ongoing Series. Do not change saved-item editing controls.

- [ ] **Step 5: Remove the three helper descriptions**

Delete the paragraph elements containing “This queue saves to Supabase.”, “Saved items stay after refresh.”, and “Cadence is saved in the database.” Keep the headings and icons unchanged.

- [ ] **Step 6: Run the dashboard tests**

Run: `npm test -- src/features/planning/components/planning-dashboards.test.tsx`

Expected: PASS with white new-entry controls and no helper descriptions.

### Task 3: Saved Content Review height correction

**Files:**
- Modify: `src/features/planning/components/planning-dashboards.test.tsx`
- Modify: `src/features/planning/components/content-review-dashboard.tsx`

- [ ] **Step 1: Add the failing layout-contract test**

Give the Saved Content Review surface a semantic `data-testid="saved-content-review"` and assert its class contains `h-fit`.

```tsx
expect(screen.getByTestId("saved-content-review")).toHaveClass("h-fit");
```

- [ ] **Step 2: Run the test and verify the red state**

Run: `npm test -- src/features/planning/components/planning-dashboards.test.tsx`

Expected: FAIL because the surface does not yet size itself to its content.

- [ ] **Step 3: Apply the minimal layout fix**

Add `h-fit` and the test id to the Saved Content Review `SoftSurface`. This prevents the right grid item from stretching to the height of the taller add form while retaining the dark heading and light record area.

- [ ] **Step 4: Run the dashboard tests**

Run: `npm test -- src/features/planning/components/planning-dashboards.test.tsx`

Expected: PASS.

### Task 4: Full verification and production deployment

**Files:**
- Verify only; no new committed artifact required.

- [ ] **Step 1: Run automated verification**

Run: `npm test && npm run lint && npm run build`

Expected: all tests pass, ESLint exits with zero errors, and Next.js produces a successful production build.

- [ ] **Step 2: Run browser verification**

Start the existing local app on port 5173. Verify `/dashboard`, `/roadmap`, and `/content-review` at desktop and mobile widths. Confirm correct page identity, no framework overlay, clean relevant console logs, active navigation state after clicks, white add fields, absent helper descriptions, and a content-sized Saved Content Review panel.

- [ ] **Step 3: Deploy the verified workspace**

Run: `npx vercel --prod --yes`

Expected: Vercel reports a ready production deployment and assigns the existing production alias.

- [ ] **Step 4: Verify production**

Open the production `/login` route and confirm it renders. If credentials are available in the active authenticated browser session, repeat the three-page navigation check against production. Inspect the deployment status and report the production URL.

## Workspace Safety

The workspace already contains overlapping, uncommitted fiscal-year management work. Preserve those changes, do not reset or overwrite them, and do not create an implementation commit that would accidentally claim unrelated work. Deploy only after the combined workspace passes the full verification gate.
