# Roadmap Item Edit Modal

## Goal

Replace the cramped inline roadmap-item editor with a focused, centered modal while preserving the existing saved data and server actions.

## Interaction

- Clicking a roadmap card opens its edit modal instead of expanding the card.
- The roadmap remains visible behind a dimmed backdrop.
- The modal closes with the X button, Cancel button, Escape key, or a click on the backdrop.
- Closing returns keyboard focus to the roadmap card that opened the modal.
- The Add Roadmap Item and Manage Key experiences remain unchanged.

## Layout

- The modal uses a centered panel with a clear `Edit Roadmap Item` heading.
- The header and footer actions remain visible while a long form scrolls within the modal.
- Existing fields remain: Title, Provider, Release month, Status, Color category, and Notes.
- Save Item is the primary action. Cancel is secondary. Delete is visually separated as a destructive action.
- On small screens, the panel uses nearly the full viewport width and limits its height so no content is pushed off-screen.

## Accessibility

- Use native dialog semantics with an accessible title.
- Move focus into the modal when it opens and keep keyboard focus inside it until it closes.
- Keep every existing form label and disabled demo-state behavior.
- Do not close the modal when the user clicks inside the panel.

## Data and Error Behavior

- Continue using the existing `updateRoadmapItem` and `deleteRoadmapItem` server actions.
- Do not change the roadmap schema or persistence model.
- Saving and deleting continue through normal form submission and server revalidation.
- If client-side dialog scripting is unavailable, the roadmap cards remain readable; editing requires the interactive client component.

## Component Boundary

- Convert the roadmap card interaction into a small client-side modal boundary.
- Keep timeline grouping, backlog calculation, server actions, and form fields in their existing focused responsibilities.
- Reuse `RoadmapForm` for editing so the modal does not duplicate field definitions.

## Verification

- Component test: clicking a roadmap card opens a dialog containing the correct item fields.
- Component test: Cancel and Escape close the dialog.
- Component test: Save and Delete retain their existing server-action wiring.
- Browser QA: verify open, close, scrolling, and form layout on desktop and mobile.
- Run the relevant component tests, full test suite, lint, and production build before claiming completion.

## Scope Exclusions

- No changes to Add Roadmap Item or Manage Key.
- No drag-and-drop scheduling.
- No database migration or deployment unless separately requested.
