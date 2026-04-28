# Como Rodar o PetShop CRM

## Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- npm 10+

## 1. Configurar ambiente

```bash
cp .env.example .env
# Edite o .env com suas chaves reais
```

## 2. Subir banco e Redis com Docker

```bash
docker-compose up postgres redis -d
```

## 3. Instalar dependências

```bash
npm install
```

## 4. Gerar cliente Prisma e rodar migrations

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
cd ../..
```

## 5. Rodar em desenvolvimento

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

## Login de demonstração

- URL: http://localhost:3000/demo/dashboard
- Tenant: `demo`
- Email: `admin@demo.com`
- Senha: `admin123456`

## 6. Rodar tudo com Docker (produção)

```bash
docker-compose up --build
```

---

## Configurar WhatsApp (Evolution API)

1. Acesse http://localhost:8080 (Evolution API)
2. Crie uma instância com o mesmo slug do seu tenant
3. Escaneie o QR Code com seu WhatsApp
4. Em Configurações > WhatsApp no CRM, informe o nome da instância
5. Configure o webhook em: `http://SEU_API_URL/api/v1/whatsapp/webhook/SEU_TENANT_SLUG`

---

## Criar novo tenant (cliente whitelabel)

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantSlug": "novo-petshop",
    "businessName": "Pet Shop do João",
    "name": "João Silva",
    "email": "joao@petshop.com",
    "password": "senha123456"
  }'
```

Acesse: http://localhost:3000/novo-petshop/dashboard

---

## Estrutura do Projeto

```
petshop-crm/
├── apps/
│   ├── api/          # Backend NestJS
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── appointments/
│   │   │   ├── pets/
│   │   │   ├── customers/
│   │   │   ├── financial/
│   │   │   ├── whatsapp/
│   │   │   ├── automations/
│   │   │   └── whitelabel/
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/          # Frontend Next.js 14
│       └── app/
│           └── [tenant]/
│               ├── dashboard/
│               ├── agenda/
│               ├── pets/
│               ├── clientes/
│               ├── financeiro/
│               ├── whatsapp/
│               ├── automacoes/
│               └── configuracoes/
└── docker-compose.yml
```
