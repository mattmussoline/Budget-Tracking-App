-- Focus Five membership used to be implicit (the top 5 rows by priority_rank).
-- That meant removing a review always pulled the next-ranked one in behind it.
-- This column makes membership explicit so a removed review can leave the
-- Focus Five short of five until someone deliberately adds another.
alter table public.content_review_items
add column if not exists in_focus boolean not null default false;

-- Preserve today's Focus Five (the current top 5 by priority_rank per fiscal
-- year) so this migration doesn't empty everyone's list.
with ranked as (
  select id, row_number() over (partition by fiscal_year_id order by priority_rank asc nulls last, created_at desc) as rank
  from public.content_review_items
)
update public.content_review_items
set in_focus = true
from ranked
where content_review_items.id = ranked.id
and ranked.rank <= 5;
