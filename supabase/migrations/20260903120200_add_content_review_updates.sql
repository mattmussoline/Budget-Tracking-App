create table if not exists public.content_review_updates (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  item_id text not null references public.content_review_items(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'status_change', 'created')),
  body text,
  from_status text,
  to_status text,
  author_email text,
  created_at timestamptz not null default now()
);

create index if not exists content_review_updates_fy_created_idx
on public.content_review_updates (fiscal_year_id, created_at desc);

create index if not exists content_review_updates_item_idx
on public.content_review_updates (item_id, created_at desc);

alter table public.content_review_updates enable row level security;

create policy "members can read content review updates"
on public.content_review_updates for select
using (public.is_fiscal_year_member(content_review_updates.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage content review updates"
on public.content_review_updates for all
using (public.has_fiscal_year_role(content_review_updates.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(content_review_updates.fiscal_year_id, auth.uid(), array['owner', 'editor']));
