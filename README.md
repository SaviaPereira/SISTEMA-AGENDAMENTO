# Sistema de Agendamento - Barbearia Gamboa

Sistema completo de gerenciamento de agendamentos desenvolvido para a Barbearia Gamboa, oferecendo uma solução moderna e eficiente para administração de serviços, clientes e agendamentos.

## 📋 Visão Geral

Sistema web completo desenvolvido com foco em usabilidade, performance e experiência do usuário. Oferece um painel administrativo completo para gerenciar serviços, clientes, agendamentos e configurações do negócio.

## 🛠️ Stack Tecnológica

### Front-end

- **Next.js 15.5.4** - Framework React com App Router e Server Components
- **React 19.1.0** - Biblioteca UI com hooks modernos e Server Components
- **TypeScript 5** - Tipagem estática para maior segurança e produtividade
- **Tailwind CSS 4** - Framework CSS utilitário para estilização moderna
- **Radix UI** - Componentes acessíveis e headless
- **Lucide React** - Biblioteca de ícones moderna e consistente
- **Class Variance Authority** - Gerenciamento de variantes de componentes
- **Turbopack** - Bundler de alta performance para desenvolvimento rápido

### Backend & Banco de Dados

- **Supabase** - Backend-as-a-Service (BaaS) completo
  - **PostgreSQL** - Banco de dados relacional
  - **Row Level Security (RLS)** - Segurança em nível de linha
  - **Supabase Auth** - Sistema de autenticação integrado
  - **Supabase SSR** - Suporte a Server-Side Rendering
  - **Supabase CLI** - Ferramentas de desenvolvimento e migrações
  - **@supabase/supabase-js** (v2.77.0) - Cliente JavaScript/TypeScript
  - **@supabase/ssr** (v0.7.0) - Biblioteca para integração com Next.js

### Infraestrutura & Deploy

- **Vercel** - Plataforma de deploy e hospedagem
- **GitHub** - Controle de versão e repositório
- **Supabase Cloud** - Hospedagem do banco de dados

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (ou instalação local do Supabase CLI)
- Variáveis de ambiente configuradas

### Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd sistema-agendamento
```

2. **Instale as dependências:**
```bash
npm install
# ou
pnpm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua-chave-anon
```

4. **Execute as migrações do banco de dados:**
```bash
supabase db push
```

5. **Execute o projeto em desenvolvimento:**
```bash
npm run dev
# ou
pnpm run dev
```

6. **Acesse no navegador:**
```
http://localhost:3000
```

## 📦 Funcionalidades

### 1. Autenticação e Segurança
- ✅ Sistema de login com Supabase Auth
- ✅ Recuperação de senha
- ✅ Middleware de autenticação para rotas protegidas
- ✅ Row Level Security (RLS) no banco de dados
- ✅ Validação de sessão em todas as rotas administrativas

### 2. Dashboard Administrativo
- ✅ Estatísticas em tempo real
  - Agendamentos de hoje (contagem e lista)
  - Agendamentos totais no período selecionado (7, 15 ou 30 dias)
  - Receita calculada (soma de valores com status "concluído" ou "pago")
- ✅ Filtro de período (7, 15 ou 30 dias)
- ✅ Tabela de agendamentos de hoje com detalhes completos
- ✅ Integração completa com dados reais do Supabase

### 3. Gerenciamento de Serviços
- ✅ CRUD completo de serviços
- ✅ Campo de duração configurável (15min a 2h, intervalos de 15min)
- ✅ Integração com duração padrão das configurações gerais
- ✅ Formatação automática de preços (R$)
- ✅ Validação de dados e tratamento de erros
- ✅ Prevenção de exclusão quando há agendamentos associados

### 4. Gerenciamento de Agendamentos
- ✅ CRUD completo de agendamentos
- ✅ Sistema de filtros avançado:
  - Busca por nome do cliente
  - Filtro por serviço
  - Filtro por status (agendado, cancelado, pago, concluído)
  - Filtro por período (Hoje, Esta semana, Este mês, Todos)
  - Filtro por data inicial e final
- ✅ Criação rápida de cliente durante o agendamento
- ✅ Formatação de datas e horários
- ✅ Validação de conflitos de horário
- ✅ Status de agendamento com cores diferenciadas

### 5. Gerenciamento de Clientes
- ✅ CRUD completo de clientes
- ✅ Campo de busca/filtro em tempo real:
  - Busca por nome, email ou WhatsApp
  - Filtragem instantânea conforme digitação
- ✅ Formatação automática de telefone/WhatsApp (XX) XXXXX-XXXX
- ✅ Validação de dados de contato
- ✅ Prevenção de exclusão quando há agendamentos associados

### 6. Configurações do Sistema

#### Horários de Atendimento
- ✅ Configuração semanal de horários
- ✅ Toggle para ativar/desativar dias da semana
- ✅ Múltiplos intervalos de atendimento por dia
- ✅ Validação de horários (início < fim)
- ✅ Persistência no banco de dados

#### Configurações Gerais
- ✅ **Pagamento Antecipado**: Toggle para exigir pagamento antes do agendamento
- ✅ **Duração Padrão dos Serviços**: Select de 15min a 2h (intervalos de 15min)
- ✅ **Limite de Agendamentos por Cliente**: Input numérico (padrão: 3 por dia)
- ✅ **Mensagem Personalizada**: Textarea para mensagem de confirmação
- ✅ **Controle de Barbeiros**: CRUD completo com nome, telefone e endereço
- ✅ Persistência de todas as configurações no banco de dados

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

1. **clients** (Clientes)
   - id, name, email, whatsapp, created_at, updated_at

2. **services** (Serviços)
   - id, name, price, duration, created_at, updated_at

3. **schedules** (Agendamentos)
   - id, client_id, service_id, data_agendada, hora_agendada, status, valor, created_at, updated_at

4. **business_hours_days** (Dias de Atendimento)
   - id, day_of_week, enabled, created_at, updated_at

5. **business_hours_slots** (Horários de Atendimento)
   - id, day_id, start_time, end_time, created_at, updated_at

6. **general_settings** (Configurações Gerais)
   - id, require_payment_before_booking, default_service_duration, max_bookings_per_client_per_day, custom_booking_message, created_at, updated_at

7. **barbers** (Barbeiros)
   - id, name, phone, address, created_at, updated_at

### Segurança
- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Políticas de acesso para usuários autenticados
- ✅ Validação de constraints no banco de dados
- ✅ Triggers para atualização automática de timestamps

## 📁 Estrutura do Projeto

```
sistema-agendamento/
├── app/                    # App Router do Next.js
│   ├── auth/               # Rotas de autenticação
│   ├── dashboard/          # Dashboard administrativo
│   ├── services/           # Gerenciamento de serviços
│   ├── schedules/          # Gerenciamento de agendamentos
│   ├── clients/            # Gerenciamento de clientes
│   └── config/              # Configurações do sistema
├── components/             # Componentes React
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── dashboard/          # Componentes do dashboard
│   ├── services/           # Componentes de serviços
│   ├── schedules/          # Componentes de agendamentos
│   ├── clients/            # Componentes de clientes
│   └── config/             # Componentes de configurações
├── lib/                    # Utilitários e configurações
│   ├── client.ts           # Cliente Supabase (client-side)
│   ├── server.ts           # Cliente Supabase (server-side)
│   └── utils.ts            # Funções utilitárias
├── supabase/
│   └── migrations/         # Migrações do banco de dados
└── public/                 # Arquivos estáticos
```

## 💻 Comunicação com o Supabase

A comunicação com o Supabase é realizada **100% em TypeScript/JavaScript**, utilizando as bibliotecas oficiais:

- **Client-Side**: `createBrowserClient()` do `@supabase/ssr` para componentes React no navegador
- **Server-Side**: `createServerClient()` do `@supabase/ssr` para Server Components do Next.js
- **Queries**: Utilização direta da API do Supabase com métodos como `.from()`, `.select()`, `.insert()`, `.update()`, `.delete()`
- **Migrações**: SQL puro (PostgreSQL) executadas via Supabase CLI

**Exemplo de uso:**
```typescript
const supabase = createClient();
const { data, error } = await supabase
  .from('services')
  .select('*')
  .order('created_at', { ascending: false });
