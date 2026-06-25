# Content Review Archive Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Approved and Rejected content-review items out of the active Decision Queue into collapsible archive sections on the same page.

**Architecture:** Keep the existing `ContentReviewDashboard` as the client-side owner of review state. Split its visible records into active, approved, and rejected groups before rendering, then reuse the same editable row controls for all groups so archived items remain selectable and editable. No database or server-action changes are needed because the existing `reviewStatus` field already drives the behavior.

**Tech Stack:** Next.js App Router, React client component state, TypeScript, Tailwind CSS, Vitest, React Testing Library.

---

## File structure

- Modify `src/features/planning/components/content-review-workspace.test.tsx`
  - Add regression tests for active-vs-archived grouping, archive counts, expanding archive sections, selecting archived items, and moving items between groups.
- Modify `src/features/planning/components/content-review-dashboard.tsx`
  - Add status grouping helpers.
  - Add reusable queue-row rendering so active and archived sections behave the same.
  - Replace the single flat queue render with an active queue plus Approved and Rejected collapsible archive sections.

---

## Task 1: Add failing tests for archive grouping

**Files:**
- Modify: `src/features/planning/components/content-review-workspace.test.tsx`

- [ ] **Step 1: Add representative active, approved, and rejected fixtures**

Add these fixtures below the existing `item` fixture:

```tsx
const activeItem: ContentReviewItem = {
  ...item,
  id: "review-active",
  title: "Active Review",
  reviewStatus: "in_progress"
};

const approvedItem: ContentReviewItem = {
  ...item,
  id: "review-approved",
  title: "Approved Review",
  reviewStatus: "approved"
};

const rejectedItem: ContentReviewItem = {
  ...item,
  id: "review-rejected",
  title: "Rejected Review",
  reviewStatus: "rejected"
};
```

- [ ] **Step 2: Add a test proving completed items leave the active queue**

Add this test inside `describe("ContentReviewDashboard", () => { ... })`:

```tsx
it("keeps approved and rejected items out of the active decision queue", () => {
  render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, approvedItem, rejectedItem]} isDemo />);

  const activeQueue = screen.getByTestId("active-review-queue");
  expect(activeQueue).toHaveTextContent("Active Review");
  expect(activeQueue).not.toHaveTextContent("Approved Review");
  expect(activeQueue).not.toHaveTextContent("Rejected Review");

  expect(screen.getByRole("button", { name: "Approved 1" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Rejected 1" })).toBeVisible();
});
```

- [ ] **Step 3: Add a test proving archived items expand and remain selectable**

Add this test after the previous one:

```tsx
it("expands archive sections and lets users select archived items", () => {
  render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, approvedItem, rejectedItem]} isDemo />);

  fireEvent.click(screen.getByRole("button", { name: "Approved 1" }));
  fireEvent.click(screen.getByDisplayValue("Approved Review"));

  expect(screen.getByLabelText("Detail Title")).toHaveValue("Approved Review");

  fireEvent.click(screen.getByRole("button", { name: "Rejected 1" }));
  fireEvent.click(screen.getByDisplayValue("Rejected Review"));

  expect(screen.getByLabelText("Detail Title")).toHaveValue("Rejected Review");
});
```

- [ ] **Step 4: Add a test proving status changes move rows between groups**

Add this test after the previous one:

```tsx
it("moves items between active and archive sections when review status changes", () => {
  render(<ContentReviewDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" items={[activeItem, approvedItem]} />);

  fireEvent.change(screen.getByDisplayValue("In Progress"), { target: { value: "approved" } });

  expect(screen.getByTestId("active-review-queue")).not.toHaveTextContent("Active Review");
  expect(screen.getByRole("button", { name: "Approved 2" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "Approved 2" }));
  fireEvent.change(screen.getByDisplayValue("Approved Review"), { target: { value: "blocked" } });

  expect(screen.getByTestId("active-review-queue")).toHaveTextContent("Approved Review");
  expect(screen.getByRole("button", { name: "Approved 1" })).toBeVisible();
});
```

- [ ] **Step 5: Run the targeted test file and verify these tests fail**

Run:

```bash
npm run test -- src/features/planning/components/content-review-workspace.test.tsx
```

Expected result:

```text
FAIL src/features/planning/components/content-review-workspace.test.tsx
TestingLibraryElementError: Unable to find an element by: [data-testid="active-review-queue"]
```

- [ ] **Step 6: Commit the failing tests**

Run:

