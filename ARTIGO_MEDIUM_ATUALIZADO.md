# Sistema de Agendamento - Barbearia Gamboa

## 📋 Visão Geral do Projeto

Sistema completo de gerenciamento de agendamentos desenvolvido para a Barbearia Gamboa, oferecendo uma solução moderna e eficiente para administração de serviços, clientes e agendamentos. O sistema foi desenvolvido com foco em usabilidade, performance e experiência do usuário.

## 🛠️ Stack Tecnológica

### Front-end

- **Next.js 15.5.4** - Framework React com App Router e Server Components
- **React 19.1.0** - Biblioteca UI com hooks modernos e Server Components
- **TypeScript 5** - Tipagem estática para maior segurança e produtividade
- **Tailwind CSS 4** - Framework CSS utilitário para estilização moderna
- **Radix UI** - Componentes acessíveis e headless (@radix-ui/react-label, @radix-ui/react-slot)
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
  - **@supabase/supabase-js** (v2.77.0) - Cliente JavaScript/TypeScript para comunicação com o Supabase
  - **@supabase/ssr** (v0.7.0) - Biblioteca para integração com Next.js Server Components

### Infraestrutura & Deploy

- **Vercel** - Plataforma de deploy e hospedagem
- **GitHub** - Controle de versão e repositório
- **Supabase Cloud** - Hospedagem do banco de dados

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

## 📦 Funcionalidades Implementadas

### 1. Autenticação e Segurança
- ✅ Sistema de login com Supabase Auth
- ✅ Recuperação de senha
- ✅ Middleware de autenticação para rotas protegidas
- ✅ Row Level Security (RLS) no banco de dados
- ✅ Validação de sessão em todas as rotas administrativas

### 2. Dashboard Administrativo
- ✅ **Estatísticas em Tempo Real**:
  - Agendamentos de hoje (contagem e lista)
  - Agendamentos totais no período selecionado (7, 15 ou 30 dias)
  - Receita calculada (soma de valores com status "concluído" ou "pago")
- ✅ **Filtro de Período**: Select com opções de 7, 15 e 30 dias
- ✅ **Tabela de Agendamentos de Hoje**: Lista completa com cliente, horário e serviço
- ✅ Integração completa com dados reais do Supabase
- ✅ Atualização automática de dados

### 3. Gerenciamento de Serviços
- ✅ CRUD completo de serviços
- ✅ Campo de duração configurável (15min a 2h, intervalos de 15min)
- ✅ Integração com duração padrão das configurações gerais
- ✅ Formatação automática de preços (R$)
- ✅ Validação de dados e tratamento de erros
- ✅ Prevenção de exclusão quando há agendamentos associados

### 4. Gerenciamento de Agendamentos
- ✅ CRUD completo de agendamentos
- ✅ **Sistema de Filtros Avançado**:
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
- ✅ **Campo de Busca/Filtro**:
  - Busca em tempo real por nome, email ou WhatsApp
  - Filtragem instantânea conforme digitação
- ✅ Formatação automática de telefone/WhatsApp (XX) XXXXX-XXXX
- ✅ Validação de dados de contato
- ✅ Prevenção de exclusão quando há agendamentos associados

### 6. Configurações do Sistema

#### 6.1 Horários de Atendimento
- ✅ Configuração semanal de horários
- ✅ Toggle para ativar/desativar dias da semana
- ✅ Múltiplos intervalos de atendimento por dia
- ✅ Validação de horários (início < fim)
- ✅ Persistência no banco de dados

#### 6.2 Configurações Gerais
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

## 📁 Estrutura do Projeto

```
sistema-agendamento/
├── app/                    # App Router do Next.js
│   ├── auth/               # Rotas de autenticação
│   ├── dashboard/          # Dashboard administrativo
│   ├── services/           # Gerenciamento de serviços
│   ├── schedules/          # Gerenciamento de agendamentos
│   ├── clients/            # Gerenciamento de clientes
│   └── config/             # Configurações do sistema
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

## 🔄 Fluxo de Dados

1. **Autenticação**: Usuário faz login → Supabase Auth valida → Middleware verifica sessão
2. **Dashboard**: Server Component busca dados → Client Component renderiza → Atualizações em tempo real
3. **CRUD Operations**: Formulário → Validação → Supabase (via TypeScript/JavaScript) → Atualização de estado → Feedback ao usuário
4. **Filtros**: Input do usuário → Filtragem local (useMemo) → Renderização otimizada

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

## 🎯 Diferenciais do Projeto

1. **Arquitetura Moderna**: Uso de Server Components e Client Components de forma estratégica
2. **Type Safety**: TypeScript em todo o projeto para maior confiabilidade
3. **Segurança Robusta**: RLS no banco + validação em múltiplas camadas
4. **Performance**: Otimizações em queries, memoização e lazy loading
5. **UX Excepcional**: Feedback visual, validações em tempo real, design intuitivo
6. **Escalabilidade**: Estrutura preparada para crescimento e novas funcionalidades

## 📊 Métricas e Estatísticas

- **Tabelas no Banco**: 7 tabelas principais
- **Componentes React**: 20+ componentes reutilizáveis
- **Rotas Protegidas**: 6 rotas administrativas
- **Funcionalidades CRUD**: 4 módulos completos (Serviços, Agendamentos, Clientes, Barbeiros)
- **Sistema de Filtros**: 5 tipos de filtros diferentes
- **Configurações**: 5 tipos de configurações globais

## 🚀 Deploy e Produção

- **Plataforma**: Vercel (deploy automático via GitHub)
- **Banco de Dados**: Supabase Cloud (PostgreSQL gerenciado)
- **CI/CD**: Integração contínua com GitHub
- **Monitoramento**: Logs do Vercel e Supabase

## 🔮 Próximas Funcionalidades (Roadmap)

- [ ] Notificações por WhatsApp
- [ ] Relatórios e gráficos avançados
- [ ] Exportação de dados (PDF/Excel)
- [ ] Sistema de avaliações
- [ ] App mobile (React Native)
- [ ] Integração com pagamentos online

## 📝 Conclusão

O Sistema de Agendamento da Barbearia Gamboa representa uma solução completa e moderna para gerenciamento de agendamentos, desenvolvida com as melhores práticas de desenvolvimento web. A combinação de tecnologias modernas (Next.js 15, React 19, Supabase) resulta em uma aplicação performática, segura e escalável, pronta para atender as necessidades de uma barbearia moderna.

---

**Desenvolvido com ❤️ usando Next.js, React, TypeScript e Supabase**

