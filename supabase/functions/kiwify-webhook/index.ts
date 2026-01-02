// Supabase Edge Function - Kiwify Webhook Handler
// Processa pagamentos da Kiwify e adiciona créditos aos usuários

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Tipos para o payload do Kiwify
interface KiwifyCustomer {
  email: string;
  name: string;
  document?: string;
  phone?: string;
}

interface KiwifyProduct {
  id: string;
  name: string;
  price: number;
}

interface KiwifyPayment {
  method: string;
  status: string;
  installments?: number;
}

interface KiwifyWebhookPayload {
  event: string;
  order_id: string;
  customer: KiwifyCustomer;
  product: KiwifyProduct;
  payment: KiwifyPayment;
  subscription_id?: string;
  created_at: string;
}

// Mapeamento de produtos para créditos
// IMPORTANTE: Atualize com seus IDs de produto reais da Kiwify
const PRODUCT_CREDITS_MAP: Record<string, { credits: number; tier?: string }> = {
  // Pacotes de créditos avulsos
  "prod_10_creditos": { credits: 10 },
  "prod_50_creditos": { credits: 50 },
  "prod_100_creditos": { credits: 100 },
  "prod_500_creditos": { credits: 500 },

  // Planos de assinatura
  "prod_plano_pro": { credits: 100, tier: "pro" },
  "prod_plano_opus": { credits: 500, tier: "opus" },

  // Fallback para produtos não mapeados
  "default": { credits: 10 },
};

// Configuração CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-kiwify-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Verificar assinatura HMAC do webhook usando Web Crypto API
async function verifyKiwifySignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    console.warn("Webhook recebido sem assinatura");
    return false;
  }

  try {
    // Criar chave HMAC usando Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Gerar HMAC do payload
    const payloadData = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);

    // Converter para hex
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Comparação segura contra timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return false;
  }
}

// Obter créditos e tier baseado no produto
function getProductConfig(productId: string): { credits: number; tier?: string } {
  const normalizedId = productId.toLowerCase().replace(/-/g, "_");
  return PRODUCT_CREDITS_MAP[normalizedId] || PRODUCT_CREDITS_MAP["default"];
}

