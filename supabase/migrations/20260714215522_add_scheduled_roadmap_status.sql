alter table public.roadmap_items
drop constraint if exists roadmap_items_status_check;

alter table public.roadmap_items
add constraint roadmap_items_status_check
check (status in ('planned', 'scheduled', 'in_progress', 'blocked', 'released'));
