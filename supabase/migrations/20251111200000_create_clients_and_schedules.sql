-- migration: create clients and schedules tables for barbershop appointment system
-- purpose: store client information and appointment records with service relationships
-- considerations: enables row level security with permissive policies for authenticated users
-- affected tables: clients, schedules
-- relationships: schedules references clients and services tables

-- create enum type for appointment status
create type appointment_status as enum ('agendado', 'cancelado', 'pago', 'concluído');

comment on type appointment_status is 'Status options for appointments: agendado (scheduled), cancelado (cancelled), pago (paid), concluído (completed).';

-- create clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  whatsapp text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.clients is 'Client registry with contact information for the barbershop scheduling system.';
comment on column public.clients.name is 'Full name of the client.';
comment on column public.clients.email is 'Email address for client communication (optional).';
comment on column public.clients.whatsapp is 'WhatsApp phone number for client communication (optional).';
comment on column public.clients.created_at is 'Timestamp when the client record was created (UTC).';
comment on column public.clients.updated_at is 'Timestamp when the client record was last updated (UTC).';

-- create indexes for clients table
create index if not exists clients_email_idx on public.clients using btree (email) where email is not null;
create index if not exists clients_whatsapp_idx on public.clients using btree (whatsapp) where whatsapp is not null;
create index if not exists clients_name_idx on public.clients using btree (name);

-- enable row level security for clients table
alter table public.clients enable row level security;

-- create rls policies for clients table
create policy "allow authenticated select on clients"
  on public.clients
  for select
  to authenticated
  using ( true );

create policy "allow authenticated insert on clients"
  on public.clients
  for insert
  to authenticated
  with check ( true );

create policy "allow authenticated update on clients"
  on public.clients
  for update
  to authenticated
  using ( true )
  with check ( true );

create policy "allow authenticated delete on clients"
  on public.clients
  for delete
  to authenticated
  using ( true );

-- create schedules (agendamentos) table
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  data_agendada date not null,
  hora_agendada time not null,
  status appointment_status not null default 'agendado',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.schedules is 'Appointment records linking clients to services with scheduled dates and times.';
comment on column public.schedules.client_id is 'Foreign key reference to the client making the appointment.';
comment on column public.schedules.service_id is 'Foreign key reference to the service being scheduled.';
comment on column public.schedules.data_agendada is 'Date of the scheduled appointment (date only, no time).';
comment on column public.schedules.hora_agendada is 'Time of the scheduled appointment (time only, no date).';
comment on column public.schedules.status is 'Current status of the appointment: agendado, cancelado, pago, or concluído.';
comment on column public.schedules.created_at is 'Timestamp when the appointment was created (UTC).';
comment on column public.schedules.updated_at is 'Timestamp when the appointment was last updated (UTC).';

-- create indexes for schedules table
create index if not exists schedules_client_id_idx on public.schedules using btree (client_id);
create index if not exists schedules_service_id_idx on public.schedules using btree (service_id);
create index if not exists schedules_data_agendada_idx on public.schedules using btree (data_agendada);
create index if not exists schedules_status_idx on public.schedules using btree (status);
create index if not exists schedules_data_hora_idx on public.schedules using btree (data_agendada, hora_agendada);

-- enable row level security for schedules table
alter table public.schedules enable row level security;

-- create rls policies for schedules table
create policy "allow authenticated select on schedules"
  on public.schedules
  for select
  to authenticated
  using ( true );

create policy "allow authenticated insert on schedules"
  on public.schedules
  for insert
  to authenticated
  with check ( true );

create policy "allow authenticated update on schedules"
  on public.schedules
  for update
  to authenticated
  using ( true )
  with check ( true );

create policy "allow authenticated delete on schedules"
  on public.schedules
  for delete
  to authenticated
  using ( true );

