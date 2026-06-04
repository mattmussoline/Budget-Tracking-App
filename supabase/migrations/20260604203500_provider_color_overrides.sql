create table if not exists public.provider_color_overrides (
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  provider text not null,
  color_key text not null check (color_key in ('blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'lime')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (fiscal_year_id, provider)
);

create index if not exists provider_color_overrides_fiscal_year_id_idx
on public.provider_color_overrides(fiscal_year_id);

drop trigger if exists provider_color_overrides_set_updated_at on public.provider_color_overrides;
create trigger provider_color_overrides_set_updated_at
before update on public.provider_color_overrides
for each row execute function public.set_updated_at();

alter table public.provider_color_overrides enable row level security;

drop policy if exists "members can read provider color overrides" on public.provider_color_overrides;
create policy "members can read provider color overrides"
on public.provider_color_overrides for select
using (public.is_fiscal_year_member(provider_color_overrides.fiscal_year_id, auth.uid()));

drop policy if exists "owners and editors can manage provider color overrides" on public.provider_color_overrides;
create policy "owners and editors can manage provider color overrides"
on public.provider_color_overrides for all
using (public.has_fiscal_year_role(provider_color_overrides.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(provider_color_overrides.fiscal_year_id, auth.uid(), array['owner', 'editor']));
