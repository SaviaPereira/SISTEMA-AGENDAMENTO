-- ============================================
-- SCRIPT PARA EXECUTAR DIRETAMENTE NO SUPABASE SQL EDITOR
-- ============================================
-- Este script permite acesso público (não autenticado) às tabelas
-- necessárias para a página de agendamento funcionar corretamente
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

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

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Execute estas queries para verificar se as políticas foram criadas:

-- Verificar políticas criadas para clients:
-- SELECT policyname, cmd, roles 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'clients' AND roles::text LIKE '%anon%';

-- Verificar políticas criadas para services:
-- SELECT policyname, cmd, roles 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'services' AND roles::text LIKE '%anon%';

-- Verificar políticas criadas para schedules:
-- SELECT policyname, cmd, roles 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'schedules' AND roles::text LIKE '%anon%';

-- Verificar todas as políticas anon criadas:
-- SELECT tablename, policyname, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND roles::text LIKE '%anon%' 
-- ORDER BY tablename, policyname;

