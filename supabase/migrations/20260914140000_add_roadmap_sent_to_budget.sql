alter table public.roadmap_items
add column if not exists sent_to_budget_at timestamptz;
