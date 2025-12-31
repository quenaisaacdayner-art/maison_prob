import React, { useState } from 'react';
import { AnalysisReport, AppState, ModelType } from './types';
import { analyzeBusinessIdea } from './services/geminiService';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import { User, LogOut, Coins, BarChart3 } from 'lucide-react';
import { supabase } from './lib/supabase';

const App = () => {
  const [state, setState] = useState<AppState>(AppState.HERO);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Auth Logic
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  const handleSearch = async (query: string, model: ModelType) => {
    // 1. Check if user is logged in
    if (!user) {
      setLoadingError("Crie uma conta gratuita para realizar sua análise de mercado.");
      openAuth('signup');
      return;
    }

    setLoadingError(null);

    try {
      // 2. Try to deduct credit via Supabase RPC (Atomic Transaction)
      // This increases credits_used and decreases credits in one go
      const { data: success, error: rpcError } = await supabase.rpc('deduct_credit', { 
        user_id: user.id 
      });

      if (rpcError) throw rpcError;

      if (!success) {
        setLoadingError("Você não possui créditos suficientes. Faça um upgrade para continuar.");
        return;
      }

      // Update UI to reflect new credit balance immediately
      await refreshProfile();

      // 3. Proceed with Analysis
      setState(AppState.ANALYZING);
      const result = await analyzeBusinessIdea(query, model);
      setReport(result);
      setState(AppState.REPORT);

    } catch (error: any) {
      console.error(error);
      setLoadingError(error.message || "Ocorreu um erro ao processar sua solicitação.");
      setState(AppState.HERO);
    }
  };

  const handleReset = () => {
    setReport(null);
    setState(AppState.HERO);
  };

  const openAuth = (view: 'login' | 'signup') => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-primary/30 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 h-20 px-6 md:px-12 flex items-center justify-between backdrop-blur-md bg-dark/30 border-b border-white/5">
        <div 
          className="text-2xl font-bold tracking-tighter flex items-center gap-2 cursor-pointer" 
          onClick={handleReset}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg">C</div>
          Clarid
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Sobre</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors mr-2">Como funciona</a>
          
          <div className="flex items-center gap-3 border-l border-white/10 pl-6 h-8">
            {!loading && user && profile ? (
              <>
                 {/* Stats Display */}
                <div className="flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5" title="Créditos Disponíveis">
                    <Coins size={14} className="text-yellow-400" />
                    <span className="text-gray-300 font-mono text-xs">{profile.credits} cr.</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5" title="Análises Realizadas">
                    <BarChart3 size={14} className="text-primary" />
                    <span className="text-gray-300 font-mono text-xs">{profile.credits_used || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary text-xs font-bold">
                      {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                   </div>
                   <button 
                     onClick={() => signOut()}
                     className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                     title="Sair"
                   >
                     <LogOut size={16} />
                   </button>
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={() => openAuth('signup')}
                  className="text-gray-300 hover:text-white transition-colors px-2 py-2"
                >
                  Cadastre-se
                </button>
                <button 
                  onClick={() => openAuth('login')}
                  className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl transition-all shadow-lg shadow-primary/20"
                >
                  Conecte-se
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {state === AppState.HERO && (
          <Hero onSearch={handleSearch} isSearching={false} />
        )}

        {state === AppState.ANALYZING && (
          <Hero onSearch={() => {}} isSearching={true} />
        )}

        {state === AppState.REPORT && report && (
          <Dashboard data={report} onReset={handleReset} />
        )}

        {/* Error Toast */}
        {loadingError && (
          <div className="fixed bottom-8 right-8 max-w-sm bg-red-900/90 text-white p-4 rounded-xl border border-red-500/50 shadow-2xl backdrop-blur-xl animate-bounce z-50">
            <p className="text-sm font-medium">{loadingError}</p>
          </div>
        )}
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        initialView={authView} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default App;