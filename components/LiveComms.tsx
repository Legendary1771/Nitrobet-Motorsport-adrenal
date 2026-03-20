
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

const LiveComms: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new AudioContext({ sampleRate: 16000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              let binary = '';
              const bytes = new Uint8Array(int16.buffer);
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
              
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            if (msg.serverContent?.outputTranscription) {
              setTranscription(prev => prev + ' ' + msg.serverContent.outputTranscription.text);
            }
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const buffer = await decodeAudioData(decode(audioData), audioContextRef.current);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => setIsActive(false),
          onerror: (e) => console.error("Live API Error", e)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: "You are the Pit Wall Engineer for NitroBet. Keep it professional, urgent, and technical. Use racing terminology like 'box box', 'delta', and 'undercut'."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    setIsActive(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase text-red-500 tracking-widest">NitroComms PIT-RADIO</h3>
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
      </div>
      
      <div className="h-16 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
        {isActive ? (
          <div className="flex gap-1 items-end h-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-1 bg-red-600 rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random()}s` }}></div>
            ))}
          </div>
        ) : (
          <span className="text-[8px] text-slate-600 uppercase font-black">Link Standby</span>
        )}
      </div>

      <button 
        onClick={isActive ? stopSession : startSession}
        className={`w-full py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isActive ? 'bg-slate-800 text-red-400' : 'bg-red-600 text-white'}`}
      >
        {isActive ? 'Disconnect Radio' : 'Connect to Pit Wall'}
      </button>

      {transcription && (
        <div className="text-[9px] text-slate-400 italic max-h-12 overflow-hidden truncate px-1">
          {transcription}
        </div>
      )}
    </div>
  );
};

export default LiveComms;
