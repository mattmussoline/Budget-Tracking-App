create table if not exists public.app_access_invites (
  email text primary key,
  invited_by_email text not null,
  created_at timestamptz not null default now(),
  constraint app_access_invites_lowercase_email check (email = lower(email)),
  constraint app_access_invites_allowed_domain check (
    email like '%@augustineinstitute.org'
    or email like '%@augustine.edu'
  )
);

insert into public.app_access_invites (email, invited_by_email)
values ('matt.mussoline@augustineinstitute.org', 'matt.mussoline@augustineinstitute.org')
on conflict (email) do nothing;

alter table public.app_access_invites enable row level security;
