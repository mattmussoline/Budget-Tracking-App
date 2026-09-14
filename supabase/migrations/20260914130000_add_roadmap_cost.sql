-- Roadmap items now carry a cost, the same way minutes and budget line are
-- required for every piece of content. Nullable at the DB level since
-- existing rows have no real cost to backfill; required going forward at
-- the form/action layer.
alter table public.roadmap_items
add column if not exists cost_cents integer;

alter table public.roadmap_items
drop constraint if exists roadmap_items_cost_cents_check;

alter table public.roadmap_items
add constraint roadmap_items_cost_cents_check
check (cost_cents is null or cost_cents >= 0);