```bash
git add src/features/planning/components/content-review-workspace.test.tsx
git commit -m "test: cover content review archive sections"
```

---

## Task 2: Add grouping helpers and reusable queue rows

**Files:**
- Modify: `src/features/planning/components/content-review-dashboard.tsx`

- [ ] **Step 1: Add grouping helpers near `blankDraft`**

Add this code after `blankDraft`:

```tsx
const ARCHIVED_REVIEW_STATUSES = new Set<ReviewStatus>(["approved", "rejected"]);

function isArchivedReviewStatus(status: ReviewStatus) {
  return ARCHIVED_REVIEW_STATUSES.has(status);
}

function groupReviewItems(items: ContentReviewItem[]) {
  return {
    active: items.filter((item) => !isArchivedReviewStatus(item.reviewStatus)),
    approved: items.filter((item) => item.reviewStatus === "approved"),
    rejected: items.filter((item) => item.reviewStatus === "rejected")
  };
}
```

- [ ] **Step 2: Add a reusable `QueueRow` component above `ReviewEditor`**

Add this component before `function ReviewEditor(...)`:

```tsx
function QueueRow({
  item,
  active,
  isDemo,
  onSelect,
  onChange
}: {
  item: ContentReviewItem;
  active: boolean;
  isDemo?: boolean;
  onSelect: () => void;
  onChange: (field: keyof ContentReviewItem, value: string | number | null) => void;
}) {
  const status = REVIEW_STATUSES.find((option) => option.value === item.reviewStatus) ?? REVIEW_STATUSES[0];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className={cn(
        "grid gap-2 rounded-lg border-l-4 bg-white p-3 transition md:grid-cols-[1.3fr_1fr_0.9fr_1fr]",
        TONE_CLASSES[status.tone].accent,
        active && "ring-2 ring-blue-500"
      )}
    >
      <input
        aria-label="Summary Title"
        value={item.title}
        placeholder="Untitled review"
        disabled={isDemo}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange("title", event.target.value)}
        className="min-h-10 min-w-0 w-full rounded-md border-0 bg-gray-50 px-3 text-sm font-extrabold"
      />
      <select
        aria-label="Summary Review Status"
        value={item.reviewStatus}
        disabled={isDemo}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange("reviewStatus", event.target.value as ReviewStatus)}
        className={cn("min-h-10 min-w-0 w-full rounded-md border-0 px-2 text-xs font-bold", TONE_CLASSES[status.tone].field)}
      >
        {REVIEW_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <CurrencyInput
        ariaLabel="Summary Proposed Rate"
        value={item.proposedRateCents}
        disabled={isDemo}
        onClick={(event) => event.stopPropagation()}
        onChange={(value) => onChange("proposedRateCents", value)}
        className="min-h-10 min-w-0 w-full rounded-md border-0 bg-gray-50 px-3 text-sm"
      />
      <input
        aria-label="Summary Provider"
        value={item.provider ?? ""}
        disabled={isDemo}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange("provider", event.target.value)}
        className="min-h-10 min-w-0 w-full rounded-md border-0 bg-blue-50 px-3 text-sm font-bold text-blue-800"
      />
    </div>
  );
}
```

- [ ] **Step 3: Run the targeted test file**

Run:

```bash
npm run test -- src/features/planning/components/content-review-workspace.test.tsx
```

Expected result:

```text
FAIL src/features/planning/components/content-review-workspace.test.tsx
TestingLibraryElementError: Unable to find an element by: [data-testid="active-review-queue"]
```

The helper exists, but the dashboard has not started using it yet.

---

## Task 3: Render active queue plus collapsible archive sections

**Files:**
- Modify: `src/features/planning/components/content-review-dashboard.tsx`

- [ ] **Step 1: Replace the flat `queue` value with grouped queues**

Replace:

```tsx
const queue = draft ? [draft, ...records] : records;
```

with:

```tsx
const queue = draft ? [draft, ...records] : records;
const groupedQueue = groupReviewItems(queue);
```

- [ ] **Step 2: Replace the existing flat queue JSX**

Replace the entire block that starts with:

```tsx
<div className="grid gap-2">
  {queue.length === 0 ? <p className="rounded-lg bg-white p-5 font-bold text-muted">Add content to start the decision queue.</p> : queue.map((item) => {
```

and ends with the matching closing `</div>` before `</section>` with:

