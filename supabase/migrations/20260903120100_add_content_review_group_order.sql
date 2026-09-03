create table if not exists public.content_review_group_order (
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  review_status text not null check (review_status in ('not_started', 'on_the_radar', 'in_progress', 'blocked', 'rejected', 'approved')),
  sort_order integer not null,
  primary key (fiscal_year_id, review_status)
);

create index if not exists content_review_group_order_fiscal_year_id_idx
on public.content_review_group_order(fiscal_year_id);

alter table public.content_review_group_order enable row level security;

create policy "members can read content review group order"
on public.content_review_group_order for select
using (public.is_fiscal_year_member(content_review_group_order.fiscal_year_id, auth.uid()));

create policy "owners and editors can manage content review group order"
on public.content_review_group_order for all
using (public.has_fiscal_year_role(content_review_group_order.fiscal_year_id, auth.uid(), array['owner', 'editor']))
with check (public.has_fiscal_year_role(content_review_group_order.fiscal_year_id, auth.uid(), array['owner', 'editor']));
