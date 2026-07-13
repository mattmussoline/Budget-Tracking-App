alter table public.roadmap_items
add column if not exists genre text,
add column if not exists format text;