```tsx
<div data-testid="active-review-queue" className="grid gap-2">
  {groupedQueue.active.length === 0 ? (
    <p className="rounded-lg bg-white p-5 font-bold text-muted">
      {queue.length === 0 ? "Add content to start the decision queue." : "No active reviews. Approved and rejected work is archived below."}
    </p>
  ) : groupedQueue.active.map((item) => (
    <QueueRow
      key={item.id}
      item={item}
      active={selectedId === item.id}
      isDemo={isDemo}
      onSelect={() => setSelectedId(item.id)}
      onChange={(field, value) => changeItem(item.id, field, value)}
    />
  ))}
</div>

<div className="mt-5 grid gap-3">
  <ArchiveSection
    title="Approved"
    count={groupedQueue.approved.length}
    items={groupedQueue.approved}
    tone="green"
    selectedId={selectedId}
    isDemo={isDemo}
    onSelect={setSelectedId}
    onChange={changeItem}
  />
  <ArchiveSection
    title="Rejected"
    count={groupedQueue.rejected.length}
    items={groupedQueue.rejected}
    tone="orange"
    selectedId={selectedId}
    isDemo={isDemo}
    onSelect={setSelectedId}
    onChange={changeItem}
  />
</div>
```

- [ ] **Step 3: Add the `ArchiveSection` component above `QueueRow`**

Add this component before `function QueueRow(...)`:

```tsx
function ArchiveSection({
  title,
  count,
  items,
  tone,
  selectedId,
  isDemo,
  onSelect,
  onChange
}: {
  title: string;
  count: number;
  items: ContentReviewItem[];
  tone: "green" | "orange";
  selectedId: string;
  isDemo?: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, field: keyof ContentReviewItem, value: string | number | null) => void;
}) {
  return (
    <details className="rounded-lg bg-white/70 p-3" open={false}>
      <summary className={cn("cursor-pointer rounded-md px-3 py-2 text-sm font-extrabold", TONE_CLASSES[tone].chip)}>
        {title} {count}
      </summary>
      <div className="mt-3 grid gap-2">
        {items.length === 0 ? (
          <p className="rounded-md bg-white p-3 text-sm font-bold text-muted">No {title.toLowerCase()} reviews yet.</p>
        ) : items.map((item) => (
          <QueueRow
            key={item.id}
            item={item}
            active={selectedId === item.id}
            isDemo={isDemo}
            onSelect={() => onSelect(item.id)}
            onChange={(field, value) => onChange(item.id, field, value)}
          />
        ))}
      </div>
    </details>
  );
}
```

- [ ] **Step 4: Run the targeted test file and verify it passes**

Run:

```bash
npm run test -- src/features/planning/components/content-review-workspace.test.tsx
```

Expected result:

```text
PASS src/features/planning/components/content-review-workspace.test.tsx
```

- [ ] **Step 5: Commit the archive-section implementation**

Run:

```bash
git add src/features/planning/components/content-review-dashboard.tsx
git commit -m "feat: archive completed content reviews"
```

---

## Task 4: Resolve test query ambiguity and run full verification

**Files:**
- Potentially modify: `src/features/planning/components/content-review-workspace.test.tsx`
- Potentially modify: `src/features/planning/components/content-review-dashboard.tsx`

- [ ] **Step 1: If Testing Library finds duplicate display values, scope row interactions**

If the test added in Task 1 fails because `getByDisplayValue("Approved Review")` finds both a summary row and detail field, change the relevant click to scope to the section:

```tsx
const approvedSection = screen.getByRole("button", { name: "Approved 1" }).closest("details");
expect(approvedSection).not.toBeNull();
fireEvent.click(within(approvedSection as HTMLElement).getByDisplayValue("Approved Review"));
```

If this change is needed, update the import at the top:

```tsx
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
```

- [ ] **Step 2: Run the targeted test file**

Run:

```bash
npm run test -- src/features/planning/components/content-review-workspace.test.tsx
```

Expected result:

```text
PASS src/features/planning/components/content-review-workspace.test.tsx
```

- [ ] **Step 3: Run the full test suite**

Run:

```bash
npm run test
```

Expected result:

```text
Test Files  ... passed
Tests       ... passed
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected result:

```text
no errors
```

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected result:

```text
✓ Compiled successfully
```

- [ ] **Step 6: Commit final verification adjustments if any files changed**

If Task 4 required test or implementation changes, run:

```bash
git add src/features/planning/components/content-review-workspace.test.tsx src/features/planning/components/content-review-dashboard.tsx
git commit -m "test: verify content review archive behavior"
```

If no files changed, do not create an empty commit.
