alter table public.fiscal_years
add column if not exists is_pinned boolean not null default false;

create unique index if not exists fiscal_years_one_pinned_idx
on public.fiscal_years (is_pinned)
where is_pinned;

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
