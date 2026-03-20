
import React, { useState, useEffect } from 'react';
import { getNitroTVLiveUpdates } from '../services/gemini';

const NitroTV: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState('F1 Main Stream');
  const [liveInfo, setLiveInfo] = useState<{update: string, sources: any[]}>({ update: '', sources: [] });
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      const data = await getNitroTVLiveUpdates(`Live ${activeChannel} 2024`);
      setLiveInfo(data);
      setLoading(false);
    };
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 60000); 
    return () => clearInterval(interval);
  }, [activeChannel]);

  const recommendedFeeds = [
    { name: 'F1 Main Stream', icon: '🏎️', viewers: '1.2M', thumb: 'https://picsum.photos/seed/f1/320/180' },
    { name: 'Onboard: Verstappen', icon: '🎥', viewers: '450K', thumb: 'https://picsum.photos/seed/vst/320/180' },
    { name: 'WRC: Rally Italia', icon: '🏁', viewers: '890K', thumb: 'https://picsum.photos/seed/wrc/320/180' },
    { name: 'Pit Lane Cam', icon: '🔧', viewers: '120K', thumb: 'https://picsum.photos/seed/pit/320/180' },
    { name: 'GT World: Spa 24h', icon: '🚗', viewers: '310K', thumb: 'https://picsum.photos/seed/spa/320/180' }
  ];

  const activeFeed = recommendedFeeds.find(f => f.name === activeChannel) || recommendedFeeds[0];

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left Column: Video & Details */}
      <div className="flex-1 space-y-4">
        {/* Main Video Player */}
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl group border border-slate-800">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 z-10">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-racing text-red-500 animate-pulse tracking-widest uppercase font-black">Syncing Nitro-Feed...</p>
            </div>
            {/* Dark gradient overlay for UI readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
          </div>
          
          {/* Top Player Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <div className="flex gap-2">
               <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm flex items-center gap-2 shadow-lg uppercase">
                 <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> Live
               </div>
               <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-sm border border-white/10 uppercase">
                 {activeChannel}
               </div>
            </div>
            <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-sm border border-white/10">
              4K ULTRA HD
            </div>
          </div>

          {/* Player Controls (Mock) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-red-500 transition-colors">
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <div className="h-1 w-48 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 w-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-white text-[10px] font-bold">LIVE</span>
                 <button className="text-white hover:text-red-500">⚙️</button>
                 <button className="text-white hover:text-red-500">⛶</button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Information Area */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-racing font-black text-white italic uppercase tracking-tight">{activeChannel} - Official Global Broadcast</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-slate-500 font-bold uppercase">{activeFeed.viewers} watching now</p>
                <span className="text-slate-700">•</span>
                <p className="text-xs text-slate-500 font-bold uppercase">Started 2h ago</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full text-xs font-black uppercase flex items-center gap-2 transition-all">
                <span>➕</span> Save
              </button>
              <button className="bg-white text-black px-6 py-2 rounded-full text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all">
                Follow Feed
              </button>
            </div>
          </div>

          {/* Description Area (AI Intelligence & Free Signals) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
            <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
               <span className="text-red-500">#F1</span>
               <span className="text-red-500">#Motorsport</span>
               <span className="text-red-500">#LiveBetting</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> AI Race Intel
                </h3>
                <div className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                  {loading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-2 bg-slate-800 rounded w-full"></div>
                      <div className="h-2 bg-slate-800 rounded w-2/3"></div>
                    </div>
                  ) : (
                    liveInfo.update
                  )}
                </div>
              </div>

              {/* Free Signals Section */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase text-green-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Watch for Free (Global Signals)
                </h3>
                <div className="space-y-2">
                  {liveInfo.sources.length > 0 ? liveInfo.sources.map((s, i) => (
                    <a 
                      key={i} 
                      href={s.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-slate-950 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 transition-all group/link"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📡</span>
                        <div>
                          <p className="text-[10px] font-bold text-white group-hover/link:text-green-400 truncate max-w-[140px]">{s.title}</p>
                          <p className="text-[8px] text-slate-500 uppercase font-black">Secure Signal</p>
                        </div>
                      </div>
                      <div className="bg-green-500/10 text-green-500 text-[9px] font-black px-3 py-1 rounded-full uppercase border border-green-500/20 group-hover/link:bg-green-500 group-hover/link:text-white transition-all">
                        Go Live
                      </div>
                    </a>
                  )) : (
                    <div className="p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl text-center">
                      <p className="text-[9px] text-slate-600 italic uppercase font-black">Searching for clear frequency...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Suggested Feeds (Sidebar) */}
      <div className="w-full xl:w-96 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-black uppercase text-slate-500 tracking-widest italic">Related Feeds</h2>
          <div className="flex gap-2">
            <button className="text-[10px] font-black uppercase text-red-500 hover:underline">Autoplay</button>
          </div>
        </div>

        <div className="space-y-4">
          {recommendedFeeds.map((feed) => (
            <button
              key={feed.name}
              onClick={() => setActiveChannel(feed.name)}
              className={`flex gap-3 w-full text-left group transition-all p-1 rounded-xl ${
                activeChannel === feed.name ? 'bg-slate-900 border border-slate-800 ring-1 ring-red-500/20' : 'hover:bg-slate-900/40'
              }`}
            >
              <div className="relative flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                <img src={feed.thumb} alt={feed.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                <div className="absolute bottom-1 right-1 bg-black/80 text-[8px] text-white px-1 rounded font-bold">LIVE</div>
                {activeChannel === feed.name && (
                   <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                      <span className="text-white text-xs animate-pulse">Playing</span>
                   </div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className={`text-[11px] font-bold truncate transition-colors ${
                  activeChannel === feed.name ? 'text-red-500' : 'text-white group-hover:text-red-400'
                }`}>
                  {feed.name}
                </h3>
                <p className="text-[9px] text-slate-500 font-black uppercase mt-0.5 tracking-tighter">Nitro Sports Official</p>
                <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">{feed.viewers} views</p>
                {activeChannel === feed.name && (
                   <div className="flex items-center gap-1 mt-1">
                      <span className="w-1 h-1 bg-red-600 rounded-full animate-ping"></span>
                      <span className="text-[8px] font-black text-red-500 uppercase italic">Signal Locked</span>
                   </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Live "Chat" / AI Commentary simulation for engagement */}
        <div className="mt-8 border-t border-slate-800 pt-6">
           <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 italic">Nitro Broadcast Chat</h3>
           <div className="bg-slate-950 border border-slate-800 rounded-2xl h-64 flex flex-col overflow-hidden">
              <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
                 <div className="flex gap-2">
                    <span className="text-[9px] font-black text-red-500">Moderator:</span>
                    <p className="text-[9px] text-slate-400 leading-tight">Welcome to the F1 Japanese GP! Keep bets responsible. 🏎️💨</p>
                 </div>
                 <div className="flex gap-2">
                    <span className="text-[9px] font-black text-indigo-400">AI Strategist:</span>
                    <p className="text-[9px] text-slate-400 leading-tight">Pit window opening soon. Watch for the undercut from McLaren. 📊</p>
                 </div>
                 <div className="flex gap-2">
                    <span className="text-[9px] font-black text-slate-500">Fan44:</span>
                    <p className="text-[9px] text-slate-400 leading-tight">Verstappen looks unbeatable today.</p>
                 </div>
              </div>
              <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                 <input 
                  type="text" 
                  disabled
                  placeholder="Chat restricted to active stakers..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[9px] text-slate-600 italic focus:outline-none"
                />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NitroTV;
