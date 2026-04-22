
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole } from '../types';
import { CORE_CONFIGS } from '../constants';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, image?: { data: string, mimeType: string }) => void;
  onGenerateImage: (prompt: string) => void;
  onToggleVoice: () => void;
  isVoiceActive: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onGenerateImage,
  onToggleVoice,
  isVoiceActive
}) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        setSelectedImage({ data: base64Data, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;
    
    if (input.toLowerCase().startsWith('/image ')) {
      onGenerateImage(input.slice(7));
    } else {
      onSendMessage(input, selectedImage || undefined);
    }
    
    setInput('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black/20">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[75%] group">
              <div className={`flex items-center gap-2 mb-1 px-1 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`text-[9px] md:text-[10px] orbitron tracking-widest uppercase ${msg.role === MessageRole.USER ? 'text-slate-400' : 'text-cyan-400'}`}>
                  {msg.role === MessageRole.USER ? 'Boss' : 'F.R.I.D.A.Y.'}
                  {msg.core && msg.core !== 'FRIDAY' && (
                    <span className="ml-2 px-1 rounded bg-slate-800 text-[8px]" style={{ color: CORE_CONFIGS[msg.core].color }}>
                      {msg.core}
                    </span>
                  )}
                </span>
              </div>
              
              <div className={`
                p-3 md:p-4 rounded-xl relative border shadow-lg transition-all
                ${msg.role === MessageRole.USER 
                  ? 'bg-cyan-950/40 border-cyan-700/50 text-cyan-50 rounded-tr-none' 
                  : 'bg-slate-900/60 border-slate-700/50 text-slate-100 rounded-tl-none'}
              `}>
                {msg.type === 'image' && msg.mediaUrl ? (
                  <div className="space-y-3">
                    <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed mb-2">{msg.text}</p>
                    <img src={msg.mediaUrl} alt="Visual" className="w-full rounded border border-cyan-500/30" />
                  </div>
                ) : (
                  <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                )}
                <div className={`absolute top-0 bottom-0 w-0.5 ${msg.role === MessageRole.USER ? 'right-0 bg-cyan-500' : 'left-0'}`}
                     style={{ backgroundColor: msg.role === MessageRole.USER ? undefined : (msg.core ? CORE_CONFIGS[msg.core].color : '#22d3ee') }}></div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/40 border border-slate-800/50 p-3 rounded-xl flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 md:p-6 glass border-t border-cyan-500/10">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex flex-col gap-2">
          {selectedImage && (
            <div className="flex items-center gap-3 p-2 bg-slate-900/40 border border-cyan-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="relative w-12 h-12">
                <img 
                  src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                  alt="Uplink Preview" 
                  className="w-full h-full object-cover rounded border border-cyan-500/30"
                />
                <button 
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="flex flex-col">
                <span className="orbitron text-[8px] text-cyan-400 font-bold tracking-widest uppercase">Optical Data Loaded</span>
                <span className="text-[7px] text-slate-500 font-mono italic">Ready for neural analysis...</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full glass border border-cyan-500/20 text-cyan-500 hover:border-cyan-400 hover:text-cyan-400 transition-all flex items-center justify-center shrink-0"
              title="Optical Uplink (Lens)"
            >
              <i className="fa-solid fa-eye text-sm"></i>
            </button>
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Initialize command sequence..."
                className="w-full bg-slate-900/80 border border-cyan-500/20 rounded-full py-3 pl-5 pr-12 text-sm text-cyan-50 focus:outline-none focus:border-cyan-400/50 transition-all placeholder:text-cyan-900/50 placeholder:orbitron placeholder:text-[9px]"
              />
              <button 
                type="button"
                onClick={onToggleVoice}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isVoiceActive ? 'bg-cyan-500 text-white shadow-[0_0_10px_#22d3ee] animate-pulse' : 'text-cyan-800 hover:text-cyan-400'}`}
              >
                <i className={`fa-solid ${isVoiceActive ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </button>
            </div>
            <button type="submit" disabled={isLoading && !selectedImage} className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
              <i className="fa-solid fa-chevron-right text-white"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
