
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, MessageRole, VoiceState, NeuralCore, ChatSession } from './types';
import { FRIDAY_SYSTEM_INSTRUCTION, CORE_CONFIGS, MODELS } from './constants';
import { decode, decodeAudioData } from './audioUtils';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import HUDOverlay from './components/HUDOverlay';
import VoiceInterface, { VoiceInterfaceRef } from './components/VoiceInterface';
import SecurityDashboard from './components/SecurityDashboard';
import SessionExplorer from './components/SessionExplorer';
import ToastContainer from './components/ToastContainer';
import { Notification, NotificationType } from './types';

export const CORE_VOICES: Record<NeuralCore, string> = {
  FRIDAY: 'Aoede',
  DEEPSEEK: 'Aoede',
  GPT4: 'Aoede',
  GEMINI: 'Aoede',
  BOLT: 'Aoede',
  ULTRON: 'Fenrir',
  JARVIS: 'Charon',
  VISION: 'Charon',
  CODEX: 'Aoede'
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('friday_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load sessions:", e);
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCore, setActiveCore] = useState<NeuralCore>('FRIDAY');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [pendingImagePrompt, setPendingImagePrompt] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isActive: false,
    isListening: false,
    isSpeaking: false
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((title: string, message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev.slice(-3), { id, title, message, type, timestamp: Date.now() }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTTSNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const lastSpokenIndexRef = useRef(0);
  const voiceRef = useRef<VoiceInterfaceRef>(null);

  useEffect(() => {
    // Initial setup
    const timer = setTimeout(() => {
      addNotification('System Integrity', 'All Stark-Net defensive protocols are active. Neural link stable.', 'security');
    }, 1500);
    return () => clearTimeout(timer);
  }, [addNotification]);

  useEffect(() => {
    localStorage.setItem('friday_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleNewSession = (core: NeuralCore = activeCore) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Neural Link',
      messages: [],
      lastTimestamp: Date.now(),
      core
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setActiveCore(core);
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setActiveCore(session.core);
    }
  };

  const updateSessionTitle = (sessionId: string, firstMessage: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId && s.title === 'New Neural Link') {
        const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
        return { ...s, title };
      }
      return s;
    }));
  };

  const handleClearChat = () => {
    if (activeSessionId) {
      setSessions(prev => prev.filter(s => s.id !== activeSessionId));
      setActiveSessionId(null);
    } else {
      setSessions([]);
    }
    localStorage.removeItem('friday_sessions');
  };

  const vocalQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);

  const processVocalQueue = async () => {
    if (isProcessingQueueRef.current || vocalQueueRef.current.length === 0) return;
    
    isProcessingQueueRef.current = true;
    const text = vocalQueueRef.current[0];
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: MODELS.TTS,
        contents: [{ parts: [{ text: `Say with F.R.I.D.A.Y.'s signature sophisticated, witty persona. If the text is in English, use a charming Irish lilt. Otherwise, adapt the tone and accent to the language of the text while maintaining the persona's intelligence and sophistication: ${text}` }] }],
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
        setVoiceState(prev => ({ ...prev, isSpeaking: true }));
        
        source.onended = () => {
          vocalQueueRef.current.shift();
          isProcessingQueueRef.current = false;
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
          processVocalQueue();
        };
        
        source.start();
      } else {
        throw new Error("No audio data");
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      
      const isQuotaExceeded = error?.message?.includes('429') || error?.status === 429 || JSON.stringify(error).includes('429');
      if (isQuotaExceeded) {
        addNotification('System Alert', 'Neural voice quota reached. Deploying local synthesis fallback.', 'warning');
      }

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en-IE') || v.name.includes('Irish') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setVoiceState(prev => ({ ...prev, isSpeaking: true }));
        utterance.onend = () => {
          vocalQueueRef.current.shift();
          isProcessingQueueRef.current = false;
          setVoiceState(prev => ({ ...prev, isSpeaking: false }));
          processVocalQueue();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        vocalQueueRef.current.shift();
        isProcessingQueueRef.current = false;
        processVocalQueue();
      }
    }
  };

  const speakText = async (text: string, interrupt: boolean = true) => {
    if (voiceState.isActive || !text.trim()) return;

    if (interrupt) {
      vocalQueueRef.current = [text];
      if (currentTTSNodeRef.current) {
        try { currentTTSNodeRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isProcessingQueueRef.current = false;
    } else {
      vocalQueueRef.current.push(text);
    }

    processVocalQueue();
  };

  const handleSendMessage = async (text: string, image?: { data: string, mimeType: string }, isFromVoice: boolean = false) => {
    if (!text.trim() && !image) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: text ? (text.length > 30 ? text.substring(0, 30) + '...' : text) : 'Optical Analysis',
        messages: [],
        lastTimestamp: Date.now(),
        core: activeCore
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      targetSessionId = newId;
      addNotification('Uplink Established', 'New secure neural thread initialized.', 'success');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: text || "Analyze this visual data.",
      timestamp: Date.now(),
      type: image ? 'image' : 'text',
      mediaUrl: image ? `data:${image.mimeType};base64,${image.data}` : undefined
    };

    setSessions(prev => prev.map(s => 
      s.id === targetSessionId ? { ...s, messages: [...s.messages, userMessage], lastTimestamp: Date.now() } : s
    ));
    
    // Update title if it's the first message
    const session = sessions.find(s => s.id === targetSessionId);
    if (session && session.messages.length === 0 && text) {
      updateSessionTitle(targetSessionId, text);
    }
    
    if (!isFromVoice) {
      setIsLoading(true);
      const fridayMessageId = (Date.now() + 1).toString();
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const coreConfig = CORE_CONFIGS[activeCore];
        
        const currentMessages = sessions.find(s => s.id === targetSessionId)?.messages || [];
        const history = currentMessages.slice(-10).map(m => {
          const parts: any[] = [{ text: m.text }];
          if (m.type === 'image' && m.mediaUrl) {
             const [mime, data] = m.mediaUrl.split(',');
             parts.unshift({
               inlineData: {
                 mimeType: mime.split(':')[1].split(';')[0],
                 data: data
               }
             });
          }
          return {
            role: m.role === MessageRole.USER ? 'user' : 'model',
            parts
          };
        });

        const currentParts: any[] = [{ text: text || "Analyze this image." }];
        if (image) {
          currentParts.unshift({
            inlineData: {
              mimeType: image.mimeType,
              data: image.data
            }
          });
          addNotification('Visual Uplink', 'Streaming optical data to neural core...', 'info');
        }
        
        history.push({ role: 'user', parts: currentParts });

        const responseStream = await ai.models.generateContentStream({
          model: MODELS.CHAT,
          contents: history,
          config: {
            systemInstruction: `${FRIDAY_SYSTEM_INSTRUCTION}\n\nACTIVE CORE PROTOCOL: ${coreConfig.instruction}\n\nOPTICAL ANALYSIS MODE: If an image is provided, perform detailed analysis. You have access to STARK LENS technology.`,
            temperature: 0.8,
            tools: [{ googleSearch: {} }]
          },
        });

        setSessions(prev => prev.map(s => 
          s.id === targetSessionId ? { ...s, messages: [...s.messages, {
            id: fridayMessageId,
            role: MessageRole.FRIDAY,
            text: "",
            timestamp: Date.now(),
            core: activeCore
          }] } : s
        ));

        let fullText = "";
        let groundingUrls: string[] = [];
        let firstChunkReceived = false;
        lastSpokenIndexRef.current = 0;
        
        // Interrupt any previous reading
        if (currentTTSNodeRef.current) {
          try { currentTTSNodeRef.current.stop(); } catch (e) {}
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        vocalQueueRef.current = [];
        isProcessingQueueRef.current = false;
        setVoiceState(prev => ({ ...prev, isSpeaking: false }));

        for await (const chunk of responseStream) {
          if (!firstChunkReceived) {
            setIsLoading(false);
            firstChunkReceived = true;
          }
          
          fullText += chunk.text || "";
          
          // Incremental TTS: Find sentences and speak them immediately
          const parts = fullText.split(/([.!?]\s+)/);
          if (parts.length > lastSpokenIndexRef.current + 1) {
            const nextPart = parts.slice(lastSpokenIndexRef.current, lastSpokenIndexRef.current + 2).join("");
            if (nextPart.trim().length > 10) {
              speakText(nextPart, false);
              lastSpokenIndexRef.current += 2;
            }
          }
          
          const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
          if (groundingMetadata?.groundingChunks) {
            const urls = groundingMetadata.groundingChunks
              .map((c: any) => c.web?.uri)
              .filter(Boolean);
            groundingUrls = [...new Set([...groundingUrls, ...urls])];
          }

          setSessions(prev => prev.map(s => 
            s.id === targetSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === fridayMessageId ? { ...m, text: fullText } : m)
            } : s
          ));
        }

        // Final catch-up for any remaining text
        const remainingText = fullText.split(/([.!?]\s+)/).slice(lastSpokenIndexRef.current).join("");
        if (remainingText.trim()) {
           speakText(remainingText, false);
        }

        if (groundingUrls.length > 0) {
          const sourcesText = "\n\n**Data Sources Analyzed:**\n" + Array.from(new Set(groundingUrls)).map(url => `- ${url}`).join('\n');
          const finalFullText = fullText + sourcesText;
          setSessions(prev => prev.map(s => 
            s.id === targetSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === fridayMessageId ? { ...m, text: finalFullText } : m)
            } : s
          ));
        }

      } catch (error) {
        console.error("Streaming Error:", error);
        setSessions(prev => prev.map(s => 
          s.id === targetSessionId ? {
            ...s,
            messages: [...s.messages.filter(m => m.id !== fridayMessageId), {
              id: fridayMessageId,
              role: MessageRole.FRIDAY,
              text: "Critical failure in the processing uplink. I'm working on a workaround, Boss.",
              timestamp: Date.now(),
              core: 'FRIDAY'
            }]
          } : s
        ));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVoiceTranscriptionUpdate = useCallback((id: string, role: MessageRole, text: string) => {
    if (!activeSessionId) return;

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const exists = s.messages.find(m => m.id === id);
        if (exists) {
          return { ...s, messages: s.messages.map(m => m.id === id ? { ...m, text } : m), lastTimestamp: Date.now() };
        } else {
          return { ...s, messages: [...s.messages, {
            id,
            role,
            text,
            timestamp: Date.now(),
            core: role === MessageRole.FRIDAY ? activeCore : undefined
          }], lastTimestamp: Date.now() };
        }
      }
      return s;
    }));
  }, [activeSessionId, activeCore]);

  const handleGenerateImage = async () => {
    if (!pendingImagePrompt || !activeSessionId) return;
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
        addNotification('Render Complete', `Asset generated successfully for "${prompt}".`, 'success');
        const msgText = `Asset rendered successfully for: ${prompt}`;
        setSessions(prev => prev.map(s => 
          s.id === activeSessionId ? {
            ...s,
            messages: [...s.messages, {
              id: Date.now().toString(),
              role: MessageRole.FRIDAY,
              text: msgText,
              type: 'image',
              mediaUrl: imageUrl,
              timestamp: Date.now(),
              core: activeCore
            }],
            lastTimestamp: Date.now()
          } : s
        ));
        speakText(msgText);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleToggleVoice = () => {
    if (!voiceState.isActive) {
      if (currentTTSNodeRef.current) {
        try { currentTTSNodeRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      vocalQueueRef.current = [];
      isProcessingQueueRef.current = false;
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
    voiceRef.current?.toggle();
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
        onClear={handleClearChat}
        activeCore={activeCore}
        onCoreSelect={(core) => {
          if (core !== activeCore) {
            addNotification('Neural Migration', `Transitioning to ${CORE_CONFIGS[core].name} protocols.`, 'info');
          }
          setActiveCore(core);
          if (activeSessionId) {
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, core } : s));
          }
        }}
        speechRate={speechRate}
        onSpeechRateChange={setSpeechRate}
        onOpenSecurity={() => {
          setIsSecurityOpen(true);
          addNotification('Security Alert', 'Accessing restricted Stark-Net defense protocols.', 'security');
        }}
        onToggleVoice={handleToggleVoice}
        isVoiceActive={voiceState.isActive}
        onShowHistory={() => setActiveSessionId(null)}
        isSessionActive={!!activeSessionId}
      />

      <main className="flex-1 flex flex-col relative z-20 overflow-hidden">
        {activeSessionId ? (
          <>
            <header className="h-16 border-b border-cyan-500/20 glass flex items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-3 ml-12 lg:ml-0">
                <button 
                  onClick={() => setActiveSessionId(null)}
                  className="mr-2 w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center lg:hidden"
                >
                  <i className="fa-solid fa-chevron-left text-cyan-400"></i>
                </button>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center ${voiceState.isSpeaking ? 'animate-pulse' : ''}`} style={{ borderColor: CORE_CONFIGS[activeCore].color }}>
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: CORE_CONFIGS[activeCore].color, color: CORE_CONFIGS[activeCore].color }}></div>
                </div>
                <div className="flex flex-col">
                   <h1 className="orbitron font-bold text-sm md:text-base tracking-widest glow-text text-cyan-400 truncate max-w-[150px] md:max-w-xs">{activeSession?.title}</h1>
                   <span className="text-[8px] md:text-[10px] orbitron font-bold tracking-tighter" style={{ color: CORE_CONFIGS[activeCore].color }}>
                     CORE: {CORE_CONFIGS[activeCore].name}
                   </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[8px] md:text-[10px] orbitron tracking-widest uppercase">
                <div className="hidden sm:flex items-center gap-2 border-r border-cyan-500/20 pr-4">
                  <span className={`w-1.5 h-1.5 rounded-full ${voiceState.isActive ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse' : 'bg-slate-700'}`}></span>
                  <span className={voiceState.isActive ? 'text-cyan-400' : 'text-slate-500'}>
                    {voiceState.isActive ? 'Voice Link Active' : 'Voice Offline'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                  <span className="text-green-500/80">STARK_NET ACTIVE</span>
                </div>
              </div>
            </header>

            <ChatWindow 
              messages={messages} 
              isLoading={isLoading} 
              onSendMessage={(text, image) => handleSendMessage(text, image, false)}
              onGenerateImage={(prompt) => setPendingImagePrompt(prompt)}
              onToggleVoice={handleToggleVoice}
              isVoiceActive={voiceState.isActive}
            />
          </>
        ) : (
          <SessionExplorer 
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onNewChat={handleNewSession}
            activeCoreColor={CORE_CONFIGS[activeCore].color}
          />
        )}

        <VoiceInterface 
          ref={voiceRef}
          state={voiceState}
          setState={setVoiceState}
          speechRate={speechRate}
          activeVoice={CORE_VOICES[activeCore]}
          activeCoreInstruction={CORE_CONFIGS[activeCore].instruction}
          onTranscriptionUpdate={handleVoiceTranscriptionUpdate}
        />

        <SecurityDashboard 
          isOpen={isSecurityOpen}
          onClose={() => setIsSecurityOpen(false)}
          activeCoreColor={CORE_CONFIGS[activeCore].color}
        />

        <ToastContainer 
          notifications={notifications}
          onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
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
