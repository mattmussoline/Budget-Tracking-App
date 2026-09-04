create table if not exists public.coproduction_opportunities (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  partner text not null,
  format text,
  genre text,
  episodes text,
  ask_cents bigint not null default 0 check (ask_cents >= 0),
  likelihood integer not null default 50 check (likelihood between 0 and 100),
  likelihood_rationale text,
  stage text not null default 'inbound' check (stage in ('inbound', 'in_review', 'negotiating', 'greenlit', 'passed')),
  score_mission integer not null default 50 check (score_mission between 0 and 100),
  score_mission_rationale text,
  score_audience integer not null default 50 check (score_audience between 0 and 100),
  score_audience_rationale text,
  score_economics integer not null default 50 check (score_economics between 0 and 100),
  score_economics_rationale text,
  score_partner integer not null default 50 check (score_partner between 0 and 100),
  score_partner_rationale text,
  score_delivery integer not null default 50 check (score_delivery between 0 and 100),
  score_delivery_rationale text,
  notes text,
  graded_by text,
  graded_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coproduction_opportunities_fiscal_year_id_idx
on public.coproduction_opportunities(fiscal_year_id);

drop trigger if exists coproduction_opportunities_set_updated_at on public.coproduction_opportunities;
create trigger coproduction_opportunities_set_updated_at
before update on public.coproduction_opportunities
for each row execute function public.set_updated_at();

alter table public.coproduction_opportunities enable row level security;

create policy "members can read coproduction opportunities"
on public.coproduction_opportunities for select
using (public.is_fiscal_year_member(coproduction_opportunities.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage coproduction opportunities"
on public.coproduction_opportunities for all
using (public.has_fiscal_year_role(coproduction_opportunities.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(coproduction_opportunities.fiscal_year_id, auth.uid(), array['owner', 'editor']));

create table if not exists public.coproduction_updates (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  opportunity_id uuid not null references public.coproduction_opportunities(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'stage_change', 'created')),
  body text,
  from_stage text,
  to_stage text,
  author_email text,
  created_at timestamptz not null default now()
);

create index if not exists coproduction_updates_fy_created_idx
on public.coproduction_updates (fiscal_year_id, created_at desc);

create index if not exists coproduction_updates_opportunity_idx
on public.coproduction_updates (opportunity_id, created_at desc);

alter table public.coproduction_updates enable row level security;

create policy "members can read coproduction updates"
on public.coproduction_updates for select
using (public.is_fiscal_year_member(coproduction_updates.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage coproduction updates"
on public.coproduction_updates for all
using (public.has_fiscal_year_role(coproduction_updates.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(coproduction_updates.fiscal_year_id, auth.uid(), array['owner', 'editor']));
