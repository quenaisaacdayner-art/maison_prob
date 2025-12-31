import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { AnalysisReport, Source } from '../types';
import { 
  AlertIcon, 
  CheckIcon, 
  RedditIcon, 
  TwitterIcon, 
  LinkIcon, 
  ShieldIcon, 
  ZapIcon, 
  MoneyIcon,
  TrendingUpIcon,
  CloseIcon
} from './Icons';

interface DashboardProps {
  data: AnalysisReport;
  onReset: () => void;
}

const ScoreGauge = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  
  let color = '#FF4444'; // Red
  if (score >= 40) color = '#FF8C00'; // Orange
  if (score >= 60) color = '#FFB800'; // Yellow
  if (score >= 80) color = '#00D9A0'; // Green

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45"
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs text-gray-400 uppercase tracking-wider">Viabilidade</span>
      </div>
    </div>
  );
};

const SourceChart = ({ sources }: { sources: Source[] }) => {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sources}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280" 
            tick={{fill: '#9ca3af', fontSize: 12}} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip 
            cursor={{fill: 'rgba(255,255,255,0.05)'}}
            contentStyle={{ backgroundColor: '#0A0A14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {sources.map((entry, index) => (
               <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#5B5FFF' : '#7B3FFF'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button 
            onClick={onReset}
            className="text-sm text-gray-400 hover:text-white flex items-center mb-2 transition-colors"
          >
            ← Nova Pesquisa
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-white max-w-2xl">{data.query}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-gray-300">{data.modelUsed}</span>
            <span className="text-xs text-gray-500">Atualizado agora</span>
          </div>
        </div>
        <div className="flex gap-2">
           {/* Actions could go here */}
        </div>
      </div>

      {/* Executive Summary & Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <ScoreGauge score={data.score.total} />
          <p className={`mt-4 text-lg font-medium ${
            data.score.total >= 80 ? 'text-[#00D9A0]' : 
            data.score.total >= 60 ? 'text-[#FFB800]' : 
            'text-[#FF4444]'
          }`}>
            {data.score.interpretation}
          </p>
          
          <div className="grid grid-cols-4 gap-2 w-full mt-6 border-t border-white/10 pt-6">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Vol</div>
              <div className="text-sm font-semibold">{data.score.volume}/30</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Int</div>
              <div className="text-sm font-semibold">{data.score.intensity}/25</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Gap</div>
              <div className="text-sm font-semibold">{data.score.gap}/25</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Mom</div>
              <div className="text-sm font-semibold">{data.score.momentum}/20</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-8 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUpIcon className="text-primary" />
            Veredito Executivo
          </h3>
          <p className="text-gray-300 text-lg leading-relaxed">
            {data.executiveSummary}
          </p>
          
          {/* Potential Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-green-400">
                <MoneyIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Monetização</span>
              </div>
              <div className="text-2xl font-bold mb-1">{data.potential.monetization.score}/10</div>
              <p className="text-xs text-gray-400 leading-tight">{data.potential.monetization.explanation}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <ZapIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Execução</span>
              </div>
              <div className="text-2xl font-bold mb-1">{data.potential.execution.score}/10</div>
              <p className="text-xs text-gray-400 leading-tight">{data.potential.execution.explanation}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2 text-purple-400">
                <ShieldIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Defensibilidade</span>
              </div>
              <div className="text-2xl font-bold mb-1">{data.potential.defensibility.score}/10</div>
              <p className="text-xs text-gray-400 leading-tight">{data.potential.defensibility.explanation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Evidence & Sources */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sources Graph */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Fontes Analisadas</h3>
            <SourceChart sources={data.sources} />
            <div className="flex gap-4 mt-4 justify-center">
              {data.sources.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                  {s.name.toLowerCase().includes('reddit') ? <RedditIcon className="w-4 h-4" /> : 
                   s.name.toLowerCase().includes('twitter') ? <TwitterIcon className="w-4 h-4" /> :
                   <div className="w-4 h-4 rounded-full bg-gray-700" />}
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          {/* Evidence List */}
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6">Evidências de Mercado</h3>
            <div className="space-y-4">
              {data.evidence.map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-5 border-l-4 border-primary hover:bg-white/10 transition-colors">
                  <p className="text-gray-200 italic mb-3 text-sm md:text-base">"{item.text}"</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                       <span className="font-semibold text-gray-400">{item.source}</span> • {item.date}
                    </span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                        Ver original <LinkIcon className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Competitors & Alternatives */}
        <div className="space-y-6">
          {/* Competitors */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Concorrência</h3>
              {data.competitors.isSaturated && (
                 <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold border border-red-500/20">SATURADO</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-4">{data.competitors.marketStatus}</p>
            
            <div className="space-y-3">
              {data.competitors.list.map((comp, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-white text-sm">{comp.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${comp.type === 'Direct' ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                      {comp.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{comp.description}</p>
                  {comp.weakness && (
                    <div className="text-xs text-gray-500 border-t border-white/5 pt-2 mt-2">
                      <span className="text-primary">Gap:</span> {comp.weakness}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alternatives */}
          <div className="glass-panel rounded-2xl p-6 bg-gradient-to-b from-primary/5 to-transparent">
             <h3 className="text-lg font-semibold mb-4 text-white">Pivots Sugeridos</h3>
             <div className="space-y-3">
               {data.alternatives.map((alt, idx) => (
                 <div key={idx} className="group p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-primary/30 cursor-pointer">
                   <div className="flex items-start gap-2">
                     <div className="mt-1 w-2 h-2 rounded-full bg-primary group-hover:shadow-[0_0_8px_rgba(91,95,255,0.8)] transition-shadow"></div>
                     <div>
                       <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{alt.title}</h4>
                       <p className="text-xs text-gray-500 mt-1">{alt.description}</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
