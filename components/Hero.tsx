import React, { useState } from 'react';
import { SearchIcon, ChevronDownIcon } from './Icons';
import { ModelType } from '../types';

interface HeroProps {
  onSearch: (query: string, model: ModelType) => void;
  isSearching: boolean;
}

const Hero: React.FC<HeroProps> = ({ onSearch, isSearching }) => {
  const [query, setQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FREE);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onSearch(query, selectedModel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-4">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center tracking-tight">
        Valide sua próxima <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          grande ideia
        </span>
      </h1>

      <p className="text-gray-400 mb-10 text-center max-w-lg text-lg">
        Descubra se o mercado quer o que você quer construir. Pesquisa profunda em fontes reais.
      </p>

      {/* Search Bar Container */}
      <div 
        className={`
          relative flex items-center w-full max-w-3xl h-16 
          bg-surface backdrop-blur-xl border border-white/10 rounded-2xl
          transition-all duration-300 shadow-2xl
          ${isSearching ? 'opacity-50 pointer-events-none' : ''}
          ${shake ? 'animate-shimmer border-red-500/50' : 'focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10'}
        `}
      >
        {/* Model Selector */}
        <div className="relative h-full">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between h-full px-5 text-sm font-medium text-gray-300 hover:text-white border-r border-white/10 min-w-[160px] hover:bg-white/5 rounded-l-2xl transition-colors"
          >
            {selectedModel}
            <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#0A0A14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Acesso Gratuito</div>
                <button 
                  onClick={() => { setSelectedModel(ModelType.FREE); setIsDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedModel === ModelType.FREE ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {ModelType.FREE}
                </button>
                
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase mt-2">Premium</div>
                {[ModelType.PRO, ModelType.OPUS, ModelType.GPT4].map((model) => (
                  <button 
                    key={model}
                    disabled={true} // Disabled for demo
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 cursor-not-allowed flex justify-between items-center group"
                  >
                    {model}
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Locked</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: App para donos de pet em apartamentos pequenos"
          className="flex-1 h-full bg-transparent border-none outline-none px-6 text-white placeholder-gray-500 text-lg"
          autoFocus
        />

        {/* Search Button */}
        <div className="pr-2">
          <button 
            onClick={handleSearch}
            className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary to-secondary rounded-xl hover:scale-105 active:scale-95 transition-transform"
          >
            <SearchIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {isSearching && (
        <div className="mt-8 flex flex-col items-center">
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-shimmer w-1/2 rounded-full" style={{ width: '100%', backgroundSize: '200% auto' }}></div>
          </div>
          <p className="text-sm text-gray-400 mt-3 animate-pulse">Analisando fontes de mercado...</p>
        </div>
      )}
    </div>
  );
};

export default Hero;
