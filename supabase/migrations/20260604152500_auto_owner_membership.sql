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

drop trigger if exists fiscal_years_create_owner_membership on public.fiscal_years;
create trigger fiscal_years_create_owner_membership
after insert on public.fiscal_years
for each row execute function public.create_owner_membership_for_fiscal_year();
