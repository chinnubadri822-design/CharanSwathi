
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole } from '../types';
import { CORE_CONFIGS } from '../constants';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onGenerateImage: (prompt: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSendMessage, onGenerateImage }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (input.toLowerCase().startsWith('/image ')) {
      onGenerateImage(input.slice(7));
    } else {
      onSendMessage(input);
    }
    setInput('');
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
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Initialize command sequence..."
            className="flex-1 bg-slate-900/80 border border-cyan-500/20 rounded-full py-3 px-5 text-sm text-cyan-50 focus:outline-none focus:border-cyan-400/50 transition-all placeholder:text-cyan-900/50 placeholder:orbitron placeholder:text-[9px]"
          />
          <button type="submit" disabled={isLoading} className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
            <i className="fa-solid fa-chevron-right text-white"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
