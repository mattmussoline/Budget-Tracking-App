create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  provider text,
  release_month text not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'ready', 'released')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ongoing_series (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  series text not null,
  cadence text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_review_items (
  id text primary key default gen_random_uuid()::text,
  fiscal_year_id uuid references public.fiscal_years(id) on delete cascade,
  title text not null,
  provider text,
  genre text,
  format text,
  stage text not null default 'new' check (stage in ('new', 'reviewing', 'approved', 'parked', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_review_items
  add column if not exists fiscal_year_id uuid references public.fiscal_years(id) on delete cascade,
  add column if not exists review_stage text,
  add column if not exists stage text default 'new',
  add column if not exists updated_at timestamptz not null default now();

alter table public.content_review_items
  alter column id set default gen_random_uuid()::text;

update public.content_review_items
set stage = case
  when lower(coalesce(review_stage, '')) in ('new', 'reviewing', 'approved', 'parked', 'rejected')
    then lower(review_stage)
  else 'new'
end
where stage is null or stage = 'new';

update public.content_review_items
set fiscal_year_id = (select id from public.fiscal_years order by fiscal_year desc limit 1)
where fiscal_year_id is null;

create index if not exists roadmap_items_fiscal_year_id_idx on public.roadmap_items(fiscal_year_id);
create index if not exists ongoing_series_fiscal_year_id_idx on public.ongoing_series(fiscal_year_id);
create index if not exists content_review_items_fiscal_year_id_idx on public.content_review_items(fiscal_year_id);

drop trigger if exists roadmap_items_set_updated_at on public.roadmap_items;
create trigger roadmap_items_set_updated_at
before update on public.roadmap_items
for each row execute function public.set_updated_at();

drop trigger if exists ongoing_series_set_updated_at on public.ongoing_series;
create trigger ongoing_series_set_updated_at
before update on public.ongoing_series
for each row execute function public.set_updated_at();

drop trigger if exists content_review_items_set_updated_at on public.content_review_items;
create trigger content_review_items_set_updated_at
before update on public.content_review_items
for each row execute function public.set_updated_at();

alter table public.roadmap_items enable row level security;
alter table public.ongoing_series enable row level security;
alter table public.content_review_items enable row level security;

create policy "members can read roadmap items"
on public.roadmap_items for select
using (public.is_fiscal_year_member(roadmap_items.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage roadmap items"
on public.roadmap_items for all
using (public.has_fiscal_year_role(roadmap_items.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(roadmap_items.fiscal_year_id, auth.uid(), array['owner', 'editor']));

create policy "members can read ongoing series"
on public.ongoing_series for select
using (public.is_fiscal_year_member(ongoing_series.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage ongoing series"
on public.ongoing_series for all
using (public.has_fiscal_year_role(ongoing_series.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(ongoing_series.fiscal_year_id, auth.uid(), array['owner', 'editor']));

create policy "members can read content review items"
on public.content_review_items for select
using (public.is_fiscal_year_member(content_review_items.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage content review items"
on public.content_review_items for all
using (public.has_fiscal_year_role(content_review_items.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(content_review_items.fiscal_year_id, auth.uid(), array['owner', 'editor']));
