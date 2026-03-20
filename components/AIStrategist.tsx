
import React, { useState, useEffect } from 'react';
import { getGroundedStrategyInsight, getTrackIntel } from '../services/gemini';
import { Driver } from '../types';

interface AIStrategistProps {
  drivers: Driver[];
}

const AIStrategist: React.FC<AIStrategistProps> = ({ drivers }) => {
  const [strategy, setStrategy] = useState<{text: string, sources: any[]}>({ text: '', sources: [] });
  const [trackIntel, setTrackIntel] = useState<{text: string, sources: any[]}>({ text: '', sources: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntel = async () => {
      setLoading(true);
      const driverNames = drivers.map(d => d.name).join(', ');
      
      const [strat, intel] = await Promise.all([
        getGroundedStrategyInsight("Japanese Grand Prix at Suzuka", driverNames),
        getTrackIntel("Suzuka International Racing Course")
      ]);
      
      setStrategy(strat);
      setTrackIntel(intel);
      setLoading(false);
    };

    fetchIntel();
  }, [drivers]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-xs">🔍</div>
            <h2 className="font-racing text-[10px] font-bold uppercase tracking-widest text-indigo-400">Search Grounded Intel</h2>
          </div>
          <span className="text-[8px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">LIVE WEB</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-slate-800 rounded w-4/5"></div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-200 leading-relaxed italic mb-4">{strategy.text}</p>
            <div className="flex flex-wrap gap-2">
              {strategy.sources.slice(0, 2).map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] text-indigo-400 underline truncate max-w-[150px]">
                  Source: {s.title}
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-xs">📍</div>
            <h2 className="font-racing text-[10px] font-bold uppercase tracking-widest text-emerald-400">Map Grounded Specs</h2>
          </div>
          <span className="text-[8px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">GEO INTEL</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-slate-800 rounded w-full"></div>
            <div className="h-3 bg-slate-800 rounded w-4/5"></div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-200 leading-relaxed italic mb-4">{trackIntel.text.substring(0, 100)}...</p>
            <div className="flex flex-wrap gap-2">
              {trackIntel.sources.slice(0, 2).map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] text-emerald-400 underline truncate max-w-[150px]">
                  Maps: {s.title}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIStrategist;
