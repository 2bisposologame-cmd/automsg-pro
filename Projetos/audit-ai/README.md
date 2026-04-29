# Audit.AI - Análise de Conformidade LGPD

Plataforma web inteligente para análise automática de contratos e políticas de privacidade com foco na Lei Geral de Proteção de Dados (LGPD).

## Sobre o Projeto

O Audit.AI utiliza inteligência artificial do Google Gemini para analisar textos de contratos e documentos de privacidade, identificando riscos de conformidade com a LGPD e fornecendo sugestões práticas de melhoria.

### Funcionalidades

- **Análise de Texto**: Colagem direta de texto para análise imediata
- **Upload de PDF**: Suporte para envio de arquivos PDF (em desenvolvimento)
- **Score de Conformidade**: Pontuação de 0 a 100 baseada na conformidade LGPD
- **Identificação de Riscos**: Lista detalhada de pontos críticos encontrados
- **Sugestões de Melhoria**: Recomendações práticas para adequação à LGPD

## Tecnologias Utilizadas

- **Next.js 16.2.4** - Framework React com App Router
- **React 19.2.4** - Biblioteca para interface
- **TypeScript** - Tipagem estática
- **Google Generative AI (Gemini)** - Modelo `gemini-2.5-flash` para análise
- **pdf-parse 2.4.5** - Processamento de arquivos PDF
- **Tailwind CSS 4** - Estilização
- **ESLint** - Linting de código

## Pré-requisitos

- Node.js 20.16.0 ou superior
- Chave de API do Google Gemini (obtida em [Google AI Studio](https://aistudio.google.com/apikey))

## Instalação

1. Clone o repositório ou acesse o diretório do projeto:
```bash
cd D:\Projetos\audit-ai
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a variável de ambiente criando um arquivo `.env.local` na raiz do projeto:
```
GEMINI_API_KEY=sua_chave_api_aqui
```

## Execução

### Ambiente de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### Build para Produção
```bash
npm run build
npm run start
```

## Estrutura do Projeto

```
audit-ai/
├── app/
│   ├── api/
│   │   └── audit/
│   │       └── route.ts         # Endpoint da API (análise com Gemini)
│   ├── layout.tsx               # Layout principal
│   ├── page.tsx                 # Página inicial (interface do usuário)
│   └── globals.css              # Estilos globais
├── public/                      # Arquivos estáticos
├── .env.local                   # Variáveis de ambiente (não versionar)
├── package.json                 # Dependências do projeto
├── next.config.ts               # Configuração do Next.js
├── tsconfig.json                # Configuração do TypeScript
└── README.md                    # Documentação
```

## Como Usar

1. Acesse a aplicação no navegador
2. Cole o texto do contrato ou política de privacidade na área de texto
3. Clique em "Iniciar Auditoria Gratuita"
4. Aguarde a análise da IA
5. Visualize o score de conformidade, riscos identificados e sugestões

## Endpoint da API

**POST** `/api/audit`

### Corpo da Requisição (JSON):
```json
{
  "contractText": "Texto do contrato ou política de privacidade..."
}
```

### Resposta (JSON):
```json
{
  "score": 75,
  "status": "médio",
  "riscos": ["Risco 1", "Risco 2"],
  "sugestoes": ["Sugestão 1", "Sugestão 2"]
}
```

## Observações Importantes

- A chave API do Gemini deve ser mantida em segurança e não deve ser versionada
- O modelo utilizado é o `gemini-2.5-flash` (pode ser ajustado em `app/api/audit/route.ts`)
- O processamento de PDF pode exigir ajustes dependendo da estrutura do arquivo
- Recomenda-se não expor chaves de API em repositórios públicos

## Licença

Este projeto está sob a licença MIT (ou especificar a licença aplicável).

## Contato

Para dúvidas ou sugestões, entre em contato através dos issues do repositório.
