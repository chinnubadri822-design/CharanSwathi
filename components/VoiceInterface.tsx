
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { VoiceState, MessageRole } from '../types';
import { FRIDAY_SYSTEM_INSTRUCTION, MODELS } from '../constants';
import { encode, decode, decodeAudioData } from '../audioUtils';

export interface VoiceInterfaceRef {
  toggle: () => void;
}

interface VoiceInterfaceProps {
  state: VoiceState;
  setState: React.Dispatch<React.SetStateAction<VoiceState>>;
  speechRate: number;
  activeVoice: string;
  activeCoreInstruction: string;
  onTranscriptionUpdate: (id: string, role: MessageRole, text: string) => void;
}

const VoiceInterface = forwardRef<VoiceInterfaceRef, VoiceInterfaceProps>(({ state, setState, speechRate, activeVoice, activeCoreInstruction, onTranscriptionUpdate }, ref) => {
  const [session, setSession] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const currentInputId = useRef<string>('');
  const currentOutputId = useRef<string>('');

  const speechRateRef = useRef(speechRate);
  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  const stopVoiceSession = useCallback(() => {
    if (session) {
      session.close();
      setSession(null);
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputContextRef.current) {
        inputContextRef.current.close();
        inputContextRef.current = null;
    }
    for (const source of sourcesRef.current.values()) {
        try { source.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
    
    setState({ isActive: false, isListening: false, isSpeaking: false, error: undefined });
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';
    currentInputId.current = '';
    currentOutputId.current = '';
  }, [session, setState]);

  const startVoiceSession = async () => {
    setState(prev => ({ ...prev, error: undefined }));

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("STARK_ERR: Protocol mismatch.");
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error("STARK_ERR: Bio-link blocked. Please grant microphone permissions in your browser.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          throw new Error("STARK_ERR: Hardware missing. Verify your microphone connection.");
        }
        throw new Error("STARK_ERR: Hardware fault. System reset recommended.");
      }

      streamRef.current = stream;
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede', 'Hera', 'Zephyr', 'Orion'];
      // Ensure 'Charon' is used if specified, otherwise strictly fallback to 'Kore'
      const currentVoice = validVoices.includes(activeVoice) ? activeVoice : 'Kore';

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const sessionPromise = ai.live.connect({
        model: MODELS.VOICE,
        callbacks: {
          onopen: () => {
            setState({ isActive: true, isListening: true, isSpeaking: false, error: undefined });
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              const base64Data = encode(new Uint8Array(int16.buffer));
              sessionPromise.then(s => {
                (s as any).sendRealtimeInput({
                  audio: {
                    data: base64Data,
                    mimeType: 'audio/pcm;rate=16000'
                  }
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: any) => {
            if (message.realtimeInputTranscription?.text) {
              if (!currentInputId.current) currentInputId.current = 'voice-in-' + Date.now();
              currentInputTranscription.current += message.realtimeInputTranscription.text;
              onTranscriptionUpdate(currentInputId.current, MessageRole.USER, currentInputTranscription.current);
            }

            // Official path for audio transcription output
            if (message.serverContent?.modelDraft?.text) {
              if (!currentOutputId.current) currentOutputId.current = 'voice-out-' + Date.now();
              currentOutputTranscription.current += message.serverContent.modelDraft.text;
              onTranscriptionUpdate(currentOutputId.current, MessageRole.FRIDAY, currentOutputTranscription.current);
            }

            if (message.serverContent?.turnComplete) {
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
              currentInputId.current = '';
              currentOutputId.current = '';
              setState(prev => ({ ...prev, isSpeaking: false }));
            }

            // Official path for modelTurn audio data
            const base64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64) {
              setState(prev => ({ ...prev, isSpeaking: true }));
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              try {
                const audioBuffer = await decodeAudioData(decode(base64), outputCtx, 24000, 1);
                if (!audioBuffer) throw new Error("Null buffer");
                
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.playbackRate.value = speechRateRef.current;
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setState(prev => ({ ...prev, isSpeaking: false }));
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += (audioBuffer.duration / speechRateRef.current);
                sourcesRef.current.add(source);
              } catch (decodeErr) {
                console.error("Neural Audio Corruption:", decodeErr);
              }
            }

            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current.values()) try { s.stop(); } catch(e) {}
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setState(prev => ({ ...prev, isSpeaking: false }));
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
              currentInputId.current = '';
              currentOutputId.current = '';
            }
          },
          onerror: (e: any) => {
            console.error("Neural Link Error:", e);
            let errorMessage = "STARK_ERR: Uplink failed.";
            
            if (e?.message) {
              if (e.message.includes('429')) errorMessage = "STARK_ERR: Neural quota exhausted.";
              else if (e.message.includes('401') || e.message.includes('403')) errorMessage = "STARK_ERR: Authentication breach.";
              else if (e.message.includes('network') || e.message.includes('fetch')) errorMessage = "STARK_ERR: Signal instability.";
              else errorMessage = `STARK_ERR: ${e.message}`;
            }
            
            setState(prev => ({ ...prev, error: errorMessage, isActive: false, isListening: false }));
          },
          onclose: (e: any) => {
            if (e?.reason || e?.code) {
              console.log("Neural Link Closed:", e);
              if (e.code === 1006) {
                 setState(prev => ({ ...prev, error: "STARK_ERR: Abnormal termination." }));
              }
            }
            stopVoiceSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: currentVoice } } },
          systemInstruction: `${FRIDAY_SYSTEM_INSTRUCTION}\n\nACTIVE CORE PROTOCOL: ${activeCoreInstruction}\n\nIMPORTANT: You must speak with a charming and sophisticated Irish accent when speaking English and acting as the FRIDAY core. If acting as JARVIS, adopt a formal, gentlemanly British tone. Maintain the specific personality of the active core. If Boss speaks in another language, respond in that language with a sophisticated and intelligent tone suitable for F.R.I.D.A.Y.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ googleSearch: {} }]
        }
      });
      setSession(await sessionPromise);
    } catch (err: any) {
      setState({ isActive: false, isListening: false, isSpeaking: false, error: err.message });
    }
  };

  useImperativeHandle(ref, () => ({
    toggle: () => {
      if (state.isActive) {
        stopVoiceSession();
      } else {
        startVoiceSession();
      }
    }
  }));

  return (
    <div className="absolute bottom-20 md:bottom-28 right-4 md:right-8 z-50 flex flex-col items-center">
      {state.error && (
        <div className="mb-3 bg-red-900/90 border border-red-500 p-2 rounded-lg text-[10px] orbitron text-red-100 max-w-[160px] md:max-w-[200px] text-center animate-pulse backdrop-blur-md">
          <i className="fa-solid fa-triangle-exclamation mr-1"></i>
          {state.error}
        </div>
      )}

      {state.isActive && !state.error && (
        <div className="mb-4 md:mb-6 flex flex-col items-center">
          <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-[ping_2s_infinite] ${state.isSpeaking ? 'scale-125' : 'scale-110'}`}></div>
            <div className="flex items-end gap-1 h-8 md:h-12">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i} 
                  className={`w-1 md:w-1.5 bg-cyan-400 rounded-full transition-all duration-150 ${state.isListening || state.isSpeaking ? 'animate-[pulse_1s_infinite]' : 'h-1'}`}
                  style={{ 
                    height: `${state.isSpeaking ? 40 + Math.random() * 60 : state.isListening ? 10 + Math.random() * 30 : 10}%`, 
                    animationDelay: `${i * 0.1}s` 
                  }}
                ></div>
              ))}
            </div>
          </div>
          {state.isSpeaking && (
            <div className="mt-2 glass px-3 py-1 rounded-full border border-cyan-500/30">
              <span className="orbitron text-[8px] text-cyan-400 animate-pulse tracking-widest">TRANSCRIBING AUDIO</span>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={state.isActive ? stopVoiceSession : startVoiceSession}
        className={`
          w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 glass border-2
          ${state.error ? 'bg-red-900 border-red-500' : 
            state.isActive ? 'bg-cyan-500/40 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 
            'bg-slate-900 border-cyan-900 hover:border-cyan-400'}
          active:scale-90
        `}
      >
        <i className={`fa-solid ${state.error ? 'fa-rotate-right' : state.isActive ? 'fa-microphone' : 'fa-microphone-slash'} text-base md:text-xl ${state.error ? 'text-red-200' : state.isActive ? 'text-white' : 'text-cyan-900'}`}></i>
      </button>
      
      <div className="mt-2 orbitron text-[7px] md:text-[8px] text-cyan-800 tracking-tighter uppercase whitespace-nowrap">
        {state.error ? 'FAULT' : state.isActive ? 'LINK ACTIVE' : 'VOICE OFFLINE'}
      </div>
    </div>
  );
});

export default VoiceInterface;
