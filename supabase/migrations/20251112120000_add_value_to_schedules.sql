-- migration: add value column to schedules table
-- purpose: store the payment amount for each appointment
-- considerations: value is optional and can be null for appointments that haven't been paid yet
-- affected tables: schedules

-- add valor column to schedules table
alter table public.schedules
  add column if not exists valor numeric(10, 2) check (valor >= 0);

comment on column public.schedules.valor is 'Payment amount for the appointment service in Brazilian Reais (BRL). Optional field that can be null for unpaid appointments.';

