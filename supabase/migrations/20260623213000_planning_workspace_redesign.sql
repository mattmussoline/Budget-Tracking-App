alter table public.content_review_items
  add column if not exists proposed_rate_cents bigint check (proposed_rate_cents >= 0),
  add column if not exists review_link text,
  add column if not exists comparable_content text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_review_items' and column_name = 'stage'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'content_review_items' and column_name = 'review_status'
  ) then
    alter table public.content_review_items rename column stage to review_status;
  end if;
end $$;

alter table public.content_review_items
  add column if not exists review_status text;

update public.content_review_items
set review_status = case lower(coalesce(review_status, ''))
  when 'new' then 'not_started'
  when 'reviewing' then 'in_progress'
  when 'parked' then 'blocked'
  when 'rejected' then 'rejected'
  when 'approved' then 'approved'
  when 'not_started' then 'not_started'
  when 'in_progress' then 'in_progress'
  when 'blocked' then 'blocked'
  else 'not_started'
end;

alter table public.content_review_items
  alter column review_status set default 'not_started',
  alter column review_status set not null,
  drop constraint if exists content_review_items_stage_check,
  drop constraint if exists content_review_items_review_status_check;

alter table public.content_review_items
  add constraint content_review_items_review_status_check
  check (review_status in ('not_started', 'in_progress', 'blocked', 'rejected', 'approved'));

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'roadmap_items'
      and column_name = 'release_month'
      and data_type in ('text', 'character varying')
  ) then
    alter table public.roadmap_items add column if not exists release_month_date date;

    update public.roadmap_items
    set release_month_date = case
      when release_month ~ '^\d{4}-(0[1-9]|1[0-2])-01$' then release_month::date
      when release_month ~* '^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$'
        then to_date(release_month, 'FMMonth YYYY')
      else null
    end;

    alter table public.roadmap_items drop column release_month;
    alter table public.roadmap_items rename column release_month_date to release_month;
  end if;
end $$;

create table if not exists public.roadmap_categories (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  name text not null,
  color_key text not null default 'blue'
    check (color_key in ('blue', 'amber', 'green', 'purple', 'red', 'cyan', 'orange', 'slate')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fiscal_year_id, name)
);

alter table public.roadmap_items
  add column if not exists category_id uuid references public.roadmap_categories(id) on delete set null;

create index if not exists roadmap_categories_fiscal_year_id_idx
on public.roadmap_categories(fiscal_year_id);

create index if not exists roadmap_items_category_id_idx
on public.roadmap_items(category_id);

drop trigger if exists roadmap_categories_set_updated_at on public.roadmap_categories;
create trigger roadmap_categories_set_updated_at
before update on public.roadmap_categories
for each row execute function public.set_updated_at();

alter table public.roadmap_categories enable row level security;

drop policy if exists "members can read roadmap categories" on public.roadmap_categories;
create policy "members can read roadmap categories"
on public.roadmap_categories for select
using (public.is_fiscal_year_member(roadmap_categories.fiscal_year_id, auth.uid()));

drop policy if exists "owners and editors can manage roadmap categories" on public.roadmap_categories;
create policy "owners and editors can manage roadmap categories"
on public.roadmap_categories for all
using (public.has_fiscal_year_role(roadmap_categories.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(roadmap_categories.fiscal_year_id, auth.uid(), array['owner', 'editor']));
