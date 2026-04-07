
import React from 'react';
import { RiskLevel, PredictionOutput, AIReasoning } from '../types';
import { ShieldAlert, BarChart3, BrainCircuit, Activity, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import FeatureImportanceChart from './FeatureImportanceChart';

interface Props {
  prediction: PredictionOutput;
  reasoning: AIReasoning | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const RiskDashboard: React.FC<Props> = ({ prediction, reasoning, loading, error, onRetry }) => {
  const getStatusColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.HIGH: return 'bg-red-500';
      case RiskLevel.MEDIUM: return 'bg-orange-500';
      case RiskLevel.LOW: return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Risk Assessment</h3>
            </div>
            <div className={`${getStatusColor(prediction.riskLevel)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
              {prediction.riskLevel} Risk
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64" cy="64" r="58"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                />
                <circle
                  cx="64" cy="64" r="58"
                  fill="transparent"
                  stroke={prediction.riskLevel === RiskLevel.HIGH ? '#ef4444' : prediction.riskLevel === RiskLevel.MEDIUM ? '#f97316' : '#10b981'}
                  strokeWidth="8"
                  strokeDasharray={364}
                  strokeDashoffset={364 - (364 * prediction.riskScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{prediction.riskScore.toFixed(0)}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">Explainable AI (XAI)</h3>
          </div>
          <FeatureImportanceChart data={prediction.featureImportance} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900">Intelligent Risk Reasoning</h3>
          {loading && (
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
              <span className="text-xs text-blue-600 font-medium">Analysing...</span>
            </div>
          )}
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-slate-600 text-sm mb-4 max-w-md">{error}</p>
            <button 
              onClick={onRetry}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Retry AI Analysis
            </button>
          </div>
        ) : reasoning ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-2">
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {reasoning.summary}
              </p>
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Drivers</h4>
                <div className="flex flex-wrap gap-2">
                  {reasoning.contributingFactors.map((factor, idx) => (
                    <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md flex items-center gap-2">
                      <Activity className="w-3 h-3 text-blue-500" />
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Recommendations</h4>
              <ul className="space-y-3">
                {reasoning.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-40">
            <BrainCircuit className="w-12 h-12 mb-2 text-slate-300" />
            <p className="text-sm">Initiating AI Reasoning...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskDashboard;
