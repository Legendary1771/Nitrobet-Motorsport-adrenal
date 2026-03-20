
import React, { useState, useEffect, useMemo } from 'react';
import { CATEGORIES, MOCK_DRIVERS, MOCK_RACES, MOCK_RESULTS, MOCK_USER } from './constants';
import { Category, Driver, Bet, BetType, User, TransactionType, UserStake, UserSettings } from './types';
import DriverCard from './components/DriverCard';
import BetSlip from './components/BetSlip';
import AIStrategist from './components/AIStrategist';
import RaceResults from './components/RaceResults';
import AccountModal from './components/AccountModal';
import LiveComms from './components/LiveComms';
import ChatBot from './components/ChatBot';
import NitroTV from './components/NitroTV';
import { getLightningSummary } from './services/gemini';

type SortOrder = 'none' | 'asc' | 'desc';
type BottomView = 'upcoming' | 'results';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('F1');
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [user, setUser] = useState<User>(MOCK_USER);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  const [bottomView, setBottomView] = useState<BottomView>('upcoming');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [lightningSummary, setLightningSummary] = useState('');
  const [isLightningLoading, setIsLightningLoading] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);

  // Simulation loop for odds
  useEffect(() => {
    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => {
        const shouldMove = Math.random() < 0.6;
        if (!shouldMove) return d;
        const isVolatile = Math.random() < 0.1;
        const baseChangeRange = isVolatile ? 0.8 : 0.12;
        const oddsWeight = d.odds < 3 ? 0.5 : d.odds < 10 ? 1 : 2;
        const change = (Math.random() - 0.5) * baseChangeRange * oddsWeight;
        let newOdds = d.odds + change;
        newOdds = Math.max(1.01, Math.min(500, newOdds));
        return {
          ...d,
          lastOdds: d.odds,
          odds: newOdds,
          trend: newOdds > d.odds ? 'up' : newOdds < d.odds ? 'down' : 'stable'
        };
      }));
    }, 2500);

    // Listen for quota errors from service layer
    const handleQuota = () => setShowQuotaWarning(true);
    window.addEventListener('nitrobet:quota_exceeded', handleQuota);

    return () => {
      clearInterval(interval);
      window.removeEventListener('nitrobet:quota_exceeded', handleQuota);
    };
  }, []);

  const sortedDrivers = useMemo(() => {
    const list = [...drivers];
    if (sortOrder === 'asc') return list.sort((a, b) => a.odds - b.odds);
    if (sortOrder === 'desc') return list.sort((a, b) => b.odds - a.odds);
    return list;
  }, [drivers, sortOrder]);

  const handleLightningAnalysis = async () => {
    setIsLightningLoading(true);
    const summary = await getLightningSummary(drivers.map(d => d.name).join(', '));
    setLightningSummary(summary || "No fast intel.");
    setIsLightningLoading(false);
  };

  const handleUpgradeKey = async () => {
    // @ts-ignore - window.aistudio is provided by the environment
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setShowQuotaWarning(false);
      // Logic to restart current processes could go here
      window.location.reload(); // Simplest way to re-initialize with the new key
    } else {
      alert("Please upgrade to a paid Gemini API key for higher groundings quota (ai.google.dev/gemini-api/docs/billing)");
    }
  };

  const handleBetSelect = (driver: Driver, stake: number) => {
    if (user.balance < stake) {
      alert("Insufficient funds!");
      return;
    }
    const defaultType: BetType = 'Race Winner';
    const currentOdds = driver.odds;
    
    const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
    const randomHistory: ('up' | 'down' | 'stable')[] = [
      driver.trend,
      trends[Math.floor(Math.random() * trends.length)],
      trends[Math.floor(Math.random() * trends.length)]
    ];

    const newBet: Bet = {
      id: Math.random().toString(36).substr(2, 9),
      driverName: driver.name,
      odds: currentOdds,
      stake: stake,
      toWin: currentOdds * stake,
      timestamp: Date.now(),
      trend: driver.trend,
      trendHistory: randomHistory,
      betType: defaultType,
      isAnonymous: user.settings.ghostMode
    };
    setActiveBets(prev => [...prev, newBet]);
  };

  const handlePlaceBets = () => {
    const totalStake = activeBets.reduce((acc, b) => acc + b.stake, 0);
    if (user.balance < totalStake) return;
    setUser(prev => ({
      ...prev,
      balance: prev.balance - totalStake,
      stakes: [...activeBets.map(b => ({...b, status: 'active' as const})), ...prev.stakes]
    }));
    setActiveBets([]);
  };

  const updateBetType = (id: string, type: BetType) => {
    setActiveBets(prev => prev.map(b => b.id === id ? { ...b, betType: type } : b));
  };

  const toggleAnonymous = (id: string) => {
    setActiveBets(prev => prev.map(b => b.id === id ? { ...b, isAnonymous: !b.isAnonymous } : b));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row max-w-[1600px] mx-auto relative overflow-hidden bg-slate-950">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-20 bg-slate-950 border-r border-slate-900 flex flex-row lg:flex-col items-center py-4 lg:py-8 gap-6 px-4 lg:px-0 sticky top-0 z-50">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-black italic text-xl shadow-lg shadow-red-500/20 transform rotate-[-10deg]">N</div>
        <div className="flex flex-row lg:flex-col gap-6 flex-1 items-center">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id as Category)} className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${selectedCategory === cat.id ? 'bg-slate-800 text-white border border-red-500/50' : 'text-slate-500 hover:text-slate-300'}`}>{cat.icon}</button>
          ))}
        </div>
        <button onClick={() => setIsAccountOpen(true)} className={`w-12 h-12 rounded-full border-2 overflow-hidden transition-all ${user.settings.ghostMode ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-slate-800'}`}>
          <img src={user.avatar} alt="User" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 space-y-8 overflow-y-auto max-h-screen">
        {/* Quota Warning Banner */}
        {showQuotaWarning && (
          <div className="bg-red-950/80 border border-red-500/50 p-4 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">Grounding Quota Exhausted</p>
                <p className="text-[10px] text-red-400 font-medium">Platform limits reached for Search & Maps intel. Use your own API key to bypass.</p>
              </div>
            </div>
            <button 
              onClick={handleUpgradeKey}
              className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-all shadow-lg"
            >
              Upgrade Key Path
            </button>
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-5xl font-racing font-black tracking-tighter italic uppercase text-white">Nitro<span className="text-red-600">Bet</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic flex items-center gap-2">
              {user.settings.ghostMode ? <span className="text-indigo-500 animate-pulse">🔒 SECURE GHOST SESSION ACTIVE</span> : "Precision. Adrenaline. Profits."}
            </p>
          </div>
          <button onClick={() => setIsAccountOpen(true)} className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-2 rounded-2xl pr-6 shadow-xl hover:bg-slate-800 transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${user.settings.ghostMode ? 'bg-indigo-600 text-white' : 'bg-green-600/20 text-green-500'}`}>$</div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Balance</p>
              <p className="text-lg font-racing font-black text-white">${user.balance.toLocaleString()}</p>
            </div>
          </button>
        </header>

        {/* Live Broadcast Feature (NitroTV) */}
        <NitroTV />

        {/* AI Powered Strategist Hub */}
        <AIStrategist drivers={drivers} />

        {/* Rapid Analysis Toggle */}
        <section className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="bg-red-600 p-2 rounded-lg text-white font-black text-[10px] animate-pulse">SPEED-MODE</div>
             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
               {isLightningLoading ? "Querying Flash-Lite Model..." : lightningSummary || "No active lightning analysis"}
             </p>
          </div>
          <button 
            onClick={handleLightningAnalysis}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-white transition-all shadow-lg"
          >
            Run Rapid Intel
          </button>
        </section>

        {/* Driver Odds Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="font-racing text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-6 bg-red-600"></span> Live Driver Odds
            </h2>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
               <button onClick={() => setSortOrder('none')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${sortOrder === 'none' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>Default</button>
               <button onClick={() => setSortOrder('asc')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${sortOrder === 'asc' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>Lowest</button>
               <button onClick={() => setSortOrder('desc')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${sortOrder === 'desc' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}>Highest</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedDrivers.map(driver => (
              <DriverCard key={driver.id} driver={driver} onBet={handleBetSelect} />
            ))}
          </div>
        </section>

        {/* Bottom Tabs: Results & Upcoming */}
        <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 shadow-xl">
           <div className="flex items-center gap-6 mb-6 border-b border-slate-800 pb-4">
             <button onClick={() => setBottomView('upcoming')} className={`font-racing text-xs font-black uppercase tracking-[0.2em] relative ${bottomView === 'upcoming' ? 'text-white' : 'text-slate-600'}`}>Coming Fast {bottomView === 'upcoming' && <span className="absolute -bottom-[17px] left-0 w-full h-0.5 bg-red-600"></span>}</button>
             <button onClick={() => setBottomView('results')} className={`font-racing text-xs font-black uppercase tracking-[0.2em] relative ${bottomView === 'results' ? 'text-white' : 'text-slate-600'}`}>Race Results {bottomView === 'results' && <span className="absolute -bottom-[17px] left-0 w-full h-0.5 bg-red-600"></span>}</button>
           </div>
           {bottomView === 'upcoming' ? (
             <div className="space-y-4">
               {MOCK_RACES.filter(r => r.status !== 'Live').map(race => (
                 <div key={race.id} className="flex items-center justify-between p-3 border-b border-slate-800 last:border-0">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">{race.category}</div>
                     <div><p className="text-sm font-bold text-white">{race.title}</p><p className="text-[10px] text-slate-500 uppercase">{race.location}</p></div>
                   </div>
                   <p className="text-xs font-racing text-red-500/80">{race.date}</p>
                 </div>
               ))}
             </div>
           ) : (
             <RaceResults results={MOCK_RESULTS} />
           )}
        </section>
      </main>

      {/* Right Sidebar: Betting Slip & Comms */}
      <aside className="w-full lg:w-[400px] p-4 lg:p-8 bg-slate-950 border-l border-slate-900 sticky top-0 h-fit lg:h-screen lg:overflow-y-auto">
        <div className="space-y-8">
          <LiveComms />
          <BetSlip 
            bets={activeBets} 
            onRemoveBet={(id) => setActiveBets(prev => prev.filter(b => b.id !== id))} 
            onUpdateBetType={updateBetType}
            onToggleAnonymous={toggleAnonymous}
            onClear={() => setActiveBets([])} 
          />
          {activeBets.length > 0 && (
            <button 
              onClick={handlePlaceBets}
              className={`w-full py-4 rounded-xl font-racing font-black italic uppercase tracking-widest transition-all ${activeBets.some(b => b.isAnonymous) || user.settings.ghostMode ? 'bg-indigo-600 shadow-indigo-500/50 shadow-lg' : 'bg-red-600 glow-red'}`}
            >
              {activeBets.some(b => b.isAnonymous) || user.settings.ghostMode ? 'LOCK ANONYMOUS' : 'LOCK IN STAKES'}
            </button>
          )}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">E2EE NETWORK STATUS</p>
            <div className="flex justify-center gap-2 my-4">
               <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse"></span>
               <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse delay-75"></span>
               <span className="w-1 h-3 bg-green-500 rounded-full animate-pulse delay-150"></span>
            </div>
            <p className="text-[9px] text-slate-400 leading-relaxed italic uppercase">Nodes: 14 | Latency: 4ms | Encrypted: AES-256</p>
          </div>
        </div>
      </aside>

      {/* Floating Chatbot Assistant */}
      <ChatBot />
      {isAccountOpen && <AccountModal user={user} onClose={() => setIsAccountOpen(false)} onAction={(t, a) => console.log(t, a)} onUpdateSettings={(s) => setUser(p => ({...p, settings: {...p.settings, ...s}}))} />}
    </div>
  );
};

export default App;
