alter table public.content_licenses
add column if not exists content_type text not null default 'standalone';
alter table public.content_licenses
add column if not exists episode_count integer;
alter table public.content_licenses
drop constraint if exists content_licenses_content_type_check;
alter table public.content_licenses
add constraint content_licenses_content_type_check
check (content_type in ('standalone', 'series'));
alter table public.content_licenses
drop constraint if exists content_licenses_episode_count_check;
alter table public.content_licenses
add constraint content_licenses_episode_count_check
check (
  (content_type = 'series' and episode_count is not null and episode_count > 0)
  or (content_type = 'standalone' and episode_count is null)
);
