
import React from 'react';
import { motion } from 'motion/react';
import { ChatSession, NeuralCore } from '../types';
import { CORE_CONFIGS } from '../constants';

interface SessionExplorerProps {
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: (core?: NeuralCore) => void;
  activeCoreColor: string;
}

const SessionExplorer: React.FC<SessionExplorerProps> = ({ sessions, onSelectSession, onDeleteSession, onNewChat, activeCoreColor }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Quick Actions Header - Stark Style */}
      <div className="p-6 pt-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="orbitron font-bold text-2xl tracking-[0.2em] text-cyan-400">STARK_NET</h1>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/10 transition-colors">
              <i className="fa-solid fa-magnifying-glass text-cyan-400/60"></i>
            </button>
            <div className="w-10 h-10 rounded-full border border-cyan-400 bg-cyan-900/30 flex items-center justify-center orbitron font-bold text-xs text-cyan-400">
              CH
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-12">
          {[
            { id: 'projects', label: 'Projects', icon: 'fa-folder-open', color: '#60a5fa' },
            { id: 'images', label: 'Images', icon: 'fa-image', color: '#f472b6' },
            { id: 'apps', label: 'Apps', icon: 'fa-layer-group', color: '#a78bfa' },
            { id: 'upgrade', label: 'Upgrade', icon: 'fa-sparkles', color: '#fbbf24' },
          ].map((action) => (
            <button 
              key={action.id}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full glass border border-white/10 flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <i className={`fa-solid ${action.icon} text-xl`} style={{ color: action.color }}></i>
              </div>
              <span className="text-[10px] orbitron tracking-widest text-slate-400 group-hover:text-white transition-colors">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="orbitron text-xs font-bold tracking-[0.3em] text-slate-500 uppercase">Recents</h2>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-400px)] scrollbar-none pb-24">
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-600 font-mono text-xs italic">No neural histories found in local cache.</p>
            </div>
          ) : (
            sessions.slice().sort((a,b) => b.lastTimestamp - a.lastTimestamp).map((session) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSession(session.id);
                  }
                }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CORE_CONFIGS[session.core]?.color || '#22d3ee' }}></div>
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors tracking-wide truncate">
                    {session.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                  <i className="fa-solid fa-chevron-right text-[10px] text-slate-700 group-hover:text-slate-500 transition-colors"></i>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Floating Chat Button */}
      <button 
        onClick={() => onNewChat()}
        className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 bg-white text-black rounded-full font-bold shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform active:scale-95 z-50"
      >
        <i className="fa-solid fa-pen-to-square"></i>
        <span>New Link</span>
      </button>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default SessionExplorer;
