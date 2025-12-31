export interface Source {
  name: string;
  count: number;
}

export interface Quote {
  text: string;
  source: string;
  date: string;
  url?: string;
}

export interface Competitor {
  name: string;
  description: string;
  type: 'Direct' | 'Indirect';
  weakness?: string;
}

export interface PotentialMetric {
  score: number;
  explanation: string;
}

export interface AlternativeProblem {
  title: string;
  description: string;
}

export interface AnalysisReport {
  executiveSummary: string;
  score: {
    total: number;
    volume: number;
    intensity: number;
    gap: number;
    momentum: number;
    interpretation: string;
  };
  evidence: Quote[];
  potential: {
    monetization: PotentialMetric;
    execution: PotentialMetric;
    defensibility: PotentialMetric;
  };
  competitors: {
    list: Competitor[];
    marketStatus: string;
    isSaturated: boolean;
  };
  sources: Source[];
  alternatives: AlternativeProblem[];
  query: string;
  modelUsed: string;
}

export enum AppState {
  HERO = 'HERO',
  ANALYZING = 'ANALYZING',
  REPORT = 'REPORT',
}

export enum ModelType {
  FREE = 'Gemini 2.0 Flash',
  PRO = 'Gemini 2.0 Pro',
  OPUS = 'Opus 4.5',
  GPT4 = 'GPT-4o'
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  credits: number;
  credits_used: number;
  tier: 'free' | 'pro' | 'opus';
}