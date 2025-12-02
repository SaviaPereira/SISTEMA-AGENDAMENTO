-- migration: add barber_id column to schedules table
-- purpose: link appointments to specific barbers for individual scheduling
-- considerations: barber_id is required to ensure each appointment is assigned to a barber
-- affected tables: schedules
-- relationships: schedules references barbers table

-- step 1: add column as nullable initially (will be made not null later if barbers exist)
alter table public.schedules
  add column if not exists barber_id uuid references public.barbers(id) on delete restrict;

comment on column public.schedules.barber_id is 'Foreign key reference to the barber assigned to this appointment. Required for individual barber scheduling.';

-- step 2: set a default barber for existing records (only if barbers exist)
-- check if there are any barbers before updating
do $$
declare
  first_barber_id uuid;
  schedules_count integer;
begin
  -- get the first barber id if exists
  select id into first_barber_id from public.barbers limit 1;
  
  -- count schedules without barber_id
  select count(*) into schedules_count from public.schedules where barber_id is null;
  
  -- if we have a barber and schedules without barber_id, update them
  if first_barber_id is not null and schedules_count > 0 then
    update public.schedules
    set barber_id = first_barber_id
    where barber_id is null;
    
    raise notice 'Updated % schedule(s) with barber_id: %', schedules_count, first_barber_id;
  elsif first_barber_id is null then
    raise notice 'No barbers found in system. barber_id will remain nullable until barbers are added.';
  else
    raise notice 'All schedules already have barber_id assigned.';
  end if;
end $$;

-- step 3: make the column not null only if we have barbers and all schedules have barber_id
-- this prevents errors if no barbers exist yet
do $$
declare
  barbers_count integer;
  null_barber_count integer;
begin
  -- count barbers
  select count(*) into barbers_count from public.barbers;
  
  -- count schedules without barber_id
  select count(*) into null_barber_count from public.schedules where barber_id is null;
  
  -- only make not null if we have barbers and all schedules have barber_id
  if barbers_count > 0 and null_barber_count = 0 then
    alter table public.schedules
      alter column barber_id set not null;
    
    raise notice 'barber_id column set to NOT NULL.';
  else
    raise notice 'barber_id will remain nullable. Barbers: %, Schedules without barber: %', barbers_count, null_barber_count;
  end if;
end $$;

-- create index for barber_id to improve query performance
create index if not exists schedules_barber_id_idx on public.schedules using btree (barber_id);

-- update unique constraint to include barber_id to prevent duplicate appointments for the same barber
-- first, drop the existing unique index if it exists
drop index if exists public.schedules_unique_appointment_idx;

-- create new unique constraint including barber_id
-- note: this will work even if barber_id is nullable
create unique index schedules_unique_appointment_idx
  on public.schedules (barber_id, data_agendada, hora_agendada)
  where status != 'cancelado' and barber_id is not null;

comment on index schedules_unique_appointment_idx is 'Prevents duplicate appointments for the same barber, date, and time. Cancelled appointments are excluded from this constraint, allowing rescheduling.';

