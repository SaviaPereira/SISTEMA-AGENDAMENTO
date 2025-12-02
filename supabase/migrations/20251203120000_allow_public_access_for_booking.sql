-- migration: allow public access for booking page
-- purpose: enable unauthenticated users to access clients, services, business hours and create appointments
-- considerations: adds RLS policies for anon role to support public booking functionality
-- affected tables: clients, services, schedules, business_hours_days, business_hours_slots

-- allow public (anon) users to search clients by whatsapp for booking
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'clients' 
    and policyname = 'allow anon select on clients for booking'
  ) then
    create policy "allow anon select on clients for booking"
      on public.clients
      for select
      to anon
      using ( true );
  end if;
end $$;

-- allow public (anon) users to create new clients during booking
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'clients' 
    and policyname = 'allow anon insert on clients for booking'
  ) then
    create policy "allow anon insert on clients for booking"
      on public.clients
      for insert
      to anon
      with check ( true );
  end if;
end $$;

-- allow public (anon) users to update client info during booking (if found)
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'clients' 
    and policyname = 'allow anon update on clients for booking'
  ) then
    create policy "allow anon update on clients for booking"
      on public.clients
      for update
      to anon
      using ( true )
      with check ( true );
  end if;
end $$;

-- allow public (anon) users to view services list for booking
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'services' 
    and policyname = 'allow anon select on services for booking'
  ) then
    create policy "allow anon select on services for booking"
      on public.services
      for select
      to anon
      using ( true );
  end if;
end $$;

-- allow public (anon) users to view business hours days for booking
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_days' 
    and policyname = 'allow anon select on business_hours_days for booking'
  ) then
    create policy "allow anon select on business_hours_days for booking"
      on public.business_hours_days
      for select
      to anon
      using ( true );
  end if;
end $$;

-- allow public (anon) users to view business hours slots for booking
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'business_hours_slots' 
    and policyname = 'allow anon select on business_hours_slots for booking'
  ) then
    create policy "allow anon select on business_hours_slots for booking"
      on public.business_hours_slots
      for select
      to anon
      using ( true );
  end if;
end $$;

-- allow public (anon) users to view existing schedules (to check availability)
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'schedules' 
    and policyname = 'allow anon select on schedules for booking'
  ) then
    create policy "allow anon select on schedules for booking"
      on public.schedules
      for select
      to anon
      using ( true );
  end if;
end $$;

-- allow public (anon) users to create appointments
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'schedules' 
    and policyname = 'allow anon insert on schedules for booking'
  ) then
    create policy "allow anon insert on schedules for booking"
      on public.schedules
      for insert
      to anon
      with check ( true );
  end if;
end $$;

-- allow public (anon) users to view barbers list (if table exists)
do $$ begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'barbers'
  ) then
    if not exists (
      select 1 from pg_policies 
      where schemaname = 'public' 
      and tablename = 'barbers' 
      and policyname = 'allow anon select on barbers for booking'
    ) then
      create policy "allow anon select on barbers for booking"
        on public.barbers
        for select
        to anon
        using ( true );
    end if;
  end if;
end $$;

