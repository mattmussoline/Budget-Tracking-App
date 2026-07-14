create table if not exists public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  fiscal_year integer not null,
  fiscal_year_start_month integer not null default 7 check (fiscal_year_start_month between 1 and 12),
  budget_cents integer not null check (budget_cents >= 0),
  is_pinned boolean not null default false,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fiscal_year_members (
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (fiscal_year_id, user_id)
);

create table if not exists public.app_access_invites (
  email text primary key,
  invited_by_email text not null,
  created_at timestamptz not null default now(),
  constraint app_access_invites_lowercase_email check (email = lower(email)),
  constraint app_access_invites_allowed_domain check (
    email like '%@augustineinstitute.org'
    or email like '%@augustine.edu'
  )
);

insert into public.app_access_invites (email, invited_by_email)
values ('matt.mussoline@augustineinstitute.org', 'matt.mussoline@augustineinstitute.org')
on conflict (email) do nothing;

create table if not exists public.content_licenses (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  provider text not null,
  installment_cents integer not null check (installment_cents >= 0),
  cadence text not null check (cadence in ('quarterly', 'yearly')),
  added_fiscal_month integer not null check (added_fiscal_month between 1 and 12),
  budget_source text not null default 'misc_licensing' check (budget_source in ('misc_licensing', 'internal', 'donor_funded', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_color_overrides (
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  provider text not null,
  color_key text not null check (color_key in ('blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'lime', 'teal', 'sky', 'indigo', 'fuchsia', 'pink', 'orange', 'yellow', 'green', 'red', 'purple', 'slate', 'zinc', 'stone', 'neutral', 'gray')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (fiscal_year_id, provider)
);

create table if not exists public.roadmap_categories (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  name text not null,
  color_key text not null default 'blue' check (color_key in ('blue', 'amber', 'green', 'purple', 'red', 'cyan', 'orange', 'slate')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fiscal_year_id, name)
);

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  provider text,
  genre text,
  format text,
  featured_in_individual_marketing boolean not null default false,
  release_month text,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'blocked', 'released')),
  budget_source text not null default 'misc_licensing' check (budget_source in ('misc_licensing', 'internal', 'donor_funded', 'other')),
  notes text,
  category_id uuid references public.roadmap_categories(id) on delete set null,
  clickup_task_id text,
  clickup_task_url text,
  clickup_synced_at timestamptz,
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
  review_status text not null default 'not_started' check (review_status in ('not_started', 'on_the_radar', 'in_progress', 'blocked', 'rejected', 'approved')),
  budget_source text not null default 'misc_licensing' check (budget_source in ('misc_licensing', 'internal', 'donor_funded', 'other')),
  notes text,
  proposed_rate_cents bigint check (proposed_rate_cents >= 0),
  review_link text,
  comparable_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_licenses_fiscal_year_id_idx on public.content_licenses(fiscal_year_id);
create index if not exists fiscal_year_members_user_id_idx on public.fiscal_year_members(user_id);
create unique index if not exists fiscal_years_one_pinned_idx
on public.fiscal_years (is_pinned)
where is_pinned;
create index if not exists provider_color_overrides_fiscal_year_id_idx on public.provider_color_overrides(fiscal_year_id);
create index if not exists roadmap_items_fiscal_year_id_idx on public.roadmap_items(fiscal_year_id);
create index if not exists roadmap_categories_fiscal_year_id_idx on public.roadmap_categories(fiscal_year_id);
create index if not exists roadmap_items_category_id_idx on public.roadmap_items(category_id);
create index if not exists roadmap_items_clickup_task_id_idx on public.roadmap_items(clickup_task_id) where clickup_task_id is not null;
create index if not exists ongoing_series_fiscal_year_id_idx on public.ongoing_series(fiscal_year_id);
create index if not exists content_review_items_fiscal_year_id_idx on public.content_review_items(fiscal_year_id);

create table if not exists public.attention_dismissals (
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  attention_key text not null,
  dismissed_by_email text,
  dismissed_at timestamptz not null default now(),
  primary key (fiscal_year_id, attention_key)
);

create index if not exists attention_dismissals_fiscal_year_id_idx on public.attention_dismissals(fiscal_year_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.pin_fiscal_year(target_fiscal_year_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('fiscal_years_global_pin'));

  if not exists (
    select 1
    from public.fiscal_years
    where id = target_fiscal_year_id
  ) then
    raise exception 'Fiscal year not found.';
  end if;

  update public.fiscal_years
  set is_pinned = false
  where is_pinned;

  update public.fiscal_years
  set is_pinned = true
  where id = target_fiscal_year_id;
end;
$$;

revoke all on function public.pin_fiscal_year(uuid) from public;
grant execute on function public.pin_fiscal_year(uuid) to service_role;

create or replace function public.create_owner_membership_for_fiscal_year()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.fiscal_year_members (fiscal_year_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (fiscal_year_id, user_id) do nothing;

  return new;
end;
$$;

create or replace function public.is_fiscal_year_member(target_fiscal_year_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.fiscal_year_members members
    where members.fiscal_year_id = target_fiscal_year_id
      and members.user_id = target_user_id
  );
$$;

create or replace function public.has_fiscal_year_role(
  target_fiscal_year_id uuid,
  target_user_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.fiscal_year_members members
    where members.fiscal_year_id = target_fiscal_year_id
      and members.user_id = target_user_id
      and members.role = any(allowed_roles)
  );
$$;

drop trigger if exists fiscal_years_set_updated_at on public.fiscal_years;
create trigger fiscal_years_set_updated_at
before update on public.fiscal_years
for each row execute function public.set_updated_at();

drop trigger if exists content_licenses_set_updated_at on public.content_licenses;
create trigger content_licenses_set_updated_at
before update on public.content_licenses
for each row execute function public.set_updated_at();

drop trigger if exists provider_color_overrides_set_updated_at on public.provider_color_overrides;
create trigger provider_color_overrides_set_updated_at
before update on public.provider_color_overrides
for each row execute function public.set_updated_at();

drop trigger if exists roadmap_items_set_updated_at on public.roadmap_items;
create trigger roadmap_items_set_updated_at
before update on public.roadmap_items
for each row execute function public.set_updated_at();

drop trigger if exists roadmap_categories_set_updated_at on public.roadmap_categories;
create trigger roadmap_categories_set_updated_at
before update on public.roadmap_categories
for each row execute function public.set_updated_at();

drop trigger if exists ongoing_series_set_updated_at on public.ongoing_series;
create trigger ongoing_series_set_updated_at
before update on public.ongoing_series
for each row execute function public.set_updated_at();

drop trigger if exists content_review_items_set_updated_at on public.content_review_items;
create trigger content_review_items_set_updated_at
before update on public.content_review_items
for each row execute function public.set_updated_at();

drop trigger if exists fiscal_years_create_owner_membership on public.fiscal_years;
create trigger fiscal_years_create_owner_membership
after insert on public.fiscal_years
for each row execute function public.create_owner_membership_for_fiscal_year();

alter table public.fiscal_years enable row level security;
alter table public.fiscal_year_members enable row level security;
alter table public.app_access_invites enable row level security;
alter table public.content_licenses enable row level security;
alter table public.provider_color_overrides enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.roadmap_categories enable row level security;
alter table public.ongoing_series enable row level security;
alter table public.content_review_items enable row level security;
alter table public.attention_dismissals enable row level security;

create policy "members can read fiscal years"
on public.fiscal_years for select
using (public.is_fiscal_year_member(fiscal_years.id, auth.uid()));

create policy "owners can create fiscal years"
on public.fiscal_years for insert
with check (owner_id = auth.uid());

create policy "owners and editors can update fiscal years"
on public.fiscal_years for update
using (public.has_fiscal_year_role(fiscal_years.id, auth.uid(), array['owner', 'editor']));

create policy "members can read memberships"
on public.fiscal_year_members for select
using (public.is_fiscal_year_member(fiscal_year_members.fiscal_year_id, auth.uid()));

create policy "owners can manage memberships"
on public.fiscal_year_members for all
using (public.has_fiscal_year_role(fiscal_year_members.fiscal_year_id, auth.uid(), array['owner']))
with check (public.has_fiscal_year_role(fiscal_year_members.fiscal_year_id, auth.uid(), array['owner']));

create policy "members can read content licenses"
on public.content_licenses for select
using (public.is_fiscal_year_member(content_licenses.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage content licenses"
on public.content_licenses for all
using (public.has_fiscal_year_role(content_licenses.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(content_licenses.fiscal_year_id, auth.uid(), array['owner', 'editor']));

create policy "members can read provider color overrides"
on public.provider_color_overrides for select
using (public.is_fiscal_year_member(provider_color_overrides.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage provider color overrides"
on public.provider_color_overrides for all
using (public.has_fiscal_year_role(provider_color_overrides.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(provider_color_overrides.fiscal_year_id, auth.uid(), array['owner', 'editor']));

create policy "members can read roadmap items"
on public.roadmap_items for select
using (public.is_fiscal_year_member(roadmap_items.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage roadmap items"
on public.roadmap_items for all
using (public.has_fiscal_year_role(roadmap_items.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(roadmap_items.fiscal_year_id, auth.uid(), array['owner', 'editor']));

create policy "members can read roadmap categories"
on public.roadmap_categories for select
using (public.is_fiscal_year_member(roadmap_categories.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage roadmap categories"
on public.roadmap_categories for all
using (public.has_fiscal_year_role(roadmap_categories.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(roadmap_categories.fiscal_year_id, auth.uid(), array['owner', 'editor']));

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

create policy "members can read attention dismissals"
on public.attention_dismissals for select
using (public.is_fiscal_year_member(attention_dismissals.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage attention dismissals"
on public.attention_dismissals for all
using (public.has_fiscal_year_role(attention_dismissals.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(attention_dismissals.fiscal_year_id, auth.uid(), array['owner', 'editor']));
