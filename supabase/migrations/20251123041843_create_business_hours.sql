-- migration: create business hours tables for barbershop scheduling system
-- purpose: store weekly business hours configuration with multiple time slots per day
-- considerations: enables row level security with permissive policies for authenticated users
-- affected tables: business_hours_days, business_hours_slots
-- relationships: business_hours_slots references business_hours_days table

-- create enum type for days of week (only if it doesn't exist)
do $$ begin
  create type day_of_week as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
exception
  when duplicate_object then null;
end $$;

comment on type day_of_week is 'Days of the week for business hours configuration.';

-- create business_hours_days table
create table if not exists public.business_hours_days (
  id uuid primary key default gen_random_uuid(),
  day_of_week day_of_week not null unique,
  enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.business_hours_days is 'Configuration for each day of the week indicating if the business is open.';
comment on column public.business_hours_days.day_of_week is 'Day of the week (monday through sunday).';
comment on column public.business_hours_days.enabled is 'Whether the business is open on this day.';
comment on column public.business_hours_days.created_at is 'Timestamp when the day configuration was created (UTC).';
comment on column public.business_hours_days.updated_at is 'Timestamp when the day configuration was last updated (UTC).';

-- create business_hours_slots table
create table if not exists public.business_hours_slots (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.business_hours_days(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint valid_time_range check (end_time > start_time)
);

comment on table public.business_hours_slots is 'Time slots for each day when the business is open.';
comment on column public.business_hours_slots.day_id is 'Foreign key reference to the business_hours_days table.';
comment on column public.business_hours_slots.start_time is 'Start time of the business hours slot (time only, no date).';
comment on column public.business_hours_slots.end_time is 'End time of the business hours slot (time only, no date).';
comment on column public.business_hours_slots.created_at is 'Timestamp when the time slot was created (UTC).';
comment on column public.business_hours_slots.updated_at is 'Timestamp when the time slot was last updated (UTC).';

-- create indexes for business_hours_days table
create index if not exists business_hours_days_day_of_week_idx on public.business_hours_days using btree (day_of_week);
create index if not exists business_hours_days_enabled_idx on public.business_hours_days using btree (enabled);

-- create indexes for business_hours_slots table
create index if not exists business_hours_slots_day_id_idx on public.business_hours_slots using btree (day_id);
create index if not exists business_hours_slots_time_idx on public.business_hours_slots using btree (start_time, end_time);

-- enable row level security for business_hours_days table
alter table public.business_hours_days enable row level security;

-- create rls policies for business_hours_days table
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_days' 
    and policyname = 'allow authenticated select on business_hours_days'
  ) then
    create policy "allow authenticated select on business_hours_days"
      on public.business_hours_days
      for select
      to authenticated
      using ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_days' 
    and policyname = 'allow authenticated insert on business_hours_days'
  ) then
    create policy "allow authenticated insert on business_hours_days"
      on public.business_hours_days
      for insert
      to authenticated
      with check ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_days' 
    and policyname = 'allow authenticated update on business_hours_days'
  ) then
    create policy "allow authenticated update on business_hours_days"
      on public.business_hours_days
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
    and tablename = 'business_hours_days' 
    and policyname = 'allow authenticated delete on business_hours_days'
  ) then
    create policy "allow authenticated delete on business_hours_days"
      on public.business_hours_days
      for delete
      to authenticated
      using ( true );
  end if;
end $$;

-- enable row level security for business_hours_slots table
alter table public.business_hours_slots enable row level security;

-- create rls policies for business_hours_slots table
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_slots' 
    and policyname = 'allow authenticated select on business_hours_slots'
  ) then
    create policy "allow authenticated select on business_hours_slots"
      on public.business_hours_slots
      for select
      to authenticated
      using ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_slots' 
    and policyname = 'allow authenticated insert on business_hours_slots'
  ) then
    create policy "allow authenticated insert on business_hours_slots"
      on public.business_hours_slots
      for insert
      to authenticated
      with check ( true );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_slots' 
    and policyname = 'allow authenticated update on business_hours_slots'
  ) then
    create policy "allow authenticated update on business_hours_slots"
      on public.business_hours_slots
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
    and tablename = 'business_hours_slots' 
    and policyname = 'allow authenticated delete on business_hours_slots'
  ) then
    create policy "allow authenticated delete on business_hours_slots"
      on public.business_hours_slots
      for delete
      to authenticated
      using ( true );
  end if;
end $$;

-- create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- create triggers to automatically update updated_at
do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'update_business_hours_days_updated_at'
  ) then
    create trigger update_business_hours_days_updated_at
      before update on public.business_hours_days
      for each row
      execute function update_updated_at_column();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'update_business_hours_slots_updated_at'
  ) then
    create trigger update_business_hours_slots_updated_at
      before update on public.business_hours_slots
      for each row
      execute function update_updated_at_column();
  end if;
end $$;

