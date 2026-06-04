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

drop policy if exists "members can read fiscal years" on public.fiscal_years;
create policy "members can read fiscal years"
on public.fiscal_years for select
using (public.is_fiscal_year_member(fiscal_years.id, auth.uid()));

drop policy if exists "owners and editors can update fiscal years" on public.fiscal_years;
create policy "owners and editors can update fiscal years"
on public.fiscal_years for update
using (public.has_fiscal_year_role(fiscal_years.id, auth.uid(), array['owner', 'editor']));

drop policy if exists "members can read memberships" on public.fiscal_year_members;
create policy "members can read memberships"
on public.fiscal_year_members for select
using (public.is_fiscal_year_member(fiscal_year_members.fiscal_year_id, auth.uid()));

drop policy if exists "owners can manage memberships" on public.fiscal_year_members;
create policy "owners can manage memberships"
on public.fiscal_year_members for all
using (public.has_fiscal_year_role(fiscal_year_members.fiscal_year_id, auth.uid(), array['owner']))
with check (public.has_fiscal_year_role(fiscal_year_members.fiscal_year_id, auth.uid(), array['owner']));

drop policy if exists "members can read content licenses" on public.content_licenses;
create policy "members can read content licenses"
on public.content_licenses for select
using (public.is_fiscal_year_member(content_licenses.fiscal_year_id, auth.uid()));

drop policy if exists "owners and editors can manage content licenses" on public.content_licenses;
create policy "owners and editors can manage content licenses"
on public.content_licenses for all
using (public.has_fiscal_year_role(content_licenses.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(content_licenses.fiscal_year_id, auth.uid(), array['owner', 'editor']));
