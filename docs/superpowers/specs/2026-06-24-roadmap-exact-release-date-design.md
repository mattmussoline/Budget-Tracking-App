# Roadmap Exact Release Date Design

## Goal

Allow each roadmap item to use a full calendar date instead of only a month and year, while keeping the roadmap organized into monthly columns.

## User Experience

- Replace the `Release month` month picker with a `Release date` date picker.
- Display the full release date on each roadmap card, such as `June 24, 2026`.
- Continue grouping cards into the monthly column that contains their release date.
- Continue placing items without a date, or outside the visible range, in the backlog.

## Data and Code

- Keep using the existing Supabase `date` column; no database migration is required.
- Rename the application field and form value from `releaseMonth` to `releaseDate` so the code matches the behavior.
- Validate date values in `YYYY-MM-DD` format and store them without converting them to the first day of the month.
- Preserve existing saved values. Older month-only records previously converted to the first day of a month will remain unchanged until edited.

## Error Handling

- An empty release date remains allowed and sends the item to the backlog.
- Invalid dates are rejected by the server action with a message asking the user to check the title, release date, and status.

## Testing

- Add or update component tests to verify the exact date appears on a roadmap card and the form uses a date input.
- Add or update model/action tests to verify full dates are accepted without month normalization.
- Run the focused tests, full test suite, typecheck, lint, and production build.

## Scope

This change does not replace the monthly roadmap layout, add day-level columns, or alter unrelated planning features.
