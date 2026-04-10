
import React from 'react';
import { NeuralCore } from '../types';
import { CORE_CONFIGS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  activeCore: NeuralCore;
  onCoreSelect: (core: NeuralCore) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  onOpenSecurity: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onClear, activeCore, onCoreSelect, speechRate, onSpeechRateChange, onOpenSecurity }) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={onToggle} />}

      <aside className={`
        fixed lg:relative z-40 transition-all duration-300 ease-in-out h-full glass border-r border-cyan-500/20
        ${isOpen ? 'translate-x-0 w-64 md:w-72' : '-translate-x-full lg:translate-x-0 w-64 lg:w-24'} 
        flex flex-col
      `}>
        <div className="p-4 md:p-6 flex flex-col h-full overflow-y-auto scrollbar-none">
          <div className="mb-8 flex items-center gap-4">
             <i className="fa-solid fa-brain text-cyan-400 text-xl shrink-0"></i>
             <span className={`orbitron font-bold text-cyan-400 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>NEURAL CORES</span>
          </div>

          <nav className="flex-1 space-y-3">
            {(Object.keys(CORE_CONFIGS) as NeuralCore[]).map((coreKey) => {
              const config = CORE_CONFIGS[coreKey];
              const isActive = activeCore === coreKey;
              return (
                <button 
                  key={coreKey}
                  onClick={() => onCoreSelect(coreKey)}
                  className={`
                    w-full flex items-center gap-4 p-3 rounded-lg transition-all border
                    ${isActive 
                      ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
                      : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}
                  `}
                  style={{ borderColor: isActive ? `${config.color}44` : 'transparent' }}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'animate-pulse' : ''}`} style={{ backgroundColor: config.color }}></div>
                  <div className={`flex flex-col items-start transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
                    <span className="orbitron text-[10px] font-bold tracking-widest">{config.name}</span>
                    <span className="text-[8px] opacity-60 uppercase font-mono">{config.description}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-cyan-500/10 space-y-6">
            <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="orbitron text-[10px] text-cyan-400 tracking-widest uppercase">Vocal Cadence</span>
                <span className="font-mono text-[10px] text-cyan-600">{speechRate.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value={speechRate}
                onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between mt-1 px-1">
                <span className="text-[8px] text-slate-600 font-mono">SLOW</span>
                <span className="text-[8px] text-slate-600 font-mono">FAST</span>
              </div>
            </div>

            <button 
              onClick={() => { onOpenSecurity(); if (window.innerWidth < 1024) onToggle(); }}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-cyan-500/10 text-cyan-400 transition-colors group border border-cyan-500/20"
            >
              <i className="fa-solid fa-shield-halved group-hover:animate-pulse shrink-0"></i>
              <span className={`orbitron text-[10px] tracking-widest transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>SECURITY PROTOCOLS</span>
            </button>

            <button 
              onClick={() => { onClear(); if (window.innerWidth < 1024) onToggle(); }}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-cyan-600 transition-colors group"
            >
              <i className="fa-solid fa-trash-can group-hover:text-red-400 shrink-0"></i>
              <span className={`orbitron text-xs transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>Flush Memory</span>
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
