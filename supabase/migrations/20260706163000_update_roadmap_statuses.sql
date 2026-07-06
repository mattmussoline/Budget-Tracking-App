update public.roadmap_items
set status = 'in_progress'
where status = 'ready';

alter table public.roadmap_items
drop constraint if exists roadmap_items_status_check;

alter table public.roadmap_items
add constraint roadmap_items_status_check
check (status in ('planned', 'in_progress', 'blocked', 'released'));
