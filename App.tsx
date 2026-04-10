
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, MessageRole, VoiceState, NeuralCore } from './types';
import { FRIDAY_SYSTEM_INSTRUCTION, CORE_CONFIGS, MODELS } from './constants';
import { decode, decodeAudioData } from './audioUtils';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import HUDOverlay from './components/HUDOverlay';
import VoiceInterface from './components/VoiceInterface';
import SecurityDashboard from './components/SecurityDashboard';

const CORE_VOICES: Record<NeuralCore, string> = {
  FRIDAY: 'Kore',
  DEEPSEEK: 'Kore',
  GPT4: 'Kore',
  GEMINI: 'Kore',
  BOLT: 'Kore',
  ULTRON: 'Fenrir',
  JARVIS: 'Kore',
  VISION: 'Zephyr'
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCore, setActiveCore] = useState<NeuralCore>('FRIDAY');
  const [speechRate, setSpeechRate] = useState(1.3);
  const [pendingImagePrompt, setPendingImagePrompt] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isActive: false,
    isListening: false,
    isSpeaking: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTTSNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const welcome: Message = {
      id: '1',
      role: MessageRole.FRIDAY,
      text: "Systems are green, Boss. All Neural Cores are standing by and ready for deployment. Which processing unit should I initialize for you today?",
      timestamp: Date.now(),
      core: 'FRIDAY'
    };
    setMessages([welcome]);
  }, []);

  const speakText = async (text: string) => {
    if (voiceState.isActive) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      if (currentTTSNodeRef.current) {
        try { currentTTSNodeRef.current.stop(); } catch (e) {}
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: MODELS.TTS,
        contents: [{ parts: [{ text: `Speak professionally as an AI assistant: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: CORE_VOICES[activeCore] },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = speechRate;
        source.connect(ctx.destination);
        
        currentTTSNodeRef.current = source;
        source.start();
        
        setVoiceState(prev => ({ ...prev, isSpeaking: true }));
        source.onended = () => {
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
        };
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }
  };

  const handleSendMessage = async (text: string, isFromVoice: boolean = false) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    
    if (!isFromVoice) {
      setIsLoading(true);
      const fridayMessageId = (Date.now() + 1).toString();
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const coreConfig = CORE_CONFIGS[activeCore];
        
        const responseStream = await ai.models.generateContentStream({
          model: MODELS.CHAT,
          contents: text,
          config: {
            systemInstruction: `${FRIDAY_SYSTEM_INSTRUCTION}\n\nACTIVE CORE PROTOCOL: ${coreConfig.instruction}`,
            temperature: 0.8,
            tools: [{ googleSearch: {} }]
          },
        });

        setMessages(prev => [...prev, {
          id: fridayMessageId,
          role: MessageRole.FRIDAY,
          text: "",
          timestamp: Date.now(),
          core: activeCore
        }]);

        let fullText = "";
        let groundingUrls: string[] = [];
        let firstChunkReceived = false;

        for await (const chunk of responseStream) {
          if (!firstChunkReceived) {
            setIsLoading(false);
            firstChunkReceived = true;
          }
          
          fullText += chunk.text || "";
          
          const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
          if (groundingMetadata?.groundingChunks) {
            const urls = groundingMetadata.groundingChunks
              .map((c: any) => c.web?.uri)
              .filter(Boolean);
            groundingUrls = [...new Set([...groundingUrls, ...urls])];
          }

          setMessages(prev => prev.map(m => 
            m.id === fridayMessageId ? { ...m, text: fullText } : m
          ));
        }

        if (groundingUrls.length > 0) {
          const sourcesText = "\n\n**Data Sources Analyzed:**\n" + Array.from(new Set(groundingUrls)).map(url => `- ${url}`).join('\n');
          const finalFullText = fullText + sourcesText;
          setMessages(prev => prev.map(m => 
            m.id === fridayMessageId ? { ...m, text: finalFullText } : m
          ));
          speakText(fullText);
        } else {
          speakText(fullText);
        }

      } catch (error) {
        console.error("Streaming Error:", error);
        setMessages(prev => {
          const exists = prev.some(m => m.id === fridayMessageId);
          if (exists) {
            return prev.map(m => m.id === fridayMessageId ? { ...m, text: "I'm sorry Boss, my connection just dropped. I'll try to re-establish the link." } : m);
          } else {
            return [...prev, {
              id: fridayMessageId,
              role: MessageRole.FRIDAY,
              text: "Critical failure in the processing uplink. I'm working on a workaround, Boss.",
              timestamp: Date.now(),
              core: 'FRIDAY'
            }];
          }
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVoiceTranscriptionUpdate = useCallback((id: string, role: MessageRole, text: string) => {
    setMessages(prev => {
      const exists = prev.find(m => m.id === id);
      if (exists) {
        return prev.map(m => m.id === id ? { ...m, text } : m);
      } else {
        return [...prev, {
          id,
          role,
          text,
          timestamp: Date.now(),
          core: role === MessageRole.FRIDAY ? activeCore : undefined
        }];
      }
    });
  }, [activeCore]);

  const handleGenerateImage = async () => {
    if (!pendingImagePrompt) return;
    const prompt = pendingImagePrompt;
    setPendingImagePrompt(null);
    setIsLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: MODELS.IMAGE,
        contents: { parts: [{ text: `Generate a high-tech visual: ${prompt}` }] }
      });
      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }
      if (imageUrl) {
        const msgText = `Asset rendered successfully for: ${prompt}`;
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: MessageRole.FRIDAY,
          text: msgText,
          type: 'image',
          mediaUrl: imageUrl,
          timestamp: Date.now(),
          core: activeCore
        }]);
        speakText(msgText);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full flex overflow-hidden bg-slate-950 text-cyan-50">
      <HUDOverlay color={CORE_CONFIGS[activeCore].color} />
      <div className="scanline"></div>

      {/* Confirmation Dialog */}
      {pendingImagePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPendingImagePrompt(null)}></div>
          <div className="relative glass w-full max-w-md border-2 border-cyan-500/40 p-6 shadow-[0_0_50px_rgba(34,211,238,0.2)] animate-[scale-up_0.2s_ease-out]">
            <div className="flex items-center gap-3 mb-6 border-b border-cyan-500/20 pb-4">
              <div className="w-10 h-10 rounded-full border border-cyan-500 flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-wand-magic-sparkles text-cyan-400"></i>
              </div>
              <div>
                <h2 className="orbitron font-bold text-cyan-400 tracking-widest text-sm">CONFIRM ASSET RENDER</h2>
                <p className="text-[10px] text-cyan-700 font-mono uppercase">Neural Graphics Engine Standby</p>
              </div>
            </div>
            
            <div className="bg-slate-900/50 p-4 border border-cyan-500/10 rounded-lg mb-8">
              <span className="text-[8px] orbitron text-cyan-900 block mb-1">PROMPT PARAMETERS:</span>
              <p className="text-sm text-cyan-100 italic">"{pendingImagePrompt}"</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setPendingImagePrompt(null)}
                className="flex-1 py-3 glass border border-red-500/30 text-red-400 orbitron text-[10px] tracking-widest hover:bg-red-500/10 transition-colors uppercase"
              >
                Abort
              </button>
              <button 
                onClick={handleGenerateImage}
                className="flex-1 py-3 bg-cyan-600/20 border border-cyan-400 text-cyan-400 orbitron text-[10px] tracking-widest hover:bg-cyan-600/40 transition-colors uppercase shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onClear={() => setMessages([])}
        activeCore={activeCore}
        onCoreSelect={setActiveCore}
        speechRate={speechRate}
        onSpeechRateChange={setSpeechRate}
        onOpenSecurity={() => setIsSecurityOpen(true)}
      />

      <main className="flex-1 flex flex-col relative z-20 overflow-hidden">
        <header className="h-16 border-b border-cyan-500/20 glass flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 ml-12 lg:ml-0">
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center ${voiceState.isSpeaking ? 'animate-pulse' : ''}`} style={{ borderColor: CORE_CONFIGS[activeCore].color }}>
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: CORE_CONFIGS[activeCore].color, color: CORE_CONFIGS[activeCore].color }}></div>
            </div>
            <div className="flex flex-col">
               <h1 className="orbitron font-bold text-sm md:text-base tracking-widest glow-text text-cyan-400">F.R.I.D.A.Y.</h1>
               <span className="text-[8px] md:text-[10px] orbitron font-bold tracking-tighter" style={{ color: CORE_CONFIGS[activeCore].color }}>
                 CORE: {CORE_CONFIGS[activeCore].name}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] md:text-xs font-mono text-cyan-500/60 uppercase tracking-tighter">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${voiceState.isActive ? 'bg-cyan-400 animate-ping' : 'bg-green-500'}`}></span>
              <span className="hidden xs:inline">STARK_NET ACTIVE</span>
            </div>
          </div>
        </header>

        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={(text) => handleSendMessage(text, false)}
          onGenerateImage={(prompt) => setPendingImagePrompt(prompt)}
        />

        <VoiceInterface 
          state={voiceState}
          setState={setVoiceState}
          speechRate={speechRate}
          activeVoice={CORE_VOICES[activeCore]}
          onTranscriptionUpdate={handleVoiceTranscriptionUpdate}
        />

        <SecurityDashboard 
          isOpen={isSecurityOpen}
          onClose={() => setIsSecurityOpen(false)}
          activeCoreColor={CORE_CONFIGS[activeCore].color}
        />
      </main>
      <style>{`
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
