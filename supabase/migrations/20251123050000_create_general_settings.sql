-- migration: create general settings and barbers tables for barbershop system
-- purpose: store general system settings and barber information
-- considerations: enables row level security with permissive policies for authenticated users
-- affected tables: general_settings, barbers
-- relationships: barbers table is independent, general_settings stores single row configuration

-- create general_settings table (single row configuration)
create table if not exists public.general_settings (
  id uuid primary key default gen_random_uuid(),
  require_payment_before_booking boolean not null default false,
  default_service_duration integer not null default 30,
  max_bookings_per_client_per_day integer not null default 3,
  custom_booking_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.general_settings is 'General system settings stored as a single row configuration.';
comment on column public.general_settings.require_payment_before_booking is 'Whether payment is required before booking an appointment.';
comment on column public.general_settings.default_service_duration is 'Default service duration in minutes (used when service does not specify duration).';
comment on column public.general_settings.max_bookings_per_client_per_day is 'Maximum number of bookings a client can make per day.';
comment on column public.general_settings.custom_booking_message is 'Custom message shown to clients after successful booking.';
comment on column public.general_settings.created_at is 'Timestamp when the settings were created (UTC).';
comment on column public.general_settings.updated_at is 'Timestamp when the settings were last updated (UTC).';

-- create barbers table
create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.barbers is 'Barbers available for appointments in the barbershop.';
comment on column public.barbers.name is 'Full name of the barber.';
comment on column public.barbers.phone is 'Phone number of the barber (formatted).';
comment on column public.barbers.address is 'Address of the barber.';
comment on column public.barbers.created_at is 'Timestamp when the barber was created (UTC).';
comment on column public.barbers.updated_at is 'Timestamp when the barber was last updated (UTC).';

-- create indexes for general_settings table
create index if not exists general_settings_id_idx on public.general_settings using btree (id);

-- create indexes for barbers table
create index if not exists barbers_name_idx on public.barbers using btree (name);
create index if not exists barbers_created_at_idx on public.barbers using btree (created_at);

-- enable row level security for general_settings table
alter table public.general_settings enable row level security;

-- create rls policies for general_settings table
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'general_settings' 
    and policyname = 'allow authenticated select on general_settings'
  ) then
    create policy "allow authenticated select on general_settings"
      on public.general_settings
      for select
      to authenticated
      using ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'general_settings' 
    and policyname = 'allow authenticated insert on general_settings'
  ) then
    create policy "allow authenticated insert on general_settings"
      on public.general_settings
      for insert
      to authenticated
      with check ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'general_settings' 
    and policyname = 'allow authenticated update on general_settings'
  ) then
    create policy "allow authenticated update on general_settings"
      on public.general_settings
      for update
      to authenticated
      using ( true )
      with check ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'general_settings' 
    and policyname = 'allow authenticated delete on general_settings'
  ) then
    create policy "allow authenticated delete on general_settings"
      on public.general_settings
      for delete
      to authenticated
      using ( true );
  end if;
end $$;

-- enable row level security for barbers table
alter table public.barbers enable row level security;

-- create rls policies for barbers table
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'barbers' 
    and policyname = 'allow authenticated select on barbers'
  ) then
    create policy "allow authenticated select on barbers"
      on public.barbers
      for select
      to authenticated
      using ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'barbers' 
    and policyname = 'allow authenticated insert on barbers'
  ) then
    create policy "allow authenticated insert on barbers"
      on public.barbers
      for insert
      to authenticated
      with check ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'barbers' 
    and policyname = 'allow authenticated update on barbers'
  ) then
    create policy "allow authenticated update on barbers"
      on public.barbers
      for update
      to authenticated
      using ( true )
      with check ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'barbers' 
    and policyname = 'allow authenticated delete on barbers'
  ) then
    create policy "allow authenticated delete on barbers"
      on public.barbers
      for delete
      to authenticated
      using ( true );
  end if;
end $$;

-- create triggers to automatically update updated_at
do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'update_general_settings_updated_at'
  ) then
    create trigger update_general_settings_updated_at
      before update on public.general_settings
      for each row
      execute function update_updated_at_column();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'update_barbers_updated_at'
  ) then
    create trigger update_barbers_updated_at
      before update on public.barbers
      for each row
      execute function update_updated_at_column();
  end if;
end $$;

