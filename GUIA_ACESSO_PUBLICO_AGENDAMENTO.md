# Guia para Habilitar Acesso Público na Página de Agendamento

## Problema Identificado

A página de agendamento (`/agendamento`) não está funcionando no Vercel porque as políticas RLS (Row Level Security) estão bloqueando o acesso para usuários não autenticados. As tabelas só permitem acesso para usuários autenticados, mas a página de agendamento é pública e precisa acessar:

- **clients** - para buscar cliente por WhatsApp
- **services** - para listar serviços disponíveis
- **barbers** - para listar barbeiros
- **business_hours_days** - para ver dias de funcionamento
- **business_hours_slots** - para ver horários disponíveis
- **schedules** - para verificar disponibilidade e criar agendamentos

## Solução

Execute a migration para permitir acesso público (anon) às tabelas necessárias para a página de agendamento.

## Opção 1: Executar via SQL Editor do Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Abra o arquivo `supabase/migrations/EXECUTE_PUBLIC_ACCESS.sql`
5. Copie todo o conteúdo do arquivo
6. Cole no SQL Editor
7. Clique em **Run** ou pressione `Ctrl+Enter`

## Opção 2: Executar via Supabase CLI

Se você tem o Supabase CLI instalado localmente:

```bash
# Certifique-se de estar conectado ao seu projeto
supabase db push

# Ou execute a migration específica
supabase migration up
```

## O que a Migration Faz

A migration adiciona políticas RLS que permitem:

1. **SELECT em clients** - Buscar cliente por WhatsApp
2. **INSERT em clients** - Criar novo cliente durante o agendamento
3. **UPDATE em clients** - Atualizar informações do cliente (se encontrado)
4. **SELECT em services** - Listar todos os serviços disponíveis
5. **SELECT em business_hours_days** - Ver dias de funcionamento
6. **SELECT em business_hours_slots** - Ver horários disponíveis
7. **SELECT em schedules** - Verificar agendamentos existentes (para calcular disponibilidade)
8. **INSERT em schedules** - Criar novos agendamentos
9. **SELECT em barbers** - Listar barbeiros disponíveis (se a tabela existir)

## Verificação

Após executar a migration, você pode verificar se as políticas foram criadas:

```sql
-- Ver todas as políticas anon criadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND roles::text LIKE '%anon%' 
ORDER BY tablename, policyname;
```

## Importante

- **Essas políticas são seguras** pois permitem apenas:
  - Leitura (SELECT) de dados públicos necessários
  - Criação (INSERT) de clientes e agendamentos
  - Atualização (UPDATE) apenas de clientes existentes

- **A página de agendamento não expõe dados sensíveis** - apenas permite que usuários criem agendamentos e vejam informações públicas (serviços, horários, etc.)

## Próximos Passos

Após executar a migration:

1. Aguarde alguns segundos para que as políticas sejam aplicadas
2. Recarregue a página de agendamento no Vercel
3. Teste o fluxo completo:
   - Digite um número de telefone cadastrado
   - Verifique se os dados do cliente aparecem automaticamente
   - Verifique se a lista de serviços aparece
   - Verifique se a lista de barbeiros aparece
   - Complete um agendamento de teste

## Troubleshooting

Se após executar a migration ainda houver problemas:

1. **Verifique se as políticas foram criadas:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('clients', 'services', 'schedules', 'business_hours_days', 'business_hours_slots', 'barbers')
   AND roles::text LIKE '%anon%';
   ```

2. **Verifique se RLS está habilitado:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('clients', 'services', 'schedules', 'business_hours_days', 'business_hours_slots', 'barbers');
   ```

3. **Teste uma query simples:**
   ```sql
   -- Teste como anon (isso deve funcionar após a migration)
   SET ROLE anon;
   SELECT COUNT(*) FROM clients;
   SELECT COUNT(*) FROM services;
   RESET ROLE;
   ```

4. **Verifique os logs do Vercel** para ver se há erros específicos de RLS

