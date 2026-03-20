
import React, { useState } from 'react';
import { Driver } from '../types';

interface DriverCardProps {
  driver: Driver;
  onBet: (driver: Driver, stake: number) => void;
}

const DriverCard: React.FC<DriverCardProps> = ({ driver, onBet }) => {
  const [stake, setStake] = useState<number>(100);
  const [showHistory, setShowHistory] = useState(false);

  const handleBetClick = () => {
    if (stake > 0) {
      onBet(driver, stake);
    }
  };

  const diff = driver.odds - driver.lastOdds;
  const percentChange = (diff / driver.lastOdds) * 100;
  const isOddsShortening = diff < 0; // Lower odds = more likely/favored
  const isOddsDrifting = diff > 0;    // Higher odds = less favored

  const intensity = Math.max(0, Math.min(1, (20 - driver.odds) / 19));

  const renderNameTrend = () => {
    switch (driver.trend) {
      case 'up':
        return <span className="text-red-500 text-[10px] animate-bounce" title="Odds Drifting (Up)">▲</span>;
      case 'down':
        return <span className="text-green-500 text-[10px] animate-bounce" title="Odds Shortening (Down)">▼</span>;
      default:
        return <span className="text-slate-600 text-[10px]" title="Odds Stable">▬</span>;
    }
  };

  // SVG Sparkline calculation
  const generateSparkline = () => {
    if (!driver.oddsHistory || driver.oddsHistory.length === 0) return null;
    
    const min = Math.min(...driver.oddsHistory);
    const max = Math.max(...driver.oddsHistory);
    const range = max - min || 1;
    const width = 200;
    const height = 40;
    const padding = 5;

    const points = driver.oddsHistory.map((val, i) => {
      const x = (i / (driver.oddsHistory.length - 1)) * (width - padding * 2) + padding;
      // Invert Y because SVG coordinates start from top
      const y = height - (((val - min) / range) * (height - padding * 2) + padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mt-2 overflow-visible">
        <defs>
          <linearGradient id={`grad-${driver.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: isOddsShortening ? '#22c55e' : '#ef4444', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: 'transparent', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={isOddsShortening ? '#22c55e' : isOddsDrifting ? '#ef4444' : '#64748b'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-[0_0_3px_rgba(239,68,68,0.3)]"
        />
        <path
          d={`M ${points} L ${(width - padding)},${height} L ${padding},${height} Z`}
          fill={`url(#grad-${driver.id})`}
        />
      </svg>
    );
  };

  return (
    <div 
      className="group relative border border-slate-800 rounded-xl p-4 transition-all hover:border-red-500/50 overflow-hidden shadow-lg"
      style={{
        background: `radial-gradient(circle at 70% -20%, rgba(220, 38, 38, ${intensity * 0.15}), transparent), #0f172a`,
      }}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none carbon-bg"></div>

      <div className="absolute top-0 right-0 p-2 z-10 flex gap-2">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase transition-all ${
            showHistory 
            ? 'bg-red-600 border-red-500 text-white' 
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          {showHistory ? 'Hide Intel' : 'Telemetry'}
        </button>
        {driver.trend === 'up' && (
          <div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            <span className="text-red-500 animate-pulse text-[10px]">▲</span>
            <span className="text-red-400 text-[8px] font-black uppercase">Drifting</span>
          </div>
        )}
        {driver.trend === 'down' && (
          <div className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
            <span className="text-green-500 animate-pulse text-[10px]">▼</span>
            <span className="text-green-400 text-[8px] font-black uppercase">Shortening</span>
          </div>
        )}
      </div>

      <div className="flex gap-4 items-center flex-wrap sm:flex-nowrap relative z-10">
        <div className="relative">
          <img 
            src={driver.img} 
            alt={driver.name} 
            className="w-16 h-16 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all border border-slate-700 shadow-xl"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center">
            <span className="text-[8px] font-bold text-slate-500">#</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-[120px]">
          <div className="flex items-center gap-2">
            <h3 className="font-racing text-sm font-bold tracking-tight text-white leading-tight uppercase italic">{driver.name}</h3>
            {renderNameTrend()}
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{driver.team}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex-1 sm:flex-none">
            <label className="block text-[8px] text-slate-500 uppercase font-black mb-1 ml-1 tracking-tighter">Stake Amount</label>
            <div className="relative group/input">
               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-[10px]">$</span>
               <input 
                type="number" 
                min="1"
                value={stake} 
                onChange={(e) => setStake(Math.max(1, parseInt(e.target.value) || 0))}
                className="bg-slate-950/80 border border-slate-700 rounded-lg pl-5 pr-2 py-2 w-full sm:w-24 text-xs font-bold text-white focus:outline-none focus:border-red-500 transition-colors shadow-inner"
              />
            </div>
          </div>

          <button 
            onClick={handleBetClick}
            className="bg-slate-800/80 hover:bg-red-600 border border-slate-700 hover:border-red-500 rounded-lg px-4 py-2 flex flex-col items-center justify-center transition-all group-hover:scale-105 min-w-[100px] shadow-2xl relative overflow-hidden"
          >
            <span className="text-[8px] text-slate-400 group-hover:text-white/80 font-black uppercase tracking-tighter mb-0.5">BET NOW @</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-racing font-black text-white">{driver.odds.toFixed(2)}</span>
            </div>
            
            <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 transition-colors ${
              isOddsShortening ? 'text-green-400' : isOddsDrifting ? 'text-red-400' : 'text-slate-500'
            }`}>
              {percentChange !== 0 ? (
                <span>
                  {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% 
                </span>
              ) : (
                'Stable'
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Historical Telemetry Display */}
      {showHistory && (
        <div className="mt-4 pt-4 border-t border-slate-800/50 animate-fade-in relative z-10">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Historical Odds Trend (Last 10 Events)</p>
            <p className="text-[8px] text-slate-600 font-bold uppercase italic">Telemetry Alpha v2.4</p>
          </div>
          <div className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
            {generateSparkline()}
            <div className="flex justify-between text-[7px] text-slate-600 font-black uppercase mt-1 tracking-tighter">
              <span>Event -10</span>
              <span>Current</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 h-1 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 relative z-10">
        <div 
          className={`h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(239,68,68,0.5)] ${
            isOddsShortening ? 'bg-green-500 w-3/4' : isOddsDrifting ? 'bg-red-500 w-1/4' : 'bg-red-600 w-1/2'
          }`}
          style={{ width: `${Math.min(100, Math.max(10, (1/driver.odds) * 100))}%` }}
        ></div>
      </div>
    </div>
  );
};

export default DriverCard;
