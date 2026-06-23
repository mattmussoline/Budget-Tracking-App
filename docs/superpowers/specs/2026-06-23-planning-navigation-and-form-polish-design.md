# Planning Navigation and Form Polish

## Goal

Make Dashboard, Roadmap, and Content Review feel like three clear sections of one application. A user should immediately know which page is open, and the planning forms should be visually clean and consistent.

## Navigation

- Show Dashboard, Roadmap, and Content Review in the same order on all three pages.
- Keep the existing blue header design.
- Style only the current page button with a white background and blue text.
- Style the other page buttons with the existing lighter-blue treatment.
- Add `aria-current="page"` to the current page link for accessibility.
- Remove the fiscal-year label from the Roadmap and Content Review headers.
- Keep fiscal-year selection on the Dashboard because it controls the budget being viewed.

## Add Forms

- Make the inputs and selects white in Add Review Content, Add Roadmap Content, and Ongoing Series.
- Keep saved-record editing fields gray so new entry and existing record areas remain visually distinct.
- Remove the helper descriptions under those three add-form headings:
  - “This queue saves to Supabase.”
  - “Saved items stay after refresh.”
  - “Cadence is saved in the database.”
- Preserve all labels, placeholders, validation, actions, and Supabase behavior.

## Saved Content Review Layout

- Keep the dark Saved Content Review heading and light-gray record area.
- Make the panel size itself to its content instead of stretching to match the taller add form.
- Remove the large empty dark area shown below the saved record.
- Preserve the existing responsive grid and record editing controls.

## Scope

This is a focused visual and navigation polish. It does not change the database schema, server actions, authentication, fiscal-year filtering, or saved data.

## Verification

- Add component-level tests that confirm active navigation state, removed fiscal-year text, removed helper descriptions, and white new-entry fields.
- Run the full unit-test, lint, and production-build checks.
- Verify Dashboard, Roadmap, and Content Review in the browser at desktop and mobile widths.
- Confirm each navigation click lands on the correct page and visibly updates the active button.
- Confirm Saved Content Review no longer stretches into an empty dark block.
