
import React from 'react';
import { FloodDataPoint } from '../types';
import { MapPin, CloudRain, Waves, ArrowUpCircle, Info, Database } from 'lucide-react';

interface Props {
  currentData: FloodDataPoint;
  onChange: (newData: FloodDataPoint) => void;
}

const SimulationPanel: React.FC<Props> = ({ currentData, onChange }) => {
  const handleChange = (field: keyof FloodDataPoint, value: number | string) => {
    onChange({ ...currentData, [field]: value });
  };

  return (
    <div className="bg-white p-6 h-full overflow-y-auto border-r border-slate-200">
      <div className="flex items-center gap-2 mb-2 text-slate-900">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">Risk Simulation</h2>
      </div>
      <div className="flex items-center gap-1.5 mb-6 opacity-60">
        <Database className="w-3 h-3" />
        <span className="text-[10px] font-bold uppercase tracking-tighter">India Regional Dataset v2024.1</span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <CloudRain className="w-4 h-4" /> 24h Rainfall (mm)
          </label>
          <input
            type="range"
            min="0"
            max="1200"
            step="10"
            value={currentData.rainfall}
            onChange={(e) => handleChange('rainfall', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-bold">
            <span>0</span>
            <span className="text-blue-600">{currentData.rainfall} mm</span>
            <span>1200+</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Waves className="w-4 h-4" /> Gauge Level (m)
          </label>
          <input
            type="range"
            min="0"
            max="25"
            step="0.5"
            value={currentData.waterLevel}
            onChange={(e) => handleChange('waterLevel', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-bold">
            <span>0m</span>
            <span className="text-blue-600">{currentData.waterLevel} m</span>
            <span>25m</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Waves className="w-4 h-4" /> Peak Discharge (m³/s)
          </label>
          <input
            type="range"
            min="0"
            max="40000"
            step="500"
            value={currentData.riverDischarge}
            onChange={(e) => handleChange('riverDischarge', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-bold">
            <span>0</span>
            <span className="text-blue-600">{currentData.riverDischarge.toLocaleString()}</span>
            <span>40k+</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Geospatial Context</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-tighter">Elevation (m)</label>
              <input 
                type="number" 
                value={currentData.elevation}
                onChange={(e) => handleChange('elevation', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-tighter">History (Events)</label>
              <input 
                type="number" 
                value={currentData.historicalFloods}
                onChange={(e) => handleChange('historicalFloods', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-sm font-bold"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-tighter">Primary Soil Profile</label>
            <select 
              value={currentData.soilType}
              onChange={(e) => handleChange('soilType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded bg-slate-50 text-sm font-bold"
            >
              <option>Alluvial</option>
              <option>Clayey Silt</option>
              <option>Sandy Loam</option>
              <option>Rocky</option>
              <option>Sandy</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-600 leading-tight font-medium">
              Parameters are synchronized with the <span className="font-bold text-slate-900">Flood Risk in India</span> dataset metrics. Changes update the XAI analysis engine immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;
