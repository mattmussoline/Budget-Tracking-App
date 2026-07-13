alter table public.content_review_items
drop constraint if exists content_review_items_review_status_check;

alter table public.content_review_items
add constraint content_review_items_review_status_check
check (review_status in ('not_started', 'on_the_radar', 'in_progress', 'blocked', 'rejected', 'approved'));
