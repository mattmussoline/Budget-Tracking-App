alter table public.roadmap_items
add column if not exists format text,
add column if not exists clickup_task_id text,
add column if not exists clickup_task_url text,
add column if not exists clickup_synced_at timestamptz;

create index if not exists roadmap_items_clickup_task_id_idx
on public.roadmap_items(clickup_task_id)
where clickup_task_id is not null;
