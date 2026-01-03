# PROJECT_OVERVIEW.md - Clarid Business Validator

> **Documento de Referência Central**
> Consulte este documento antes de fazer qualquer alteração no projeto.
> Atualize sempre que o projeto evoluir.

---

## 1. Objetivo do Projeto

**Clarid** é um painel de controle (dashboard) para validação de ideias de negócios, focado no mercado brasileiro. O sistema utiliza **Google Gemini AI** como motor principal para analisar a viabilidade de nichos e ideias de negócio, simulando pesquisas em redes sociais e fóruns.

### Proposta de Valor
- Validar ideias de negócio com análise de mercado baseada em IA
- Identificar concorrentes, gaps de mercado e oportunidades
- Fornecer score de viabilidade com métricas detalhadas
- Sugerir pivots e alternativas quando necessário

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React | 19.2.3 |
| Linguagem | TypeScript | 5.8.2 |
| Build Tool | Vite | 6.2.0 |
| Motor de IA | Google Gemini | @google/genai 1.34.0 |
| Backend/Auth | Supabase | 2.39.0 |
| Gráficos | Recharts | 3.6.0 |
| Ícones | Lucide React | 0.562.0 |

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  App.tsx ─────────────────────────────────────────────────  │
│    ├── Hero.tsx (Landing + Search Input)                    │
│    ├── Dashboard.tsx (Relatório de Análise)                 │
│    ├── AuthModal.tsx (Login/Signup)                         │
│    └── Icons.tsx (Componentes de ícones)                    │
├─────────────────────────────────────────────────────────────┤
│  contexts/                                                   │
│    └── AuthContext.tsx (Estado de autenticação)             │
├─────────────────────────────────────────────────────────────┤
│  services/                                                   │
│    └── geminiService.ts (Integração com Gemini AI)          │
├─────────────────────────────────────────────────────────────┤
│  lib/                                                        │
│    └── supabase.ts (Cliente Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│  supabase/                                                   │
│    ├── functions/                                            │
│    │   └── kiwify-webhook/ (Edge Function - Pagamentos)     │
│    └── migrations/                                           │
│        └── 001_kiwify_integration.sql                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVIÇOS EXTERNOS                         │
├─────────────────────────────────────────────────────────────┤
│  Supabase                    │  Google Gemini AI            │
│  ├── Autenticação            │  ├── gemini-3-pro-preview    │
│  ├── Banco de dados          │  └── gemini-3-flash-preview  │
│  │   ├── profiles            │                              │
│  │   └── transactions        │  Kiwify                      │
│  ├── RPC: deduct_credit      │  └── Webhooks de pagamento   │
│  └── Edge Functions          │                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Funcionalidades Atuais

### 4.1 Autenticação
- [x] Login/Signup via Supabase Auth
- [x] Gerenciamento de sessão
- [x] Perfil de usuário com créditos

### 4.2 Sistema de Créditos
- [x] Créditos por usuário (campo `credits` no profile)
- [x] Contador de análises realizadas (`credits_used`)
- [x] Dedução atômica via RPC `deduct_credit`
- [x] Tiers de usuário: `free`, `pro`, `opus`

### 4.3 Análise de Ideias
- [x] Input de ideia de negócio
- [x] Seleção de modelo (Gemini Flash / Pro)
- [x] Score de viabilidade (0-100)
- [x] Métricas: Volume, Intensidade, Gap, Momentum
- [x] Identificação de concorrentes
- [x] Evidências de mercado simuladas
- [x] Sugestões de pivot

### 4.4 Dashboard
- [x] Gráfico de fontes analisadas
- [x] Cards de métricas de potencial
- [x] Lista de evidências
- [x] Análise de concorrência
- [x] Pivots sugeridos

---

## 5. Estrutura do Banco de Dados (Supabase)

### Tabela: `profiles`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | FK para auth.users |
| email | string | Email do usuário |
| full_name | string | Nome completo |
| credits | integer | Créditos disponíveis |
| credits_used | integer | Total de análises feitas |
| tier | enum | 'free', 'pro', 'opus' |
| subscription_id | string | ID da assinatura Kiwify (opcional) |

### Tabela: `transactions` (Kiwify)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK para profiles |
| order_id | string | ID único do pedido Kiwify |
| product_id | string | ID do produto |
| product_name | string | Nome do produto |
| amount | decimal | Valor pago |
| credits_added | integer | Créditos adicionados |
| event_type | string | Tipo de evento (purchase_approved, etc) |
| status | string | pending, completed, failed |
| customer_email | string | Email do cliente |
| raw_payload | jsonb | Payload original para debug |
| created_at | timestamp | Data de criação |

### Função RPC: `deduct_credit`
- Deduz 1 crédito atomicamente
- Retorna `true` se sucesso, `false` se sem créditos

### Trigger: `process_pending_credits`
- Executa quando novo usuário é criado
- Processa créditos de compras feitas antes do cadastro

---

## 6. Restrições e Premissas

### Restrições
- API Key do Gemini via variável de ambiente `API_KEY`
- Supabase configurado com URL e ANON_KEY hardcoded
- Sem backend próprio (tudo via Supabase + Gemini direto)
- Sistema de créditos depende de RPC no Supabase

### Premissas
- Usuários precisam de conta para usar o serviço
- Cada análise consome 1 crédito
- Mercado alvo: Brasil (foco em contexto BR)
- Gemini com Google Search habilitado para dados em tempo real

---

## 7. Variáveis de Ambiente

```env
API_KEY=<sua-chave-google-gemini>
```

O Supabase está configurado diretamente em `lib/supabase.ts`:
- `SUPABASE_URL`: https://wxyvknzmjycfsfszsgbv.supabase.co
- `SUPABASE_ANON_KEY`: (já configurado)

---

## 8. Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
```

---

## 9. Integrações

### 9.1 Kiwify (Pagamentos) - IMPLEMENTADO
- [x] Webhook para processar compras (Edge Function)
- [x] Adicionar créditos automaticamente após pagamento
- [x] Verificar assinatura de webhook (HMAC SHA256)
- [x] Atualizar tier do usuário
- [x] Tabela de transações para auditoria
- [x] Proteção de idempotência (order_id único)
- [x] Processamento de créditos pendentes (usuário compra antes de criar conta)

**Arquivos:**
- `supabase/functions/kiwify-webhook/index.ts` - Edge Function principal
- `supabase/migrations/001_kiwify_integration.sql` - Schema do banco
- `supabase/README.md` - Guia de deploy

**URL do Webhook:**
```
https://wxyvknzmjycfsfszsgbv.supabase.co/functions/v1/kiwify-webhook
```

### 9.2 API de Rastreio - PENDENTE
- [ ] Integrar API de rastreio de arquivos
- [ ] Monitorar problemas no aplicativo
- [ ] Dashboard de status

---

## 10. Guia de Integração com Kiwify

### 10.1 O que é Kiwify?
Kiwify é uma plataforma brasileira de vendas de produtos digitais que oferece:
- Checkout otimizado
- Webhooks para automação
- Área de membros
- Gestão de assinaturas

### 10.2 Passo a Passo para Integração

#### Passo 1: Criar Produto na Kiwify
1. Acesse [kiwify.com.br](https://kiwify.com.br)
2. Crie uma conta de produtor
3. Vá em **Produtos** > **Criar Produto**
4. Configure:
   - Tipo: Produto Digital ou Assinatura
   - Nome: "Clarid Pro" / "Pacote de Créditos"
   - Preço: conforme sua estratégia

#### Passo 2: Configurar Webhook na Kiwify
1. Vá em **Configurações** > **Webhooks**
2. Adicione nova URL: `https://seu-dominio.com/api/kiwify/webhook`
3. Selecione eventos:
   - `purchase_approved` (compra aprovada)
   - `subscription_activated` (assinatura ativada)
   - `subscription_cancelled` (assinatura cancelada)
4. Copie o **Webhook Secret** para verificação

#### Passo 3: Criar Endpoint de Webhook (Backend)

Como o projeto atual não tem backend próprio, você precisará criar um usando uma destas opções:

**Opção A: Supabase Edge Functions**
```typescript
// supabase/functions/kiwify-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KIWIFY_WEBHOOK_SECRET = Deno.env.get('KIWIFY_WEBHOOK_SECRET')

serve(async (req) => {
  // Verificar assinatura do webhook
  const signature = req.headers.get('x-kiwify-signature')
  // ... validar signature com HMAC

  const payload = await req.json()

  if (payload.event === 'purchase_approved') {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const email = payload.customer.email
    const productId = payload.product.id

    // Buscar usuário pelo email
    const { data: user } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('email', email)
      .single()

    if (user) {
      // Mapear produto para créditos
      const creditsByProduct: Record<string, number> = {
        'PROD_10_CREDITOS': 10,
        'PROD_50_CREDITOS': 50,
        'PROD_100_CREDITOS': 100,
      }

      const creditsToAdd = creditsByProduct[productId] || 10

      // Adicionar créditos
      await supabase
        .from('profiles')
        .update({ credits: user.credits + creditsToAdd })
        .eq('id', user.id)
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Opção B: Vercel Serverless Function (se migrar para Next.js)**
```typescript
// pages/api/kiwify/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verificar assinatura
  const signature = req.headers['x-kiwify-signature'] as string
  const isValid = verifyKiwifySignature(
    JSON.stringify(req.body),
    signature,
    process.env.KIWIFY_WEBHOOK_SECRET!
  )

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // Processar evento
  const { event, customer, product } = req.body

  // ... lógica similar à Opção A

  return res.status(200).json({ success: true })
}

function verifyKiwifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  )
}
```

#### Passo 4: Estrutura do Payload Kiwify

```json
{
  "event": "purchase_approved",
  "order_id": "ORD_123456",
  "customer": {
    "email": "cliente@email.com",
    "name": "Nome do Cliente",
    "document": "12345678900"
  },
  "product": {
    "id": "PROD_ID",
    "name": "Nome do Produto",
    "price": 97.00
  },
  "payment": {
    "method": "credit_card",
    "status": "approved"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Passo 5: Tabela de Transações (Recomendado)

Criar tabela no Supabase para auditoria:

```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  order_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  credits_added INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Passo 6: Testar Integração
1. Use o **Modo de Teste** da Kiwify
2. Faça uma compra teste
3. Verifique nos logs se o webhook foi recebido
4. Confirme que os créditos foram adicionados

### 10.3 Fluxo Completo de Integração

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│   Kiwify    │────▶│  Webhook    │────▶│  Supabase   │
│  (Checkout) │     │ (Pagamento) │     │  (Backend)  │     │ (Database)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │                   │
      │ 1. Compra          │                   │                   │
      │───────────────────▶│                   │                   │
      │                    │ 2. Processa       │                   │
      │                    │   Pagamento       │                   │
      │                    │                   │                   │
      │                    │ 3. Webhook POST   │                   │
      │                    │───────────────────▶│                   │
      │                    │                   │ 4. Valida         │
      │                    │                   │   Assinatura      │
      │                    │                   │                   │
      │                    │                   │ 5. Atualiza       │
      │                    │                   │   Créditos        │
      │                    │                   │───────────────────▶│
      │                    │                   │                   │
      │                    │                   │ 6. Responde 200   │
      │                    │◀──────────────────│                   │
      │ 7. Confirmação     │                   │                   │
      │◀───────────────────│                   │                   │
```

### 10.4 Checklist de Implementação

- [x] Criar conta de produtor na Kiwify
- [x] Configurar produtos (pacotes de créditos)
- [x] Criar endpoint de webhook (Supabase Edge Function)
- [x] Configurar URL do webhook na Kiwify
- [x] Guardar KIWIFY_WEBHOOK_SECRET nas variáveis de ambiente
- [x] Criar tabela `transactions` para auditoria
- [x] Testar fluxo completo com compra real
- [ ] Configurar alertas para falhas de webhook

---

## 11. Histórico de Alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2025-01-02 | Criação do documento | Claude |
| 2025-01-02 | Implementação Edge Function Kiwify | Claude |
| 2025-01-02 | Adição de migrations SQL para Kiwify | Claude |
| 2025-01-03 | Modal de Preços (PricingModal) | Claude |
| 2025-01-03 | Correção Tailwind CSS para produção | Claude |
| 2025-01-03 | Sincronização de perfil em tempo real | Claude |
| 2025-01-03 | Correção variáveis de ambiente Vercel | Claude |

---

## 12. Notas para Desenvolvimento

1. **Antes de qualquer alteração**: Leia este documento e `CLAUDE.md`
2. **Após alterações significativas**: Atualize ambos os documentos
3. **Novas integrações**: Documente aqui antes de implementar
4. **Problemas conhecidos**: Adicione na seção de restrições
5. **Relatório detalhado**: Consulte `CLAUDE.md` para histórico completo
