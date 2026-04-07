
import React from 'react';
import { FloodDataPoint, RiskLevel } from '../types';
import { predictFloodRisk } from '../services/mlEngine';
import { MapPin, ChevronRight } from 'lucide-react';

interface Props {
  locations: FloodDataPoint[];
  selectedId: string;
  onSelect: (point: FloodDataPoint) => void;
}

const LocationSelector: React.FC<Props> = ({ locations, selectedId, onSelect }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Risk Area</h3>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {locations.map((loc) => {
          const pred = predictFloodRisk(loc);
          const isSelected = loc.id === selectedId;
          
          const riskColor = pred.riskLevel === RiskLevel.HIGH ? 'text-red-500' : 
                           pred.riskLevel === RiskLevel.MEDIUM ? 'text-orange-500' : 'text-emerald-500';
          
          return (
            <button
              key={loc.id}
              onClick={() => onSelect(loc)}
              className={`w-full text-left p-4 flex items-center justify-between border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <p className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{loc.locationName}</p>
                  <p className={`text-[10px] font-bold uppercase ${riskColor}`}>{pred.riskLevel} Risk</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LocationSelector;
