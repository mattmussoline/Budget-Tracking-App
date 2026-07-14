alter table public.roadmap_items
add column if not exists featured_in_individual_marketing boolean not null default false;
