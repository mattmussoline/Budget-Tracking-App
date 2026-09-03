alter table public.content_review_items
add column if not exists priority_rank integer;

-- Seed the manual review order from the order the queue used to render in
-- (newest first) so nothing appears to shuffle the first time this ships.
with ranked as (
  select id, row_number() over (
    partition by fiscal_year_id order by created_at desc
  ) as rn
  from public.content_review_items
)
update public.content_review_items as items
set priority_rank = ranked.rn
from ranked
where items.id = ranked.id and items.priority_rank is null;

create index if not exists content_review_items_priority_idx
on public.content_review_items (fiscal_year_id, priority_rank);
