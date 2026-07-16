alter table public.content_review_items
add column if not exists is_coproduction_opportunity boolean not null default false;
