-- migration: create services table for barbershop scheduling system
-- purpose: store catalog of services offered, including pricing metadata and timestamps
-- considerations: enables row level security with permissive policies for authenticated users

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.services is 'Catalog of services offered by the barbershop, including pricing information.';
comment on column public.services.name is 'Display name of the service offered.';
comment on column public.services.price is 'Service price stored in BRL as a numeric value with two decimals.';
comment on column public.services.created_at is 'Timestamp when the service row was created (UTC).';
comment on column public.services.updated_at is 'Timestamp when the service row was last updated (UTC).';

create index if not exists services_name_idx on public.services using btree (name);

alter table public.services enable row level security;

create policy "allow authenticated select on services"
  on public.services
  for select
  to authenticated
  using ( true );

create policy "allow authenticated insert on services"
  on public.services
  for insert
  to authenticated
  with check ( true );

create policy "allow authenticated update on services"
  on public.services
  for update
  to authenticated
  using ( true )
  with check ( true );

create policy "allow authenticated delete on services"
  on public.services
  for delete
  to authenticated
  using ( true );

