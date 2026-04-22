
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification } from '../types';

interface ToastContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onRemove }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-triangle-exclamation';
      case 'error': return 'fa-circle-xmark';
      case 'security': return 'fa-shield-halved';
      default: return 'fa-circle-info';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'security': return 'text-cyan-400';
      default: return 'text-blue-400';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/30';
      case 'warning': return 'border-yellow-500/30';
      case 'error': return 'border-red-500/30';
      case 'security': return 'border-cyan-500/30';
      default: return 'border-blue-500/30';
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[150] flex flex-col gap-4 pointer-events-none w-full max-w-xs md:max-w-sm">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className={`pointer-events-auto glass border-2 ${getBorderColor(n.type)} p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative group`}
          >
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-[40px] opacity-20 pointer-events-none rounded-full ${getColor(n.type).replace('text', 'bg')}`} />
            
            <div className="flex gap-4 relative z-10">
              <div className={`mt-1 ${getColor(n.type)}`}>
                <i className={`fa-solid ${getIcon(n.type)} text-lg`}></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`orbitron text-[10px] font-bold tracking-widest ${getColor(n.type)}`}>
                    {n.title.toUpperCase()}
                  </h4>
                  <button 
                    onClick={() => onRemove(n.id)}
                    className="text-white/30 hover:text-white transition-colors"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {n.message}
                </p>
                <div className="mt-2 flex justify-end">
                   <span className="text-[8px] font-mono opacity-30 italic">[{new Date(n.timestamp).toLocaleTimeString()}]</span>
                </div>
              </div>
            </div>

            {/* Progress line */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-0.5 ${getColor(n.type).replace('text', 'bg')}`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