```

## 🎨 Design System

### Cores
- **Primária**: #D4AF37 (Dourado) - Elementos principais e destaques
- **Secundária**: #1A1A1A (Preto escuro) - Fundos e elementos secundários
- **Acento**: #F4E4BC (Dourado claro) - Elementos de destaque
- **Fundo**: #0A0A0A (Preto) - Fundo principal
- **Texto**: #FAFAFA (Branco suave) - Texto principal

### Tipografia
- **Fonte Principal**: Geist Sans - Moderna e limpa
- **Fonte Mono**: Geist Mono - Para código e elementos técnicos

## 🚀 Funcionalidades Técnicas

### Performance
- ✅ Server Components do Next.js para renderização otimizada
- ✅ Client Components apenas quando necessário
- ✅ Lazy loading de componentes
- ✅ Otimização de queries com índices no banco de dados
- ✅ Memoização de cálculos pesados (useMemo)
- ✅ Turbopack para builds rápidos

### UX/UI
- ✅ Design responsivo (mobile-first)
- ✅ Feedback visual com toasts
- ✅ Loading states em todas as operações
- ✅ Tratamento de erros amigável
- ✅ Validação em tempo real de formulários
- ✅ Navegação intuitiva com sidebar
- ✅ Modais acessíveis e responsivos

### Acessibilidade
- ✅ Componentes Radix UI (acessíveis por padrão)
- ✅ Navegação por teclado
- ✅ ARIA labels apropriados
- ✅ Contraste adequado de cores
- ✅ Suporte a screen readers

## 📊 Métricas do Projeto

- **Tabelas no Banco**: 7 tabelas principais
- **Componentes React**: 20+ componentes reutilizáveis
- **Rotas Protegidas**: 6 rotas administrativas
- **Funcionalidades CRUD**: 4 módulos completos (Serviços, Agendamentos, Clientes, Barbeiros)
- **Sistema de Filtros**: 5 tipos de filtros diferentes
- **Configurações**: 5 tipos de configurações globais

## 🚀 Deploy

### Vercel

O projeto está configurado para deploy automático na Vercel:

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
3. O deploy será feito automaticamente a cada push na branch principal

### Build Local

Para fazer build local:

```bash
npm run build
npm start
```

## 🔮 Roadmap

- [ ] Integração com pagamentos online

## 🎯 Diferenciais

1. **Arquitetura Moderna**: Uso de Server Components e Client Components de forma estratégica
2. **Type Safety**: TypeScript em todo o projeto para maior confiabilidade
3. **Segurança Robusta**: RLS no banco + validação em múltiplas camadas
4. **Performance**: Otimizações em queries, memoização e lazy loading
5. **UX Excepcional**: Feedback visual, validações em tempo real, design intuitivo
6. **Escalabilidade**: Estrutura preparada para crescimento e novas funcionalidades

## 📖 Regras de Desenvolvimento

O projeto inclui regras específicas em `.cursor/rules/`:
- `frontend-guidelines.mdc` - Diretrizes gerais de front-end
- `barbershop-design.mdc` - Guia específico de design da barbearia
- `create-migration.mdc` - Guidelines para escrever migrações Postgres
- `create-rls-policies.mdc` - Guidelines para escrever políticas RLS
- `create-db-functions.mdc` - Guidelines para escrever funções do banco
- `postgres-sql-style-guide.mdc` - Guia de estilo SQL
- `use-realtime.mdc` - Regras para Supabase Realtime
- `writing-supabase-edge-functions.mdc` - Regras para Edge Functions

## 📝 Licença

Este projeto é privado e desenvolvido especificamente para a Barbearia Gamboa.

---

**Desenvolvido com ❤️ usando Next.js, React, TypeScript e Supabase**
