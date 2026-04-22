
import React from 'react';
import { NeuralCore } from '../types';
import { CORE_CONFIGS } from '../constants';
import { CORE_VOICES } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  activeCore: NeuralCore;
  onCoreSelect: (core: NeuralCore) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  onOpenSecurity: () => void;
  onToggleVoice: () => void;
  isVoiceActive: boolean;
  onShowHistory: () => void;
  isSessionActive: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onClear, activeCore, onCoreSelect, speechRate, onSpeechRateChange, onOpenSecurity, onToggleVoice, isVoiceActive, onShowHistory, isSessionActive }) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={onToggle} />}

      <aside className={`
        fixed lg:relative z-40 transition-all duration-300 ease-in-out h-full glass border-r border-cyan-500/20
        ${isOpen ? 'translate-x-0 w-64 md:w-72' : '-translate-x-full lg:translate-x-0 w-64 lg:w-24'} 
        flex flex-col
      `}>
        <div className="p-4 md:p-6 flex flex-col h-full overflow-y-auto scrollbar-none">
          <div className="mb-6 flex items-center gap-4">
             <i className="fa-solid fa-brain text-cyan-400 text-xl shrink-0"></i>
             <span className={`orbitron font-bold text-cyan-400 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>NEURAL CORES</span>
          </div>

          <div className="mb-6 space-y-2">
            <button 
              onClick={() => { onShowHistory(); if (window.innerWidth < 1024) onToggle(); }}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all border ${!isSessionActive ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-cyan-400'}`}
            >
              <i className="fa-solid fa-clock-rotate-left shrink-0"></i>
              <span className={`orbitron text-[10px] font-bold tracking-widest transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>HISTORY</span>
            </button>
            <button 
              onClick={() => { onOpenSecurity(); if (window.innerWidth < 1024) onToggle(); }}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-cyan-500/10 text-cyan-400 transition-colors group border border-transparent hover:border-cyan-500/20"
            >
              <i className="fa-solid fa-shield-halved group-hover:animate-pulse shrink-0"></i>
              <span className={`orbitron text-[10px] font-bold tracking-widest transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>SECURITY protocols</span>
            </button>
          </div>

          <nav className="flex-1 space-y-2 border-t border-cyan-500/10 pt-6">
            {(Object.keys(CORE_CONFIGS) as NeuralCore[]).map((coreKey) => {
              const config = CORE_CONFIGS[coreKey];
              const isActive = activeCore === coreKey;
              return (
                <button 
                  key={coreKey}
                  onClick={() => onCoreSelect(coreKey)}
                  className={`
                    w-full flex items-center gap-4 p-3 rounded-lg transition-all border relative group
                    ${isActive 
                      ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                      : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}
                  `}
                  style={{ borderColor: isActive ? `${config.color}44` : 'transparent' }}
                >
                  {/* Neural Core Tooltip */}
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-lg text-[10px] orbitron text-cyan-400 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-50 translate-x-[-10px] group-hover:translate-x-0 hidden lg:block shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-bold tracking-widest border-b border-white/10 pb-1 mb-1">{config.name}</span>
                      <span className="opacity-70 lowercase font-mono">{config.description}</span>
                    </div>
                  </div>

                  <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'animate-pulse' : ''}`} style={{ backgroundColor: config.color }}></div>
                  <div className={`flex flex-col items-start transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                    <span className="orbitron text-[10px] font-bold tracking-widest">{config.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] opacity-60 uppercase font-mono">{config.description}</span>
                      {isActive && (
                        <span className="text-[7px] text-cyan-500/80 font-bold uppercase tracking-tighter border-l border-cyan-500/20 pl-2">
                          {CORE_VOICES[coreKey]} Ready
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-cyan-500/10 space-y-6">
            <div className={`transition-all duration-500 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 lg:hidden pointer-events-none'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-bolt-lightning text-cyan-400 text-[10px] animate-pulse"></i>
                  <span className="orbitron text-[10px] text-cyan-400 tracking-widest uppercase font-bold">Vocal Cadence</span>
                </div>
                <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded flex items-center">
                   <span className="font-mono text-[10px] text-cyan-400 font-bold tracking-tighter">{speechRate.toFixed(1)}x</span>
                </div>
              </div>
              <div className="relative flex items-center group/slider">
                <div className="absolute left-0 -top-1 w-full h-[1px] bg-cyan-500/10"></div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1" 
                  value={speechRate}
                  onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800/80 rounded-full appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all z-10 border border-cyan-500/5 shadow-inner"
                />
              </div>
              <div className="flex justify-between mt-2 px-1">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[7px] text-slate-500 font-mono tracking-tighter uppercase">Defensive</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[7px] text-cyan-500/40 font-mono tracking-tighter uppercase italic">Nominal</span>
                  <div className="w-0.5 h-1 bg-cyan-500/20"></div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[7px] text-slate-500 font-mono tracking-tighter uppercase">Aggressive</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { onToggleVoice(); if (window.innerWidth < 1024) onToggle(); }}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all group border ${isVoiceActive ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'hover:bg-cyan-500/10 text-slate-400 border-transparent hover:text-cyan-400'}`}
            >
              <div className="relative">
                <i className={`fa-solid ${isVoiceActive ? 'fa-microphone' : 'fa-microphone-slash'} shrink-0 z-10 relative`}></i>
                {isVoiceActive && <div className="absolute inset-0 bg-cyan-400 blur-sm opacity-50 animate-pulse"></div>}
              </div>
              <span className={`orbitron text-[10px] font-bold tracking-widest transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                {isVoiceActive ? 'STARK-LINK ACTIVE' : 'INITIALIZE VOX'}
              </span>
            </button>

            <button 
              onClick={() => { onClear(); if (window.innerWidth < 1024) onToggle(); }}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all group border border-transparent hover:border-red-500/20"
            >
              <i className="fa-solid fa-trash-can group-hover:rotate-12 transition-transform shrink-0"></i>
              <span className={`orbitron text-[10px] font-bold tracking-widest transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>FLUSH NEURAL CACHE</span>
            </button>
          </div>
        </div>
      </aside>
      
      <button 
        onClick={onToggle}
        className={`fixed top-4 left-4 lg:hidden z-50 w-10 h-10 rounded-lg glass border border-cyan-500/30 flex items-center justify-center text-cyan-400 transition-transform active:scale-90`}
      >
        <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
      </button>
    </>
  );
};

export default Sidebar;
