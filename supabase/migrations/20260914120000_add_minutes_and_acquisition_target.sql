-- Minutes-of-content tracking on licenses, roadmap items, review items, and ongoing series.
alter table public.content_licenses
add column if not exists minutes integer;

alter table public.content_licenses
drop constraint if exists content_licenses_minutes_check;

alter table public.content_licenses
add constraint content_licenses_minutes_check
check (minutes is null or minutes > 0);

alter table public.roadmap_items
add column if not exists minutes integer;

alter table public.roadmap_items
drop constraint if exists roadmap_items_minutes_check;

alter table public.roadmap_items
add constraint roadmap_items_minutes_check
check (minutes is null or minutes > 0);

alter table public.content_review_items
add column if not exists minutes integer;

alter table public.content_review_items
drop constraint if exists content_review_items_minutes_check;

alter table public.content_review_items
add constraint content_review_items_minutes_check
check (minutes is null or minutes > 0);

-- Ongoing series picks up the same budget-line tagging as licenses, roadmap items,
-- and review items, plus its own minutes and cost fields.
alter table public.ongoing_series
add column if not exists budget_source text not null default 'misc_licensing';

alter table public.ongoing_series
drop constraint if exists ongoing_series_budget_source_check;

alter table public.ongoing_series
add constraint ongoing_series_budget_source_check
check (budget_source in ('misc_licensing', 'internal', 'donor_funded', 'other'));

alter table public.ongoing_series
add column if not exists minutes integer;

alter table public.ongoing_series
drop constraint if exists ongoing_series_minutes_check;

alter table public.ongoing_series
add constraint ongoing_series_minutes_check
check (minutes is null or minutes > 0);

alter table public.ongoing_series
add column if not exists cost_cents integer;

alter table public.ongoing_series
drop constraint if exists ongoing_series_cost_cents_check;

alter table public.ongoing_series
add constraint ongoing_series_cost_cents_check
check (cost_cents is null or cost_cents >= 0);

-- Review pipeline: "Approved" becomes "Contracted" (a signed deal), and a new
-- "Acquisition Target" status sits immediately before it for content the team
-- has decided to pursue but hasn't yet put under contract.
alter table public.content_review_items
drop constraint if exists content_review_items_review_status_check;

alter table public.content_review_group_order
drop constraint if exists content_review_group_order_review_status_check;

update public.content_review_items
set review_status = 'contracted'
where review_status = 'approved';

update public.content_review_group_order
set review_status = 'contracted'
where review_status = 'approved';

alter table public.content_review_items
add constraint content_review_items_review_status_check
check (review_status in ('not_started', 'on_the_radar', 'in_progress', 'blocked', 'rejected', 'acquisition_target', 'contracted'));

alter table public.content_review_group_order
add constraint content_review_group_order_review_status_check
check (review_status in ('not_started', 'on_the_radar', 'in_progress', 'blocked', 'rejected', 'acquisition_target', 'contracted'));
