# Supabase - Configuração e Deploy

Este diretório contém as Edge Functions e migrations do Supabase para o projeto Clarid.

## Estrutura

```
supabase/
├── functions/
│   └── kiwify-webhook/     # Webhook para processar pagamentos Kiwify
│       └── index.ts
├── migrations/
│   └── 001_kiwify_integration.sql   # Tabelas e funções para Kiwify
└── README.md
```

---

## Pré-requisitos

1. **Supabase CLI** instalado:
```bash
npm install -g supabase
```

2. **Login no Supabase**:
```bash
supabase login
```

3. **Projeto vinculado**:
```bash
supabase link --project-ref wxyvknzmjycfsfszsgbv
```

---

## Deploy das Migrations

Execute o SQL no Supabase Dashboard ou via CLI:

### Opção 1: Via Dashboard
1. Acesse [supabase.com](https://supabase.com) > Seu projeto
2. Vá em **SQL Editor**
3. Cole o conteúdo de `migrations/001_kiwify_integration.sql`
4. Execute

### Opção 2: Via CLI
```bash
supabase db push
```

---

## Deploy da Edge Function

### 1. Configurar Secrets

```bash
# Secret do webhook Kiwify (obtenha na dashboard da Kiwify)
supabase secrets set KIWIFY_WEBHOOK_SECRET=seu_secret_aqui
```

### 2. Deploy da Function

```bash
supabase functions deploy kiwify-webhook
```

### 3. Obter URL da Function

Após o deploy, a URL será:
```
https://wxyvknzmjycfsfszsgbv.supabase.co/functions/v1/kiwify-webhook
```

### 4. Configurar na Kiwify

1. Acesse **Kiwify** > **Configurações** > **Webhooks**
2. Adicione a URL acima
3. Selecione eventos:
   - `purchase_approved`
   - `order_paid`
   - `subscription_activated`
   - `subscription_renewed`
   - `subscription_cancelled`
   - `refund_requested`
4. Salve

---

## Variáveis de Ambiente Necessárias

| Variável | Descrição | Onde Obter |
|----------|-----------|------------|
| `SUPABASE_URL` | URL do projeto | Automático no Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin | Automático no Edge Functions |
| `KIWIFY_WEBHOOK_SECRET` | Secret para validar webhooks | Dashboard Kiwify |

---

## Configuração dos Produtos

Edite o mapeamento de produtos em `functions/kiwify-webhook/index.ts`:

```typescript
const PRODUCT_CREDITS_MAP: Record<string, { credits: number; tier?: string }> = {
  // Use os IDs exatos dos seus produtos na Kiwify
  "SEU_PRODUTO_10_CREDITOS": { credits: 10 },
  "SEU_PRODUTO_PRO": { credits: 100, tier: "pro" },
  // ...
};
```

---

## Testando Localmente

### 1. Iniciar Supabase local
```bash
supabase start
```

### 2. Servir function localmente
```bash
supabase functions serve kiwify-webhook --env-file .env.local
```

### 3. Testar com curl
```bash
curl -X POST http://localhost:54321/functions/v1/kiwify-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "order_id": "TEST_123",
    "customer": {
      "email": "teste@email.com",
      "name": "Teste"
    },
    "product": {
      "id": "prod_10_creditos",
      "name": "10 Créditos",
      "price": 29.90
    },
    "payment": {
      "method": "credit_card",
      "status": "approved"
    },
    "created_at": "2025-01-02T10:00:00Z"
  }'
```

---

## Monitoramento

### Logs da Edge Function
```bash
supabase functions logs kiwify-webhook
```

### Ver transações no banco
```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20;
```

### Estatísticas
```sql
SELECT * FROM transaction_stats;
```

---

## Troubleshooting

### Webhook retorna 401
- Verifique se `KIWIFY_WEBHOOK_SECRET` está configurado corretamente
- Confirme que o secret na Kiwify é o mesmo

### Créditos não adicionados
- Verifique se o email do cliente na Kiwify é o mesmo do cadastro no Clarid
- Confira os logs: `supabase functions logs kiwify-webhook`

### Pedido processado duas vezes
- O sistema tem proteção de idempotência por `order_id`
- Verifique na tabela `transactions` se há duplicatas

---

## Eventos Suportados

| Evento | Ação |
|--------|------|
| `purchase_approved` | Adiciona créditos |
| `order_paid` | Adiciona créditos |
| `subscription_activated` | Adiciona créditos + atualiza tier |
| `subscription_renewed` | Adiciona créditos da renovação |
| `subscription_cancelled` | Downgrade para tier free |
| `subscription_expired` | Downgrade para tier free |
| `refund_requested` | Remove créditos |
| `chargeback` | Remove créditos + downgrade |
