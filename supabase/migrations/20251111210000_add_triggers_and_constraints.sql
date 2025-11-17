-- migration: add automatic updated_at triggers and unique constraint for schedules
-- purpose: ensure updated_at is automatically maintained and prevent duplicate appointments
-- considerations: triggers will fire on update operations, constraint prevents scheduling conflicts
-- affected tables: clients, schedules, services

-- create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

comment on function public.handle_updated_at() is 'Trigger function that automatically updates the updated_at column to the current UTC timestamp when a row is updated.';

-- create trigger for clients table
create trigger clients_updated_at_trigger
  before update on public.clients
  for each row
  execute function public.handle_updated_at();

comment on trigger clients_updated_at_trigger on public.clients is 'Automatically updates updated_at column when a client record is modified.';

-- create trigger for schedules table
create trigger schedules_updated_at_trigger
  before update on public.schedules
  for each row
  execute function public.handle_updated_at();

comment on trigger schedules_updated_at_trigger on public.schedules is 'Automatically updates updated_at column when a schedule record is modified.';

-- create trigger for services table (if not exists)
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'services_updated_at_trigger'
  ) then
    create trigger services_updated_at_trigger
      before update on public.services
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;

comment on trigger services_updated_at_trigger on public.services is 'Automatically updates updated_at column when a service record is modified.';

-- create unique constraint to prevent duplicate appointments
-- allows only one active appointment per service, date, and time
-- excludes cancelled appointments from the constraint
create unique index schedules_unique_appointment_idx
  on public.schedules (service_id, data_agendada, hora_agendada)
  where status != 'cancelado';

comment on index schedules_unique_appointment_idx is 'Prevents duplicate appointments for the same service, date, and time. Cancelled appointments are excluded from this constraint, allowing rescheduling.';

