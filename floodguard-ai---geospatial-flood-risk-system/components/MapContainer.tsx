
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FloodDataPoint, RiskLevel } from '../types';
import { predictFloodRisk } from '../services/mlEngine';
import { Search, Loader2, MapPin, Navigation, LocateFixed, Target } from 'lucide-react';

interface Props {
  data: FloodDataPoint[];
  selectedPoint: FloodDataPoint;
  onSelectPoint: (point: FloodDataPoint) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

const MapContainer: React.FC<Props> = ({ data, selectedPoint, onSelectPoint, onMapClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const onMapClickRef = useRef(onMapClick);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Keep ref updated to avoid re-binding map events too often
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([20.5937, 78.9629], 5);

    const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    });

    lightLayer.addTo(mapRef.current);

    const baseLayers = {
      "Standard View": lightLayer,
      "Satellite Terrain": satelliteLayer
    };

    L.control.layers(baseLayers, {}, { position: 'topleft' }).addTo(mapRef.current);

    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.closePopup();
    
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    data.forEach(point => {
      const pred = predictFloodRisk(point);
      const isSelected = point.id === selectedPoint.id;
      const isCustom = point.id.startsWith('custom-');

      const color = isSelected ? '#2563eb' : 
                    pred.riskLevel === RiskLevel.HIGH ? '#ef4444' : 
                    pred.riskLevel === RiskLevel.MEDIUM ? '#f97316' : '#10b981';

      const riskClass = pred.riskLevel === RiskLevel.HIGH ? 'text-red-600' : 
                        pred.riskLevel === RiskLevel.MEDIUM ? 'text-orange-600' : 'text-emerald-600';

      const popupContent = `
        <div style="min-width: 200px; font-family: sans-serif; padding: 4px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            ${point.locationName} ${isCustom ? '(Custom Zone)' : ''}
          </h3>
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Current Hazard</span>
              <span class="${riskClass}" style="font-size: 11px; font-weight: 800; text-transform: uppercase;">${pred.riskLevel}</span>
            </div>
            <div style="height: 6px; width: 100%; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${pred.riskScore}%; background: ${color};"></div>
            </div>
          </div>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: 8px;">
            <tr>
              <td style="color: #64748b; padding: 2px 0;">Coordinates</td>
              <td style="text-align: right; font-weight: 600; color: #334155;">${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;">Rainfall Index</td>
              <td style="text-align: right; font-weight: 600; color: #334155;">${point.rainfall} mm</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;">Dominant Risk</td>
              <td style="text-align: right; font-weight: 600; color: #334155;">${pred.featureImportance[0].name}</td>
            </tr>
          </table>
        </div>
      `;

      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: isSelected ? 12 : 8,
        fillColor: color,
        color: isSelected ? '#1e40af' : '#fff',
        weight: isSelected ? 3 : 1.5,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.addTo(mapRef.current!)
        .on('mousedown', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectPoint(point);
        })
        .bindPopup(popupContent, {
          className: 'flood-risk-popup',
          closeButton: false,
          offset: [0, -5]
        });

      if (isSelected) {
        setTimeout(() => {
          if (marker && mapRef.current && mapRef.current.hasLayer(marker)) {
            marker.openPopup();
          }
        }, 100);
      }

      markersRef.current.push(marker);
    });

  }, [data, selectedPoint.id, onSelectPoint]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Enhanced geocoding query to favor local administrative areas
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=3`);
      const results = await response.json();

      if (results && results.length > 0) {
        const result = results[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);

        // If Nominatim provides a boundingbox, use it to fit the map view perfectly to the town/locality
        if (result.boundingbox) {
          const bbox = result.boundingbox.map(Number);
          mapRef.current.flyToBounds([[bbox[0], bbox[2]], [bbox[1], bbox[3]]], {
            duration: 2,
            padding: [50, 50]
          });
        } else {
          mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.5 });
        }

        // Initialize automated analysis for this coordinate
        if (onMapClickRef.current) {
          onMapClickRef.current(latitude, longitude);
        }
        setSearchQuery('');
      } else {
        setSearchError('Locality not found. Try adding a city or state name.');
      }
    } catch (err) {
      setSearchError('Search offline or rate-limited.');
    } finally {
      setIsSearching(false);
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current?.flyTo([latitude, longitude], 15, { duration: 2 });
        if (onMapClickRef.current) {
          onMapClickRef.current(latitude, longitude);
        }
        setIsLocating(false);
      },
      () => {
        setSearchError('Geolocation access denied.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[450px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      <style>
        {`
          .flood-risk-popup .leaflet-popup-content-wrapper { border-radius: 12px; padding: 8px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
          .flood-risk-popup .leaflet-popup-tip { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
          .leaflet-control-layers { border: 1px solid #e2e8f0 !important; border-radius: 8px !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase; padding: 4px; }
        `}
      </style>
      
      {/* Precision Search Console */}
      <div className="absolute top-4 left-14 right-4 z-[1000] flex flex-col items-end gap-2 pointer-events-none">
        <div className="flex gap-2 w-full max-w-md pointer-events-auto">
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter town, village, or locality name..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-bold text-slate-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
            />
            <div className="absolute left-3 top-3">
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              )}
            </div>
            {searchError && (
              <div className="absolute top-full mt-2 w-full bg-red-600 text-white text-[10px] font-black px-3 py-2 rounded-lg shadow-xl animate-bounce">
                {searchError.toUpperCase()}
              </div>
            )}
          </form>

          <button 
            onClick={locateMe}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center border border-blue-500"
            title="Locate Me"
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full cursor-crosshair" />
      
      {/* Interface Feedback */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-[10px] font-black text-slate-700 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-600" />
          <span>REAL-TIME GEOSPATIAL ANALYSIS ENABLED</span>
        </div>
      </div>

      {/* Professional Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-200 z-[1000] text-[10px] min-w-[160px]">
        <h4 className="font-black mb-3 uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Navigation className="w-3 h-3" /> Risk Layers
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-900 font-bold">Severe Hazard</span>
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-700 shadow-sm shadow-red-200"></span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-900 font-bold">Moderate Alert</span>
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-orange-700 shadow-sm shadow-orange-200"></span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-900 font-bold">Stable Zone</span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-700 shadow-sm shadow-emerald-200"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
