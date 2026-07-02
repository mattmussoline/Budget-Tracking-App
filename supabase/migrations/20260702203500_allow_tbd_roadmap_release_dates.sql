do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'roadmap_items'
      and column_name = 'release_month'
      and data_type = 'date'
  ) then
    alter table public.roadmap_items
      alter column release_month type text
      using release_month::text;
  end if;
end $$;
