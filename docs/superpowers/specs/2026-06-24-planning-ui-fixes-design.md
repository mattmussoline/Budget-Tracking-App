# Planning UI Fixes Design

## Goal

Fix duplicate content-review creation and make the roadmap planning surfaces easier to scan and manage.

## Content review saving

- A new review remains a client-side draft until the user clicks **Save Changes**.
- Editing or leaving fields in a new draft must never insert a database row.
- After the first successful insert, the new row replaces the draft in local state and becomes the selected saved review.
- Later saves update that row by ID instead of inserting another row.
- Existing review items continue to save from the explicit **Save Changes** button. Summary-row blur must not initiate writes.
- While a save is running, the save button is disabled so repeated clicks cannot create duplicate requests.
- A regression test will prove that field blur does not create a row and repeated save interaction cannot insert the same draft more than once.

## Roadmap timeline

- Month columns use a fixed desktop width of 320 pixels so cards have more breathing room.
- The timeline sits inside a 600-pixel-high desktop box with internal horizontal and vertical scrolling. On smaller screens, it uses a 70-viewport-height box so controls remain reachable.
- Each month header is a keyboard-accessible button.
- Clicking a month focuses it inside the same timeline box, showing that month at full available width.
- Focused mode includes a clear **Show all months** control that restores the multi-month timeline.
- Month focus is temporary client-side presentation state; the existing fiscal-year, start-month, and range URL behavior remains unchanged.

## Ongoing Series Cadence

- Existing table behavior and fields remain unchanged.
- Data rows alternate between white and light orange to make neighboring series easier to distinguish.
- The orange remains pale enough to preserve input readability and accessible contrast.

## Manage Key modal

- Replace the current expandable dropdown with a button that opens a modal dialog.
- Reuse the native dialog interaction pattern already used by the Add Roadmap and Edit Roadmap modals.
- The modal supports Cancel, Escape, backdrop click, focus restoration, and an accessible label.
- Category creation and editing show only the category name and color. Active/Retired and numeric position controls are removed from the interface.
- The existing database columns remain unchanged. New categories use the database defaults and all categories are shown in their existing fetched order.
- Category edit inputs use controlled client state and submit deliberately instead of relying on native server-action form resets. After a successful save, the edited name and color stay visible.
- Each saved category has a Delete action. Deletion requires a confirmation explaining that roadmap items remain but lose that category and color.
- The database's existing `on delete set null` relationship handles category removal without deleting roadmap items.

## Error handling and verification

- Existing save-state feedback remains visible for content-review saves, including error state.
- Automated component tests cover duplicate prevention, month focus/restoration, fixed scroll container classes, striped series rows, Manage Key modal interaction, simplified category fields, stable saved values, and confirmed category deletion.
- Run lint, the complete test suite, and a production build.
- Verify the four user flows in the rendered app before claiming completion.

## Out of scope

- No database schema changes.
- No changes to roadmap filtering or fiscal-year selection.
- No production deployment unless separately requested.
