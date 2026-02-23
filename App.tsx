
import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_DATA } from './constants';
import { FloodDataPoint, PredictionOutput, AIReasoning } from './types';
import { predictFloodRisk } from './services/mlEngine';
import { getAIInsights } from './services/geminiService';
import SimulationPanel from './components/SimulationPanel';
import RiskDashboard from './components/RiskDashboard';
import MapContainer from './components/MapContainer';
import LocationSelector from './components/LocationSelector';
import DecisionAssistant from './components/DecisionAssistant';
import { Download, Share2, AlertTriangle, MousePointer2, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<FloodDataPoint[]>(INITIAL_DATA);
  const [selectedPoint, setSelectedPoint] = useState<FloodDataPoint>(INITIAL_DATA[0]);
  const [prediction, setPrediction] = useState<PredictionOutput>(predictFloodRisk(INITIAL_DATA[0]));
  const [reasoning, setReasoning] = useState<AIReasoning | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Core ML Update Logic
  useEffect(() => {
    const result = predictFloodRisk(selectedPoint);
    setPrediction(result);
  }, [selectedPoint]);

  const fetchAIReasoning = useCallback(async () => {
    setLoadingAI(true);
    setAiError(null);
    try {
      const aiData = await getAIInsights(selectedPoint, prediction);
      setReasoning(aiData);
    } catch (error: any) {
      if (error.message === "QUOTA_EXHAUSTED") {
        setAiError("API rate limit reached. Please wait a moment before retrying.");
      } else {
        setAiError("Failed to fetch AI insights. Check your connection.");
      }
    } finally {
      setLoadingAI(false);
    }
  }, [selectedPoint, prediction.riskLevel]);

  // AI Reasoning Debounced Update
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(fetchAIReasoning, 800);
    return () => clearTimeout(timer);
  }, [fetchAIReasoning]);

  const handleDataChange = useCallback((newData: FloodDataPoint) => {
    setSelectedPoint(newData);
    setDataPoints(prev => prev.map(p => p.id === newData.id ? newData : p));
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newId = `custom-${Date.now()}`;
    const newPoint: FloodDataPoint = {
      id: newId,
      locationName: `Analysis Zone ${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      latitude: lat,
      longitude: lng,
      rainfall: 150,
      temperature: 25,
      humidity: 60,
      riverDischarge: 1000,
      waterLevel: 2.0,
      elevation: 50,
      landCover: 'Unknown',
      soilType: 'Loam',
      populationDensity: 200,
      infrastructureScore: 5,
      historicalFloods: 0
    };

    setDataPoints(prev => [...prev, newPoint]);
    setSelectedPoint(newPoint);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <aside className="w-80 shrink-0">
        <SimulationPanel 
          currentData={selectedPoint} 
          onChange={handleDataChange} 
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none">FloodGuard AI</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Geospatial Risk System v3.1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">
              <Share2 className="w-4 h-4" /> Export Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
              <Download className="w-4 h-4" /> QGIS Package
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-4">
              <LocationSelector 
                locations={dataPoints}
                selectedId={selectedPoint.id}
                onSelect={setSelectedPoint}
              />
              <div className="bg-white p-6 rounded-xl border border-slate-100 hidden lg:block">
                 <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <MousePointer2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Analysis Metadata</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{selectedPoint.locationName}</h2>
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500 uppercase font-bold tracking-tighter">Latitude</span>
                    <span className="text-xs font-medium text-slate-900">{selectedPoint.latitude.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500 uppercase font-bold tracking-tighter">Longitude</span>
                    <span className="text-xs font-medium text-slate-900">{selectedPoint.longitude.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[11px] text-slate-500 uppercase font-bold tracking-tighter">Source</span>
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-tighter">
                      {selectedPoint.id.startsWith('custom-') ? 'Manual Input' : 'Reference Dataset'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <MapContainer 
                data={dataPoints} 
                selectedPoint={selectedPoint} 
                onSelectPoint={setSelectedPoint}
                onMapClick={handleMapClick}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RiskDashboard 
                prediction={prediction} 
                reasoning={reasoning}
                loading={loadingAI}
                error={aiError}
                onRetry={fetchAIReasoning}
              />
            </div>
            <div className="lg:col-span-1">
              <DecisionAssistant 
                currentData={selectedPoint}
                prediction={prediction}
              />
            </div>
          </div>

          <footer className="pt-8 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs font-medium">
              <p>© 2024 AI-Enabled Geospatial Flood Risk Analysis System</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-blue-600 transition-colors">Methodology</a>
                <a href="#" className="hover:text-blue-600 transition-colors">API Documentation</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
