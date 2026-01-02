-- Migration: Integração Kiwify
-- Criado em: 2025-01-02
-- Descrição: Adiciona suporte para webhooks do Kiwify

-- ============================================
-- 1. Adicionar campo subscription_id na tabela profiles
-- ============================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- ============================================
-- 2. Criar tabela de transações para auditoria
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  credits_added INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  raw_payload JSONB,
  result_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para evitar processamento duplicado
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_order_id
ON transactions(order_id);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
ON transactions(user_id);

-- Índice para busca por email (usuários não cadastrados)
CREATE INDEX IF NOT EXISTS idx_transactions_customer_email
ON transactions(customer_email);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions(status);

-- ============================================
-- 3. Trigger para atualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. RLS (Row Level Security) para transactions
-- ============================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias transações
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Política: Service role pode inserir/atualizar (para webhooks)
CREATE POLICY "Service role can manage transactions"
ON transactions FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 5. Função para processar créditos pendentes
-- (Quando usuário cria conta após compra)
-- ============================================
CREATE OR REPLACE FUNCTION process_pending_credits()
RETURNS TRIGGER AS $$
DECLARE
  pending_tx RECORD;
  total_credits INTEGER := 0;
BEGIN
  -- Buscar transações pendentes para o email do novo usuário
  FOR pending_tx IN
    SELECT * FROM transactions
    WHERE customer_email = NEW.email
    AND status = 'pending'
    AND user_id IS NULL
  LOOP
    -- Atualizar transação com user_id
    UPDATE transactions
    SET user_id = NEW.id, status = 'completed'
    WHERE id = pending_tx.id;

    -- Somar créditos
    total_credits := total_credits + pending_tx.credits_added;
  END LOOP;

  -- Adicionar créditos ao novo usuário se houver pendentes
  IF total_credits > 0 THEN
    UPDATE profiles
    SET credits = COALESCE(credits, 0) + total_credits
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Processar créditos quando novo usuário é criado
DROP TRIGGER IF EXISTS on_new_user_process_credits ON profiles;
CREATE TRIGGER on_new_user_process_credits
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION process_pending_credits();

-- ============================================
-- 6. View para dashboard de transações
-- ============================================
CREATE OR REPLACE VIEW transaction_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
  SUM(credits_added) FILTER (WHERE status = 'completed') as total_credits_added
FROM transactions
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================
-- 7. Comentários para documentação
-- ============================================
COMMENT ON TABLE transactions IS 'Registro de todas as transações do Kiwify para auditoria';
COMMENT ON COLUMN transactions.order_id IS 'ID único do pedido na Kiwify';
COMMENT ON COLUMN transactions.event_type IS 'Tipo de evento: purchase_approved, subscription_activated, refund, etc';
COMMENT ON COLUMN transactions.status IS 'Status: pending, completed, failed';
COMMENT ON COLUMN transactions.raw_payload IS 'Payload original do webhook para debug';

-- ============================================
-- 8. Funções de gerenciamento de créditos (adicionado)
-- ============================================

-- 8.1 Adicionar coluna de créditos usados
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 0;

-- 8.2 Função para criar perfil de novo usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, credits, tier, credits_used)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    5,      -- Créditos iniciais
    'free', -- Tier inicial
    0       -- Créditos usados inicial
  );
  RETURN new;
END;
$$;

-- 8.3 Função RPC para descontar crédito (transação atômica)
CREATE OR REPLACE FUNCTION deduct_credit(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INT;
BEGIN
  -- Verifica créditos atuais
  SELECT credits INTO current_credits FROM profiles WHERE id = user_id;

  -- Se tiver crédito, atualiza as duas colunas
  IF current_credits > 0 THEN
    UPDATE profiles
    SET credits = credits - 1,
        credits_used = credits_used + 1
    WHERE id = user_id;
    RETURN TRUE; -- Sucesso
  ELSE
    RETURN FALSE; -- Falha (sem saldo)
  END IF;
END;
$$;
