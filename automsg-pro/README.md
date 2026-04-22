# AutoMsg Pro

Plataforma de automação de WhatsApp para captação e envio de mensagens em massa.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
# Configure suas variáveis de ambiente
npm run dev
```

## 📋 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|---------|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ |
| `GEMINI_API_KEY` | Chave da Google Gemini API | ✅ |
| `WHATSAPP_PROVIDER` | Provider: `evolution` ou `official` | ✅ |
| `EVOLUTION_BASE_URL` | URL da Evolution API | Se provider=evolution |
| `EVOLUTION_API_KEY` | Chave da Evolution API | Se provider=evolution |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância | Se provider=evolution |

## 📱 Provedores de WhatsApp

### Evolution API (Padrão)

O projeto usa a Evolution API como provider padrão. Configure no `.env.local`:

```env
WHATSAPP_PROVIDER=evolution
EVOLUTION_BASE_URL=http://localhost:8080
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE_NAME=automsg-pro
```

#### Endpoints do Webhook

Configure o webhook da Evolution API para apontar para:

```
https://seu-dominio.com/api/webhooks/evolution
```

Tokens de verificação:
- `EVOLUTION_WEBHOOK_TOKEN` - Token para verification do webhook

#### Mapeamento de Status

| Status Evolution | Status Interno |
|------------------|--------------|
| `sent` | `sent` |
| `delivered` | `delivered` |
| `read` | `read` |
| `error` | `failed` |
| `pending` | `pending` |

### WhatsApp Official API

Suporte para WhatsApp Business API oficial coming soon.

## 🔐 Consentimento (Opt-in/Opt-out)

O sistema processa automaticamente palavras-chave nas mensagens recebidas:

| Palavras-chave | Ação |
|-------------|------|
| `SAIR`, `STOP`, `CANCELAR`, `REMOVER` | Opt-out |
| `SIM`, `YES`, `OK`, `CONFIRMAR` | Opt-in |

## 📊 APIs Disponíveis

| Endpoint | Método | Descrição |
|---------|--------|----------|
| `/api/ai` | POST | Geração de texto com IA |
| `/api/scrape` | POST | Coleta leads do Google Maps |
| `/api/auth` | POST | Autenticação (login/signup/logout) |
| `/api/leads` | GET/POST/DELETE | CRUD de leads |
| `/api/whatsapp/send` | POST | Enviar mensagem |
| `/api/webhooks/evolution` | POST | Webhook para status |
| `/api/webhooks/whatsapp` | POST | Webhook WhatsApp Official |

## 🧪 Testes

```bash
npm run test        # Executar testes
npm run test:coverage  # Com cobertura
```

## 📁 Estrutura do Projeto

```
lib/
├── providers/          # Adapters de providers WhatsApp
│   ├── evolutionProvider.js
│   └── factory.js
├── services/         # Lógica de negócio
│   ├── whatsappService.js
│   ├── consentService.js
│   ├── tenantService.js
│   └── usageService.js
├── repositories/     # Acesso a dados
├── schemas.js       # Validação Zod
├── logger.js      # Logs estruturados
└── errors.js    # Tratamento de erros
```

## 🔒 Segurança

- Rate limit: 30 requisições por minuto por IP
- RLS (Row Level Security) ativo no banco
- Dados sensíveis não vazar em mensagens de erro
- Validação de payload com Zod

## 📄 Licença

MIT