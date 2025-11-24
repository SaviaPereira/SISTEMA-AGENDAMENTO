-- migration: add duration column to services table
-- purpose: store service duration in minutes to allow per-service time configuration
-- considerations: duration is stored as integer (minutes), nullable to support existing services
-- affected tables: services

-- add duration column to services table
alter table public.services
  add column if not exists duration integer;

comment on column public.services.duration is 'Service duration in minutes. Can be null for existing services that do not have a duration set.';

-- create index for duration column to improve query performance
create index if not exists services_duration_idx on public.services using btree (duration);

