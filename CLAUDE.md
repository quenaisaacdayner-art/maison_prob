# CLAUDE.md - Relatório de Desenvolvimento

> **Última atualização:** 2025-01-03
> **Projeto:** Clarid - Business Validator
> **Repositório:** https://github.com/quenaisaacdayner-art/maison_prob
> **Deploy:** https://maison-prob.vercel.app/

---

## Resumo do Projeto

**Clarid** é um validador de ideias de negócios que utiliza Google Gemini AI para analisar a viabilidade de nichos e ideias no mercado brasileiro. O sistema oferece:

- Análise de mercado com IA (Gemini Flash/Pro)
- Sistema de créditos para usuários
- Planos Free e Premium
- Integração com Kiwify para pagamentos
- Dashboard com métricas detalhadas

---

## Sessão de Desenvolvimento - 2025-01-03

### O que foi implementado:

#### 1. Documentação do Projeto
- [x] Criado `PROJECT_OVERVIEW.md` como documento central de referência
- [x] Documentada arquitetura, stack tecnológica e funcionalidades
- [x] Guia completo de integração com Kiwify

#### 2. Integração Kiwify (Pagamentos)
- [x] Criada Edge Function `supabase/functions/kiwify-webhook/index.ts`
- [x] Implementada verificação HMAC SHA256 para segurança
- [x] Mapeamento inteligente de produtos por preço
- [x] Processamento de eventos: `purchase_approved`, `subscription_activated`, `refund`, etc.
- [x] Tabela `transactions` para auditoria
- [x] Trigger para processar créditos pendentes (compra antes do cadastro)

**URL do Webhook:**
```
https://wxyvknzmjycfsfszsgbv.supabase.co/functions/v1/kiwify-webhook
```

**Webhook Secret:** Configurado via `supabase secrets set KIWIFY_WEBHOOK_SECRET=229za43avhw`

#### 3. Modal de Preços (Upgrade)
- [x] Criado componente `components/PricingModal.tsx`
- [x] Design glassmorphism consistente com o site
- [x] Plano Free: 5 créditos, Gemini Flash
- [x] Plano Premium: R$ 5/mês, 100 créditos, Gemini Pro
- [x] Botão "Upgrade" na navbar para usuários free
- [x] Badge "Premium" para usuários pagos
- [x] Link direto para checkout: `https://pay.kiwify.com.br/n9tcsfk`

#### 4. Correção Tailwind CSS para Produção
- [x] Removido CDN do Tailwind (não funciona em produção)
- [x] Instalado Tailwind CSS v4 via npm
- [x] Configurado `tailwind.config.js` com tema customizado
- [x] Configurado `postcss.config.js` com `@tailwindcss/postcss`
- [x] Criado `index.css` com sintaxe Tailwind v4 (`@import "tailwindcss"`)

#### 5. Sincronização de Perfil em Tempo Real
- [x] Auto-refresh do perfil quando usuário volta à aba (window focus)
- [x] Supabase Realtime para atualizações instantâneas
- [x] Tier muda automaticamente na UI após pagamento

#### 6. Correção de Variáveis de Ambiente
- [x] Atualizado `vite.config.ts` para Vercel
- [x] Suporte para `VITE_GEMINI_API_KEY` e `GEMINI_API_KEY`

---

## Configurações Necessárias

### Vercel - Environment Variables
| Variável | Valor |
|----------|-------|
| `GEMINI_API_KEY` | Sua API Key do Google Gemini |
| `VITE_GEMINI_API_KEY` | Mesma API Key (necessário para Vite) |

### Supabase - Secrets
```bash
supabase secrets set KIWIFY_WEBHOOK_SECRET=229za43avhw
```

### Supabase - Realtime
Ativar Realtime na tabela `profiles`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

### Kiwify - Webhook
- **URL:** `https://wxyvknzmjycfsfszsgbv.supabase.co/functions/v1/kiwify-webhook`
- **Eventos:** `Compra aprovada`, `Assinatura cancelada`

---

## Estrutura de Arquivos Criados/Modificados

```
maison_prob/
├── PROJECT_OVERVIEW.md          # Documento central de referência
├── CLAUDE.md                    # Este relatório
├── index.css                    # Estilos Tailwind v4
├── tailwind.config.js           # Configuração do Tailwind
├── postcss.config.js            # Configuração PostCSS
├── vite.config.ts               # Atualizado para Vercel
├── components/
│   └── PricingModal.tsx         # Modal de preços/upgrade
├── contexts/
│   └── AuthContext.tsx          # Atualizado com Realtime
├── supabase/
│   ├── README.md                # Guia de deploy
│   ├── functions/
│   │   └── kiwify-webhook/
│   │       └── index.ts         # Edge Function do webhook
│   └── migrations/
│       └── 001_kiwify_integration.sql  # Schema do banco
└── App.tsx                      # Atualizado com PricingModal
```

---

## Commits Realizados

1. `feat: Add Kiwify payment integration and project documentation`
2. `fix: Replace Tailwind CDN with proper PostCSS setup for production`
3. `fix: Update to Tailwind v4 syntax with @import and @theme`
4. `feat: Add pricing modal with upgrade button in navbar`
5. `fix: Improve webhook product detection with smart pricing`
6. `feat: Add real-time profile sync for tier updates`
7. `fix: Update vite config for Vercel environment variables`

---

## Fluxo de Pagamento Completo

```
1. Usuário acessa Clarid (maison-prob.vercel.app)
2. Cria conta com email (ex: usuario@gmail.com)
3. Recebe 5 créditos grátis, tier = "free"
4. Clica em "Upgrade" na navbar
5. Modal de preços abre
6. Clica em "Assinar Premium"
7. Redireciona para Kiwify checkout
8. Paga R$ 5 com o MESMO email
9. Kiwify envia webhook para Edge Function
10. Edge Function:
    - Valida assinatura HMAC
    - Busca usuário pelo email
    - Adiciona 100 créditos
    - Muda tier para "pro"
    - Registra transação
11. Supabase Realtime notifica frontend
12. UI atualiza automaticamente (badge "Premium" aparece)
```

---

## Problemas Conhecidos e Soluções

### 1. Email diferente na Kiwify
**Problema:** Se o email da compra for diferente do cadastro, créditos não são adicionados.
**Solução:** Usar o mesmo email ou atualizar manualmente via SQL.

### 2. API Key not found
**Problema:** Variável de ambiente não carregada no Vercel.
**Solução:** Adicionar `VITE_GEMINI_API_KEY` além de `GEMINI_API_KEY`.

### 3. Tela preta no Vercel
**Problema:** Tailwind CDN não funciona em produção.
**Solução:** Instalado Tailwind via npm com PostCSS.

### 4. Tier não atualiza na UI
**Problema:** Perfil só carregava no login.
**Solução:** Adicionado Realtime + refresh on focus.

---

## Próximos Passos Sugeridos

- [ ] Adicionar histórico de análises do usuário
- [ ] Implementar exportação de relatórios (PDF)
- [ ] Adicionar mais modelos de IA (GPT-4, Claude)
- [ ] Dashboard de admin para ver transações
- [ ] Emails transacionais (confirmação de compra)
- [ ] Página de configurações do usuário

---

## Contatos e Links

- **Repositório:** https://github.com/quenaisaacdayner-art/maison_prob
- **Deploy:** https://maison-prob.vercel.app/
- **Supabase:** https://supabase.com/dashboard/project/wxyvknzmjycfsfszsgbv
- **Kiwify Checkout:** https://pay.kiwify.com.br/n9tcsfk

---

*Relatório gerado por Claude Code em 2025-01-03*
