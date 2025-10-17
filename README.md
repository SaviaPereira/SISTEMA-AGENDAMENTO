# Sistema de Agendamento - Barbearia Gamboa

Landing page moderna para barbearia com design em tons dourados e escuros.

## 🎨 Design

- **Layout**: Split-screen responsivo (2/5 conteúdo + 3/5 visual)
- **Cores**: Tema dourado (#D4AF37) e preto (#0A0A0A)
- **Tipografia**: Geist Sans (moderna e limpa)
- **Estilo**: Premium e profissional

## 🛠️ Stack Tecnológica

- **Next.js 15.5.4** - Framework React com App Router
- **React 19.1.0** - Biblioteca UI com hooks modernos
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS 4** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Biblioteca de ícones

## 🚀 Como Executar

1. **Instalar dependências:**
```bash
pnpm install
```

2. **Executar em desenvolvimento:**
```bash
pnpm run dev
```

3. **Abrir no navegador:**
```
http://localhost:3000
```

## 📱 Funcionalidades

### Landing Page
- ✅ Header minimalista (logo + redes sociais)
- ✅ Hero section com headline impactante
- ✅ Botões de call-to-action
- ✅ Cards flutuantes (pacote mensal + avaliação)
- ✅ Design responsivo mobile-first
- ✅ Tema escuro com acentos dourados


### Redes Sociais
- ✅ Ícones dourados (Facebook, Instagram, TikTok)
- ✅ Hover effects suaves
- ✅ Posicionamento no header

## 🎯 Próximos Passos

- [ ] Sistema de agendamento
- [ ] Páginas de serviços
- [ ] Galeria de fotos
- [ ] Integração com calendário
- [ ] Formulário de contato
- [ ] Sistema de avaliações

## 📁 Estrutura atual do Projeto

```
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
│   └── ui/               # Componentes base (shadcn/ui)
├── lib/                  # Utilitários
├── public/               # Arquivos estáticos
│   └── logo-barbearia.svg # Logo personalizado
└── .cursor/rules/        # Regras de desenvolvimento
```

## 🎨 Paleta de Cores

```css
--primary: #D4AF37;      /* Dourado principal */
--secondary: #1A1A1A;    /* Preto/escuro */
--accent: #F4E4BC;       /* Dourado claro */
--background: #0A0A0A;   /* Fundo escuro */
--foreground: #FAFAFA;   /* Texto claro */
```

## 📖 Regras de Desenvolvimento

O projeto inclui regras específicas em `.cursor/rules/`:
- `frontend-guidelines.mdc` - Diretrizes gerais de front-end
- `barbershop-design.mdc` - Guia específico de design da barbearia

## 🚀 Deploy

Para fazer deploy na Vercel:

```bash
pnpm run build
```

O projeto está configurado para deploy automático na Vercel com otimizações de produção.
