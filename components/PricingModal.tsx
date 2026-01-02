import React from 'react';
import { X, Check, Sparkles, Zap, Crown, ArrowRight, Star } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: 'free' | 'pro' | 'opus';
}

// URL do checkout do Kiwify
const KIWIFY_CHECKOUT_URL = 'https://pay.kiwify.com.br/n9tcsfk';

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentTier = 'free' }) => {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    // Abre o checkout do Kiwify em uma nova aba
    window.open(KIWIFY_CHECKOUT_URL, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#0A0A14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Sparkles className="text-yellow-400" size={20} />
              Escolha seu Plano
            </h2>
            <p className="text-sm text-gray-400 mt-1">Desbloqueie todo o potencial do Clarid</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Free Plan */}
          <div className={`relative p-6 rounded-2xl border transition-all ${
            currentTier === 'free'
              ? 'bg-white/5 border-white/20'
              : 'bg-white/[0.02] border-white/5 hover:border-white/10'
          }`}>
            {currentTier === 'free' && (
              <div className="absolute -top-3 left-4 px-3 py-1 bg-gray-700 text-white text-xs font-medium rounded-full">
                Plano Atual
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
                <Zap className="text-gray-400" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Free</h3>
                <p className="text-xs text-gray-500">Para começar</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-white">R$ 0</span>
              <span className="text-gray-500 text-sm">/mês</span>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Check size={16} className="text-green-500 shrink-0" />
                <span>5 créditos iniciais</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Check size={16} className="text-green-500 shrink-0" />
                <span>Modelo Gemini Flash</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300">
                <Check size={16} className="text-green-500 shrink-0" />
                <span>Análises básicas de mercado</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <X size={16} className="text-gray-600 shrink-0" />
                <span className="line-through">Modelo Gemini Pro</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <X size={16} className="text-gray-600 shrink-0" />
                <span className="line-through">Análises avançadas</span>
              </li>
            </ul>

            {currentTier === 'free' ? (
              <div className="w-full h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-sm text-gray-400 font-medium">
                Plano Atual
              </div>
            ) : (
              <button className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 font-medium transition-all">
                Fazer Downgrade
              </button>
            )}
          </div>

          {/* Premium Plan */}
          <div className="relative p-6 rounded-2xl border-2 border-primary/50 bg-gradient-to-b from-primary/10 to-transparent">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              POPULAR
            </div>

            {currentTier === 'pro' && (
              <div className="absolute -top-3 right-4 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                Ativo
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Crown className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Premium</h3>
                <p className="text-xs text-primary">Acesso completo</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold text-white">R$ 5</span>
              <span className="text-gray-400 text-sm">/mês</span>
              <div className="text-xs text-green-400 mt-1">Economize 90% vs. avulso</div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-gray-200">
                <Check size={16} className="text-green-400 shrink-0" />
                <span><strong>100 créditos</strong> por mês</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-200">
                <Check size={16} className="text-green-400 shrink-0" />
                <span>Modelo <strong>Gemini Pro</strong></span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-200">
                <Check size={16} className="text-green-400 shrink-0" />
                <span>Análises avançadas de mercado</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-200">
                <Check size={16} className="text-green-400 shrink-0" />
                <span>Relatórios detalhados</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-200">
                <Check size={16} className="text-green-400 shrink-0" />
                <span>Suporte prioritário</span>
              </li>
            </ul>

            {currentTier === 'pro' ? (
              <div className="w-full h-11 bg-green-600/20 border border-green-500/30 rounded-xl flex items-center justify-center text-sm text-green-400 font-medium">
                <Check size={16} className="mr-2" />
                Plano Ativo
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 group"
              >
                Assinar Premium
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Pagamento seguro via Kiwify • Cancele quando quiser
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