// Handler principal
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apenas aceitar POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Obter variáveis de ambiente
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const KIWIFY_WEBHOOK_SECRET = Deno.env.get("KIWIFY_WEBHOOK_SECRET");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }

    // Ler payload
    const rawBody = await req.text();
    const payload: KiwifyWebhookPayload = JSON.parse(rawBody);

    // Verificar assinatura (se secret configurado)
    if (KIWIFY_WEBHOOK_SECRET) {
      const signature = req.headers.get("x-kiwify-signature");
      const isValid = await verifyKiwifySignature(rawBody, signature, KIWIFY_WEBHOOK_SECRET);

      if (!isValid) {
        console.error("Assinatura inválida do webhook");
        return new Response(
          JSON.stringify({ error: "Assinatura inválida" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.warn("KIWIFY_WEBHOOK_SECRET não configurado - pulando verificação");
    }

    // Criar cliente Supabase com service role (acesso admin)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log do evento recebido
    console.log(`Evento Kiwify recebido: ${payload.event}`, {
      order_id: payload.order_id,
      customer_email: payload.customer.email,
      product_id: payload.product.id,
    });

    // Processar baseado no tipo de evento
    let result: { success: boolean; message: string; data?: any };

    switch (payload.event) {
      case "purchase_approved":
      case "order_paid":
        result = await handlePurchaseApproved(supabase, payload);
        break;

      case "subscription_activated":
      case "subscription_renewed":
        result = await handleSubscriptionActivated(supabase, payload);
        break;

      case "subscription_cancelled":
      case "subscription_expired":
        result = await handleSubscriptionCancelled(supabase, payload);
        break;

      case "refund_requested":
      case "chargeback":
        result = await handleRefund(supabase, payload);
        break;

      default:
        console.log(`Evento não processado: ${payload.event}`);
        result = { success: true, message: `Evento ${payload.event} ignorado` };
    }

    // Registrar transação para auditoria
    await logTransaction(supabase, payload, result);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro interno"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Handler: Compra aprovada
async function handlePurchaseApproved(
  supabase: any,
  payload: KiwifyWebhookPayload
): Promise<{ success: boolean; message: string; data?: any }> {
  const { customer, product, order_id } = payload;
  const config = getProductConfig(product.id);

  // Verificar se pedido já foi processado (idempotência)
  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("order_id", order_id)
    .single();

  if (existingTx) {
    return { success: true, message: "Pedido já processado anteriormente" };
  }

  // Buscar usuário pelo email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, credits, tier")
    .eq("email", customer.email.toLowerCase())
    .single();

  if (profileError || !profile) {
    // Usuário não existe - criar conta pendente ou retornar erro
    console.warn(`Usuário não encontrado: ${customer.email}`);
    return {
      success: false,
      message: `Usuário ${customer.email} não encontrado. Créditos serão adicionados quando criar conta.`,
      data: { pending: true, email: customer.email, credits: config.credits }
    };
  }

  // Atualizar créditos do usuário
  const newCredits = (profile.credits || 0) + config.credits;
  const updateData: any = { credits: newCredits };

  // Atualizar tier se o produto incluir upgrade
  if (config.tier) {
    updateData.tier = config.tier;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profile.id);

  if (updateError) {
    console.error("Erro ao atualizar créditos:", updateError);
    return { success: false, message: "Erro ao adicionar créditos" };
  }

  console.log(`Créditos adicionados: ${config.credits} para ${customer.email}`);

  return {
    success: true,
    message: `${config.credits} créditos adicionados com sucesso`,
    data: {
      user_id: profile.id,
      credits_added: config.credits,
      new_balance: newCredits,
      tier: config.tier || profile.tier,
    },
  };
}

// Handler: Assinatura ativada
async function handleSubscriptionActivated(
  supabase: any,
  payload: KiwifyWebhookPayload
): Promise<{ success: boolean; message: string; data?: any }> {
  // Mesmo processo da compra, mas também atualiza o tier
  const result = await handlePurchaseApproved(supabase, payload);

  if (result.success && payload.subscription_id) {
    // Salvar ID da assinatura para gerenciamento futuro
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", payload.customer.email.toLowerCase())
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ subscription_id: payload.subscription_id })
        .eq("id", profile.id);
    }
  }

  return result;
}

// Handler: Assinatura cancelada
async function handleSubscriptionCancelled(
  supabase: any,
  payload: KiwifyWebhookPayload
): Promise<{ success: boolean; message: string; data?: any }> {
  const { customer } = payload;

  // Buscar usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tier")
    .eq("email", customer.email.toLowerCase())
    .single();

  if (!profile) {
    return { success: true, message: "Usuário não encontrado" };
  }

  // Downgrade para tier free
  const { error } = await supabase
    .from("profiles")
    .update({
      tier: "free",
      subscription_id: null
    })
    .eq("id", profile.id);

  if (error) {
    return { success: false, message: "Erro ao atualizar tier" };
  }

  console.log(`Assinatura cancelada: ${customer.email} -> tier free`);

  return {
    success: true,
    message: "Assinatura cancelada, tier alterado para free",
    data: { user_id: profile.id, new_tier: "free" },
  };
}

// Handler: Reembolso/Chargeback
async function handleRefund(
  supabase: any,
  payload: KiwifyWebhookPayload
): Promise<{ success: boolean; message: string; data?: any }> {
  const { customer, product, order_id } = payload;
  const config = getProductConfig(product.id);

  // Buscar usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, credits, tier")
    .eq("email", customer.email.toLowerCase())
    .single();

  if (!profile) {
    return { success: true, message: "Usuário não encontrado para reembolso" };
  }

  // Remover créditos (mínimo 0)
  const newCredits = Math.max(0, (profile.credits || 0) - config.credits);
  const updateData: any = { credits: newCredits };

  // Se era assinatura, fazer downgrade
  if (config.tier) {
    updateData.tier = "free";
    updateData.subscription_id = null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", profile.id);

  if (error) {
    return { success: false, message: "Erro ao processar reembolso" };
  }

  console.log(`Reembolso processado: ${customer.email}, -${config.credits} créditos`);

  return {
    success: true,
    message: `Reembolso processado: ${config.credits} créditos removidos`,
    data: {
      user_id: profile.id,
      credits_removed: config.credits,
      new_balance: newCredits,
    },
  };
}

// Registrar transação para auditoria
async function logTransaction(
  supabase: any,
  payload: KiwifyWebhookPayload,
  result: { success: boolean; message: string; data?: any }
): Promise<void> {
  try {
    // Buscar user_id se disponível
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", payload.customer.email.toLowerCase())
      .single();

    const config = getProductConfig(payload.product.id);

    await supabase.from("transactions").insert({
      user_id: profile?.id || null,
      order_id: payload.order_id,
      product_id: payload.product.id,
      product_name: payload.product.name,
      amount: payload.product.price,
      credits_added: result.success ? config.credits : 0,
      event_type: payload.event,
      status: result.success ? "completed" : "failed",
      customer_email: payload.customer.email,
      raw_payload: payload,
      result_message: result.message,
    });
  } catch (error) {
    console.error("Erro ao registrar transação:", error);
    // Não falhar o webhook por erro de log
  }
}
