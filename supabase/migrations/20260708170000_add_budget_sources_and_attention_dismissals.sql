alter table public.content_licenses
add column if not exists budget_source text not null default 'misc_licensing';

alter table public.content_licenses
drop constraint if exists content_licenses_budget_source_check;

alter table public.content_licenses
add constraint content_licenses_budget_source_check
check (budget_source in ('misc_licensing', 'internal', 'donor_funded', 'other'));

alter table public.roadmap_items
add column if not exists budget_source text not null default 'misc_licensing';

alter table public.roadmap_items
drop constraint if exists roadmap_items_budget_source_check;

alter table public.roadmap_items
add constraint roadmap_items_budget_source_check
check (budget_source in ('misc_licensing', 'internal', 'donor_funded', 'other'));

alter table public.content_review_items
add column if not exists budget_source text not null default 'misc_licensing';

alter table public.content_review_items
drop constraint if exists content_review_items_budget_source_check;

alter table public.content_review_items
add constraint content_review_items_budget_source_check
check (budget_source in ('misc_licensing', 'internal', 'donor_funded', 'other'));

create table if not exists public.attention_dismissals (
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  attention_key text not null,
  dismissed_by_email text,
  dismissed_at timestamptz not null default now(),
  primary key (fiscal_year_id, attention_key)
);

create index if not exists attention_dismissals_fiscal_year_id_idx
on public.attention_dismissals(fiscal_year_id);

alter table public.attention_dismissals enable row level security;

drop policy if exists "members can read attention dismissals" on public.attention_dismissals;
create policy "members can read attention dismissals"
on public.attention_dismissals for select
using (public.is_fiscal_year_member(attention_dismissals.fiscal_year_id, auth.uid()));

drop policy if exists "owners and editors can manage attention dismissals" on public.attention_dismissals;
create policy "owners and editors can manage attention dismissals"
on public.attention_dismissals for all
using (public.has_fiscal_year_role(attention_dismissals.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(attention_dismissals.fiscal_year_id, auth.uid(), array['owner', 'editor']));
