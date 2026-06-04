create table if not exists public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  fiscal_year integer not null,
  fiscal_year_start_month integer not null default 7 check (fiscal_year_start_month between 1 and 12),
  budget_cents integer not null check (budget_cents >= 0),
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

create table if not exists public.content_licenses (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  provider text not null,
  installment_cents integer not null check (installment_cents >= 0),
  cadence text not null check (cadence in ('quarterly', 'yearly')),
  added_fiscal_month integer not null check (added_fiscal_month between 1 and 12),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_licenses_fiscal_year_id_idx on public.content_licenses(fiscal_year_id);
create index if not exists fiscal_year_members_user_id_idx on public.fiscal_year_members(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

drop trigger if exists fiscal_years_set_updated_at on public.fiscal_years;
create trigger fiscal_years_set_updated_at
before update on public.fiscal_years
for each row execute function public.set_updated_at();

drop trigger if exists content_licenses_set_updated_at on public.content_licenses;
create trigger content_licenses_set_updated_at
before update on public.content_licenses
for each row execute function public.set_updated_at();

drop trigger if exists fiscal_years_create_owner_membership on public.fiscal_years;
create trigger fiscal_years_create_owner_membership
after insert on public.fiscal_years
for each row execute function public.create_owner_membership_for_fiscal_year();

alter table public.fiscal_years enable row level security;
alter table public.fiscal_year_members enable row level security;
alter table public.content_licenses enable row level security;

create policy "members can read fiscal years"
on public.fiscal_years for select
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_years.id
      and members.user_id = auth.uid()
  )
);

create policy "owners can create fiscal years"
on public.fiscal_years for insert
with check (owner_id = auth.uid());

create policy "owners and editors can update fiscal years"
on public.fiscal_years for update
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_years.id
      and members.user_id = auth.uid()
      and members.role in ('owner', 'editor')
  )
);

create policy "members can read memberships"
on public.fiscal_year_members for select
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_year_members.fiscal_year_id
      and members.user_id = auth.uid()
  )
);

create policy "owners can manage memberships"
on public.fiscal_year_members for all
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_year_members.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = fiscal_year_members.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role = 'owner'
  )
);

create policy "members can read content licenses"
on public.content_licenses for select
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = content_licenses.fiscal_year_id
      and members.user_id = auth.uid()
  )
);

create policy "owners and editors can manage content licenses"
on public.content_licenses for all
using (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = content_licenses.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role in ('owner', 'editor')
  )
)
with check (
  exists (
    select 1 from public.fiscal_year_members members
    where members.fiscal_year_id = content_licenses.fiscal_year_id
      and members.user_id = auth.uid()
      and members.role in ('owner', 'editor')
  )
);
