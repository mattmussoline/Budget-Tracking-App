# Fiscal Year Management Design

## Goal

Make fiscal-year budgets easier to manage from the dashboard. An administrator can choose the shared default budget, delete obsolete budgets, and create another fiscal year without losing the existing editing form.

## Dashboard behavior

- Each fiscal-year button supports a right-click context menu.
- Each button also has an accessible three-dot menu for keyboard, touch, and users who do not know about right-clicking.
- The menu contains **Pin as default** and **Delete budget**.
- The pinned budget displays a small pin icon.
- An **Add fiscal year** button appears beside the fiscal-year buttons. It reveals the existing fiscal-year creation form without replacing the current dashboard.
- Only one creation form is open at a time. It can be closed without changing data.

## Shared pinned budget

- Add an `is_pinned` Boolean column to `fiscal_years`.
- The pinned budget is shared by everyone; it is not a per-user preference.
- Pinning a budget unpins every other budget, then pins the selected budget.
- When `/dashboard` has no `fy` query parameter, it opens the pinned budget.
- An explicit valid `?fy=<id>` selection takes priority over the pinned budget.
- If no budget is pinned, the newest fiscal year remains the fallback.
- Roadmap and Content Review should use the same default-selection rule so the shared pinned year remains consistent across the app.

## Deletion

- Choosing **Delete budget** opens a confirmation dialog naming the fiscal year.
- The warning states that the budget and all linked titles, roadmap items, ongoing series, content-review items, memberships, and provider settings will be permanently deleted.
- Confirming deletes the `fiscal_years` row. Existing foreign keys cascade the deletion to linked records.
- If the deleted budget was active or pinned, the user returns to the dashboard and the next available fiscal year opens.
- If no budgets remain, the empty-state fiscal-year creation form appears.

## Server and data rules

- Server actions validate fiscal-year IDs before pinning or deleting.
- Pinning and deletion require an authenticated internal session.
- Pinning is performed as one database operation so two budgets are not intentionally left pinned.
- Database constraints or a partial unique index enforce that at most one fiscal year is pinned.
- After pinning or deleting, the dashboard, roadmap, and content-review routes are revalidated.

## Components

- Extract the fiscal-year button list and its menus into a focused client component.
- Keep fiscal-year data loading and default selection on the server.
- Extend `FiscalYearSettings` so it can continue editing the active year and can also render a separate create form when **Add fiscal year** is selected.

## Testing and verification

- Unit-test default-year selection: explicit selection, pinned fallback, newest-year fallback, and empty state.
- Test that pin and delete actions reject invalid IDs and perform the expected database updates.
- Browser-test opening the menu, pinning a year, returning to the dashboard, canceling deletion, confirming deletion, and opening/closing the add-year form.
- Run lint, unit tests, production build, and a local browser verification before completion.

## Out of scope

- Per-user pinned budgets.
- Recovering deleted budgets or adding a trash/archive system.
- Changing the existing fiscal-year editing fields.
