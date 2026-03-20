
import React, { useState } from 'react';
import { askTheSpotter } from '../services/gemini';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isBot: boolean}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setLoading(true);
    
    try {
      const response = await askTheSpotter(userMsg);
      setMessages(prev => [...prev, { text: response || "Analysis failed.", isBot: true }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Signal lost.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="w-80 h-96 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl animate-fade-in overflow-hidden">
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔭</span>
              <h3 className="font-racing text-xs font-black uppercase text-white tracking-widest">The Spotter</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg text-[10px] ${m.isBot ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-red-600 text-white rounded-tr-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-[8px] text-slate-500 animate-pulse uppercase font-black">Analyzing Data...</div>}
          </div>

          <div className="p-3 bg-slate-950 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for strategy..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-white focus:outline-none focus:border-red-500"
            />
            <button onClick={handleSend} className="bg-red-600 text-white p-2 rounded-lg">🚀</button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform group border-4 border-slate-950"
        >
          <span className="text-2xl group-hover:animate-bounce">🔭</span>
        </button>
      )}
    </div>
  );
};

export default ChatBot;
