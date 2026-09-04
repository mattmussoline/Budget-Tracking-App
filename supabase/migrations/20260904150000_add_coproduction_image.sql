alter table public.coproduction_opportunities
add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('coproduction-images', 'coproduction-images', true)
on conflict (id) do nothing;

drop policy if exists "public read coproduction images" on storage.objects;
create policy "public read coproduction images"
on storage.objects for select
using (bucket_id = 'coproduction-images');
