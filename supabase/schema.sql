create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('client', 'admin_global', 'admin_mosquee', 'livreur');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.statut_paiement as enum ('en_attente', 'paye', 'echoue', 'rembourse');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.statut_livraison as enum ('non_prepare', 'pret', 'remis', 'annule');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.statut_livraison_abattoir as enum ('a_preparer', 'en_route', 'livree');
exception when duplicate_object then null; end $$;

create table if not exists public.mosquees (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ville text not null,
  adresse text not null,
  capacite_stock integer not null default 0 check (capacite_stock >= 0),
  horaires_retrait text,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nom text,
  prenom text,
  telephone text,
  role public.user_role not null default 'client',
  mosquee_id uuid references public.mosquees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  mosquee_id uuid not null references public.mosquees(id) on delete restrict,
  quantite integer not null check (quantite > 0),
  prix_unitaire numeric(10,2) not null default 360.00 check (prix_unitaire = 360.00),
  prix_total numeric(10,2) not null check (prix_total >= 0),
  noms_sacrifice text[] not null default '{}',
  statut_paiement public.statut_paiement not null default 'en_attente',
  statut_livraison public.statut_livraison not null default 'non_prepare',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  code_retrait text unique,
  retrait_valide_at timestamptz,
  retrait_valide_par uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_noms_sacrifice_count check (cardinality(noms_sacrifice) = quantite),
  constraint chk_prix_total check (prix_total = (quantite * prix_unitaire))
);

create table if not exists public.livraisons (
  id uuid primary key default gen_random_uuid(),
  livreur_id uuid not null references public.users(id) on delete restrict,
  mosquee_id uuid not null references public.mosquees(id) on delete restrict,
  quantite_attendue integer not null check (quantite_attendue >= 0),
  quantite_livree integer check (quantite_livree >= 0),
  statut public.statut_livraison_abattoir not null default 'a_preparer',
  heure_depart timestamptz,
  heure_arrivee timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role) values (new.id, new.email, 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.current_user_mosquee_id()
returns uuid language sql stable security definer set search_path = public as $$
  select mosquee_id from public.users where id = auth.uid()
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

drop trigger if exists trg_mosquees_updated_at on public.mosquees;
create trigger trg_mosquees_updated_at before update on public.mosquees for each row execute function public.set_updated_at();
drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at before update on public.reservations for each row execute function public.set_updated_at();
drop trigger if exists trg_livraisons_updated_at on public.livraisons;
create trigger trg_livraisons_updated_at before update on public.livraisons for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.mosquees enable row level security;
alter table public.reservations enable row level security;
alter table public.livraisons enable row level security;
alter table public.stripe_events enable row level security;

create policy users_select_self_or_admin on public.users for select to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin_global');
create policy users_update_self_or_admin on public.users for update to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin_global')
with check (id = auth.uid() or public.current_user_role() = 'admin_global');
create policy users_insert_self_or_admin on public.users for insert to authenticated
with check (id = auth.uid() or public.current_user_role() = 'admin_global');
create policy users_delete_admin_global_only on public.users for delete to authenticated
using (public.current_user_role() = 'admin_global');

create policy mosquees_select_authenticated on public.mosquees for select to authenticated using (true);
create policy mosquees_insert_admin_global on public.mosquees for insert to authenticated with check (public.current_user_role() = 'admin_global');
create policy mosquees_delete_admin_global on public.mosquees for delete to authenticated using (public.current_user_role() = 'admin_global');
create policy mosquees_update_admins on public.mosquees for update to authenticated
using (public.current_user_role() = 'admin_global' or (public.current_user_role() = 'admin_mosquee' and id = public.current_user_mosquee_id()))
with check (public.current_user_role() = 'admin_global' or (public.current_user_role() = 'admin_mosquee' and id = public.current_user_mosquee_id()));

create policy reservations_select_by_role on public.reservations for select to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin_global' or (public.current_user_role() = 'admin_mosquee' and mosquee_id = public.current_user_mosquee_id()));
create policy reservations_insert_client_or_admin on public.reservations for insert to authenticated
with check ((public.current_user_role() = 'client' and user_id = auth.uid()) or public.current_user_role() = 'admin_global');
create policy reservations_update_by_role on public.reservations for update to authenticated
using ((public.current_user_role() = 'client' and user_id = auth.uid()) or public.current_user_role() = 'admin_global' or (public.current_user_role() = 'admin_mosquee' and mosquee_id = public.current_user_mosquee_id()))
with check ((public.current_user_role() = 'client' and user_id = auth.uid()) or public.current_user_role() = 'admin_global' or (public.current_user_role() = 'admin_mosquee' and mosquee_id = public.current_user_mosquee_id()));
create policy reservations_delete_admin_global on public.reservations for delete to authenticated
using (public.current_user_role() = 'admin_global');

create policy livraisons_select_by_role on public.livraisons for select to authenticated
using ((public.current_user_role() = 'livreur' and livreur_id = auth.uid()) or public.current_user_role() = 'admin_global' or (public.current_user_role() = 'admin_mosquee' and mosquee_id = public.current_user_mosquee_id()));
create policy livraisons_insert_admin_global on public.livraisons for insert to authenticated
with check (public.current_user_role() = 'admin_global');
create policy livraisons_update_livreur_or_admin on public.livraisons for update to authenticated
using ((public.current_user_role() = 'livreur' and livreur_id = auth.uid()) or public.current_user_role() = 'admin_global')
with check ((public.current_user_role() = 'livreur' and livreur_id = auth.uid()) or public.current_user_role() = 'admin_global');
create policy livraisons_delete_admin_global on public.livraisons for delete to authenticated
using (public.current_user_role() = 'admin_global');

create policy stripe_events_select_admin_global on public.stripe_events for select to authenticated
using (public.current_user_role() = 'admin_global');
