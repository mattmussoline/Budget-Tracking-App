# Planning Workspace Redesign

## Goal

Turn Content Review and Roadmap into clear, colorful planning workspaces. Content Review should support fast decisions from a compact queue with deeper editing one click away. Roadmap should support a browsable month timeline, a backlog, recurring series, and user-managed color categories.

## Shared Principles

- Keep the existing blue application header and active-page navigation.
- Preserve fiscal-year filtering and all existing saved records.
- Use color to communicate categories and states without relying on color alone.
- Keep all writes authenticated and server-side through the existing Supabase admin boundary.
- Show clear saving, saved, and error feedback for every edit.
- Support desktop, tablet, mobile, mouse, and keyboard use.

## Content Review

### Layout

Use the approved master-detail layout.

- Desktop and tablet: the Decision Queue appears on the left and the selected record editor appears on the right.
- Mobile: the selected record editor appears directly below the selected queue row.
- A compact `Add Content` button replaces the current large add form.
- `Add Content` opens a blank local draft. Nothing is inserted into Supabase until a title is provided and the draft is saved.

### Decision Queue

Each summary row contains four directly editable fields:

1. Title
2. Review Status
3. Proposed Rate
4. Provider

Clicking the non-control area of a row selects it and loads the full editor. Summary-field changes auto-save on blur or dropdown selection. Each row displays an accessible status indicator: Saving, Saved, or Error.

### Selected Review Editor

The full editor contains:

1. Title
2. Proposed Rate
3. Review Link
4. Review Notes, as long text
5. Comparable Content, as long text
6. Provider
7. Genre, as a colored dropdown
8. Format, as a colored dropdown
9. Review Status, as a colored dropdown

The detail panel saves these fields together through one `Save Changes` action. Delete remains available but visually secondary and requires confirmation.

### Review Status Options

- Not Started
- In Progress
- Blocked
- Rejected
- Approved

The old values migrate as follows:

- `new` → Not Started
- `reviewing` → In Progress
- `parked` → Blocked
- `rejected` → Rejected
- `approved` → Approved

### Genre Options

- Scripture
- Christian Living
- International
- Christian Formation
- Talk Show
- Saints
- Liturgical Seasons
- Conference Talk
- Prayer
- Sacraments
- Music
- Fiction
- Biography

### Format Options

- Movie
- Documentary
- Prayer
- Kids Movie
- Music Video
- Presentation
- TV Show
- Docu-Series
- Conversations
- Kids Show
- Reflection
- Formation Series
- Sacramental Prep
- Small Group Study
- Ministry Resource

Genre, Format, and Review Status receive stable color assignments. The text label remains visible so meaning never depends on color alone.

### Content Review Data

Extend `content_review_items` with:

- `proposed_rate_cents bigint`
- `review_link text`
- `comparable_content text`

Reuse the existing `notes` column as Review Notes. Rename the existing `stage` column to `review_status`, migrate its values to the approved status set, and replace the old check constraint. Proposed Rate accepts formatted dollar input but stores integer cents.

## Roadmap

### Timeline

Replace the saved-record form stack with a horizontally scrollable month board.

- Range controls: 6 months, 9 months, or 12 months.
- Time controls: Previous, Today, and Next.
- The selected start month and range live in URL query parameters so the view can be refreshed or shared.
- Past and future months use the same controls and layout.
- Each month header shows its title and release count.
- Cards show title, category chip, provider when present, and status when useful.
- Clicking a roadmap card opens its editor.

### Backlog

- Roadmap items without a release month appear in Backlog.
- Items beyond the current visible range remain saved and can also be surfaced in Backlog context.
- Assigning a release month moves an undated item into the correct timeline column.
- Unrecognized legacy month text migrates to Backlog rather than being discarded.

### Editable Color Key

Add user-managed roadmap categories scoped to a fiscal year.

- A category has a name, color, sort order, and active state.
- Users can create, rename, recolor, reorder, or retire a category.
- Each roadmap item may reference one category.
- The category color controls the card accent, category chip, and legend entry.
- Changing a category color updates every matching roadmap card.
- Retired categories remain attached to historical items until reassigned.
- Colors come from an accessible application palette rather than unrestricted text entry.

Add a `roadmap_categories` table and a nullable `category_id` foreign key on `roadmap_items`.

### Calendar Data

Convert Roadmap release months into real dates representing the first day of the month. Make the release month nullable so Backlog is supported. Recognized values such as `August 2026` migrate to `2026-08-01`.

### Ongoing Series

Keep Ongoing Series Cadence beneath the timeline as a compact table. Preserve its current series, cadence, and notes data. Adding and editing recurring series remains available without crowding the primary month board.

## Components and Boundaries

- `ContentReviewWorkspace`: coordinates selected record and draft state.
- `DecisionQueue`: owns compact editable summary rows.
- `ReviewDetailPanel`: owns the full editor and explicit save action.
- `RoadmapTimeline`: computes and renders visible month columns.
- `RoadmapToolbar`: owns start-month and 6/9/12-month URL controls.
- `RoadmapCard`: renders one item and its category styling.
- `RoadmapCategoryManager`: manages the saved color key.
- `RoadmapBacklog`: handles undated and outside-window items.
- Existing server actions remain the write boundary and receive focused schema extensions.

Static genre, format, status, and accessible color definitions live in focused planning constants rather than being duplicated across components.

## Save and Error Behavior

- Summary auto-save runs only after a value changes.
- While saving, the row displays Saving and prevents duplicate writes for that field.
- Success displays Saved briefly.
- Failure displays Error, keeps the entered value visible, and offers Retry.
- Detail-panel validation keeps the user in place and identifies the invalid field.
- Review Link is optional but must be a valid HTTP or HTTPS URL when provided.
- Database migration and server-action failures stop deployment before the production alias changes.

## Accessibility and Responsive Behavior

- Queue rows can be selected with Enter or Space when focus is on the row container.
- Form controls remain independently usable without triggering row selection.
- Selected rows expose `aria-current` or `aria-selected` state.
- Color chips retain readable text and compliant contrast.
- The Roadmap timeline uses horizontal scrolling without causing whole-page overflow.
- On small screens, the detail panel follows the selected review row and roadmap columns remain swipe-scrollable.

## Verification

- Migration tests cover review-status mapping, proposed-rate storage, recognized month parsing, and invalid month fallback to Backlog.
- Unit tests cover controlled options, currency conversion, visible month ranges, previous/today/next navigation, category color propagation, and save-state transitions.
- Component tests cover queue selection, inline summary editing, draft creation, detail saving, and mobile detail placement.
- Browser QA covers Content Review and Roadmap on desktop and mobile.
- A disposable review item and roadmap item verify the real Supabase write/read/delete cycle.
- Full tests, lint, and production build must pass before deployment.

## Production Alias Cutover

1. Apply and verify the Supabase migration.
2. Deploy the application to Vercel production.
3. Assign `formedlicensing.vercel.app` to the verified production deployment.
4. Confirm authenticated Dashboard, Roadmap, and Content Review flows on the new alias.
5. Remove `budgetracking.vercel.app` only after the new alias passes verification.

The old alias will not remain attached after the cutover.
If the requested Vercel alias is unavailable, stop the cutover, keep the current alias working, and report the conflict instead of choosing a different name.

## Scope Exclusions

- No drag-and-drop roadmap scheduling in this version.
- No arbitrary custom hex-color entry; users choose from the accessible palette.
- No new provider-management database table.
- No change to authentication or fiscal-year ownership rules.
