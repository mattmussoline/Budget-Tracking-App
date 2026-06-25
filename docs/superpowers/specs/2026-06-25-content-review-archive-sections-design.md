# Content Review Archive Sections Design

## Goal

Keep the Content Review decision queue focused on active work by moving Approved and Rejected items into separate collapsible sections on the same page.

## Chosen layout

- Use the **collapsible archive sections** layout.
- The main Decision Queue shows only active review items:
  - Not Started
  - In Progress
  - Blocked
- Approved and Rejected items appear below the active queue in their own collapsible sections.
- Each archive section shows a count so the user can see how much completed work is there without expanding it.
- Approved uses the existing green status tone. Rejected uses the existing orange status tone.

## Interaction behavior

- Changing an item to Approved or Rejected moves it out of the active queue and into the matching archive section.
- Changing an item from Approved or Rejected back to an active status moves it back into the active queue.
- Archived items remain selectable. Clicking one still opens the same editor on the right.
- The movement happens visually as soon as the status changes, but the page keeps the current save model: the change becomes durable only after **Save Changes** succeeds.
- The selected item remains selected after it moves sections so the right-side editor does not feel like it disappeared.

## Data model

- No database schema changes are needed.
- Use the existing `review_status` field on `content_review_items`.
- Keep the existing server-action persistence flow for content review saves.
- Keep fiscal-year filtering unchanged.

## Component approach

- Split the visible queue into active, approved, and rejected groups inside the existing content review dashboard.
- Keep the existing detail editor and save behavior.
- Add small reusable queue/section rendering helpers only if they make the dashboard easier to read.
- Preserve the current Add Content draft behavior. A new draft starts as Not Started, so it appears in the active queue.

## Empty states

- If there are no active items, show a short empty-state message in the active queue.
- If Approved or Rejected is empty, keep that section collapsed or show a simple zero-count section without visual weight.
- Avoid adding a second page, modal, or global archive area. Everything stays on the Content Review page.

## Testing and verification

- Component test: Approved and Rejected items do not appear in the active Decision Queue.
- Component test: Approved and Rejected archive sections show the correct counts.
- Component test: expanding an archive section reveals the matching items and lets the user select one.
- Component test: changing a selected item from active to Approved or Rejected moves it to the matching section.
- Component test: changing an archived item back to an active status moves it back into the active queue.
- Keep existing tests for draft creation, option controls, explicit saves, and proposed-rate editing.
- Run the relevant component tests, lint, and production build before claiming completion.

## Out of scope

- No database migration.
- No new page for completed reviews.
- No deployment unless separately requested.
- No changes to roadmap or ongoing-series planning screens.
