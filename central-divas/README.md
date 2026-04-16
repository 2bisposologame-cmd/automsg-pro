# 👑 Central Divas 2.0

Plataforma SaaS para grupos de engajamento do Instagram.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL (Neon ou local)
- Conta Cloudinary (para upload de imagens)

### Instalação

```bash
# Clone o repositório
cd central-divas

# Instale as dependências
npm install

# Configure o banco de dados
# Crie um projeto no Neon (https://neon.tech)
# Copie a URL do banco e cole no .env.local

# Execute as migrations do Prisma
npx prisma generate
npx prisma db push

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente (.env.local)

```env
DATABASE_URL="postgresql://user:password@host:5432/central_divas"
JWT_SECRET="sua-chave-secreta-aqui"
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📁 Estrutura do Projeto

```
central-divas/
├── prisma/              # Schema do banco de dados
├── src/
│   ├── app/            # Páginas Next.js (App Router)
│   │   ├── api/        # API Routes
│   │   ├── (admin)/    # Páginas do painel admin
│   │   └── (dashboard)/ # Páginas do painel usuário
│   ├── components/     # Componentes React
│   └── lib/           # Utilitários (Prisma, Auth)
└── public/            # Assets estáticos
```

## 🎯 Funcionalidades

### Usuárias
- ✅ Cadastro/Login com upload de avatar
- ✅ Dashboard com progresso diário
- ✅ Feed do dia com posts para engajar
- ✅ Tarefas diárias (curtir, comentar, seguir)
- ✅ Perfil editável

### Admin
- ✅ Aprovar/reprovar participantes
- ✅ Gerenciar posts do feed
- ✅ Criar tarefas personalizadas
- ✅ Relatórios e estatísticas

### Super Admin
- ✅ Todas as funções de admin
- ✅ Criar outros admins
- ✅ Controle total do sistema

## 🔧 Scripts

```bash
npm run dev          # Iniciar desenvolvimento
npm run build        # Build de produção
npm run db:studio    # Abrir Prisma Studio
```

## 📄 Licença

MIT