alter table public.roadmap_items
add column if not exists formed_url text;

create index if not exists roadmap_items_formed_url_idx
on public.roadmap_items(formed_url)
where formed_url is not null;
