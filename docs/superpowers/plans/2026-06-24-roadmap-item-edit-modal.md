# Roadmap Item Edit Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Open each roadmap item's existing edit form in a centered, accessible modal instead of expanding it inside the timeline card.

**Architecture:** Add a focused client component that owns one native `<dialog>` and its card trigger. Keep the form and server actions in `roadmap-dashboard.tsx`, passing the existing edit form into the modal as children so field definitions and persistence remain unchanged.

**Tech Stack:** Next.js 15, React 19, TypeScript, native HTML dialog, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Specify the edit-modal behavior with a failing component test

**Files:**
- Modify: `src/features/planning/components/roadmap-timeline.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test inside the existing `RoadmapDashboard` describe block:

```tsx
it("opens and closes a roadmap item editor in a modal dialog", () => {
  render(<RoadmapDashboard fiscalYearId="00000000-0000-0000-0000-000000000028" roadmapItems={roadmapItems} ongoingSeries={series} categories={categories} startMonth="2027-01" monthCount={6} isDemo />);

  const trigger = screen.getByRole("button", { name: "Edit Aquinas 101" });
  fireEvent.click(trigger);

  const dialog = screen.getByRole("dialog", { name: "Edit Roadmap Item" });
  expect(dialog).toHaveAttribute("open");
  expect(within(dialog).getByDisplayValue("Aquinas 101")).toBeVisible();
  expect(within(dialog).getByRole("button", { name: "Save Item" })).toBeVisible();
  expect(within(dialog).getByRole("button", { name: "Delete" })).toBeVisible();

  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(dialog).not.toHaveAttribute("open");
  expect(trigger).toHaveFocus();
});
```

Update the Testing Library import:

```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm test -- src/features/planning/components/roadmap-timeline.test.tsx
```

Expected: FAIL because no button named `Edit Aquinas 101` exists and roadmap cards still use inline `<details>`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/features/planning/components/roadmap-timeline.test.tsx
git commit -m "test: specify roadmap edit modal"
```

### Task 2: Build the accessible roadmap edit modal

**Files:**
- Create: `src/features/planning/components/edit-roadmap-modal.tsx`

- [ ] **Step 1: Create the client-side dialog boundary**

```tsx
"use client";

import { type MouseEvent, type ReactNode, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui/soft-surface";
import { TONE_CLASSES, type PlanningTone } from "../planning-constants";
import type { RoadmapCategory, RoadmapItem } from "../planning-types";

type EditRoadmapModalProps = {
  item: RoadmapItem;
  category?: RoadmapCategory;
  children: ReactNode;
};

export function EditRoadmapModal({ item, category, children }: EditRoadmapModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tone = (category?.colorKey && category.colorKey in TONE_CLASSES ? category.colorKey : "slate") as PlanningTone;

  const openDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };

  const closeDialog = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    triggerRef.current?.focus();
  };

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeDialog();
  };

  return <>
    <button ref={triggerRef} type="button" onClick={openDialog} aria-label={`Edit ${item.title}`} className={cn("w-full rounded-md border-l-4 bg-white p-3 text-left", TONE_CLASSES[tone].accent)}>
      <p className="font-extrabold leading-tight">{item.title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {category ? <span className={cn("rounded-full px-2 py-1 text-[9px] font-extrabold uppercase", TONE_CLASSES[tone].chip)}>{category.name}</span> : null}
        {item.provider ? <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold">{item.provider}</span> : null}
        {item.releaseMonth ? <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-bold">{item.releaseMonth.slice(0, 7)}</span> : null}
      </div>
    </button>
    <dialog ref={dialogRef} aria-labelledby={`edit-roadmap-title-${item.id}`} onClick={closeFromBackdrop} onClose={() => triggerRef.current?.focus()} className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-gray-950/60">
      <div className="flex max-h-[calc(100vh-2rem)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 sm:p-7">
          <div><p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">Roadmap</p><h2 id={`edit-roadmap-title-${item.id}`} className="font-display text-3xl font-extrabold">Edit Roadmap Item</h2></div>
          <button type="button" onClick={closeDialog} aria-label="Close edit roadmap modal" className="rounded-md bg-gray-100 p-3 text-muted hover:bg-gray-200 hover:text-foreground"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>
        <div className="overflow-y-auto px-5 sm:px-7">{children}</div>
        <footer className="flex justify-end border-t border-gray-200 p-4 sm:px-7"><button type="button" onClick={closeDialog} className="min-h-12 rounded-md px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-muted hover:bg-gray-100">Cancel</button></footer>
      </div>
    </dialog>
  </>;
}
```

- [ ] **Step 2: Run the focused test and confirm it still fails for missing integration**

Run:

```bash
npm test -- src/features/planning/components/roadmap-timeline.test.tsx
```

Expected: FAIL at `Edit Aquinas 101`; the new component exists but is not rendered yet.

### Task 3: Replace the inline roadmap editor with the modal

**Files:**
- Modify: `src/features/planning/components/roadmap-dashboard.tsx`
- Test: `src/features/planning/components/roadmap-timeline.test.tsx`

- [ ] **Step 1: Import the modal**

```tsx
import { EditRoadmapModal } from "./edit-roadmap-modal";
```

- [ ] **Step 2: Replace `RoadmapCard` with the modal wrapper**

```tsx
function RoadmapCard({ item, category, categories, fiscalYearId, isDemo }: { item: RoadmapItem; category?: RoadmapCategory; categories: RoadmapCategory[]; fiscalYearId: string; isDemo?: boolean }) {
  return <EditRoadmapModal item={item} category={category}>
    <RoadmapForm fiscalYearId={fiscalYearId} categories={categories} item={item} isDemo={isDemo} />
  </EditRoadmapModal>;
}
```

Remove the no-longer-used `PlanningTone` import from this server component, but retain `cn` and `TONE_CLASSES` because the legend still uses them.

- [ ] **Step 3: Run the focused test to verify GREEN**

Run:

```bash
npm test -- src/features/planning/components/roadmap-timeline.test.tsx
```

Expected: all roadmap timeline tests PASS.

- [ ] **Step 4: Run the complete automated checks**

```bash
npm test
npm run lint
npm run build
```

Expected: each command exits 0 with no new warnings or errors.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/features/planning/components/edit-roadmap-modal.tsx src/features/planning/components/roadmap-dashboard.tsx src/features/planning/components/roadmap-timeline.test.tsx
git commit -m "feat: edit roadmap items in modal"
```

### Task 4: Verify the rendered desktop and mobile flow

**Files:**
- No source changes expected

- [ ] **Step 1: Start the local app**

```bash
APP_PASSWORD=codex-local-check npm run dev
```

Expected: Next.js reports the app ready at `http://localhost:5173`.

- [ ] **Step 2: Verify desktop behavior**

Open `/roadmap`, authenticate if required, click a visible roadmap item, and verify:

- A centered `Edit Roadmap Item` dialog opens over a dimmed roadmap.
- The title, provider, month, status, category, and notes fields fit without horizontal overflow.
- Save Item, Delete, Cancel, and the X close button are visible and usable.
- Clicking within the form does not close the dialog.
- Cancel, X, Escape, and backdrop click each close it.
- Focus returns to the triggering card.

- [ ] **Step 3: Verify mobile behavior**

At a 390-by-844 viewport, repeat the open and close flow. Confirm the panel stays inside the viewport and the form area scrolls while the header and footer remain visible.

- [ ] **Step 4: Record the QA result**

Report the tested route, desktop and mobile viewport sizes, modal interactions exercised, console errors, and any limitation caused by demo or local-auth state. Do not deploy unless the user separately requests it.
