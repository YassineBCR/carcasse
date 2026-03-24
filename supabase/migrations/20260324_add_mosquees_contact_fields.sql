alter table public.mosquees
  add column if not exists telephone text,
  add column if not exists code_postal text,
  add column if not exists admin_email text;
