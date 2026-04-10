
import React from 'react';

interface HUDOverlayProps {
  color?: string;
}

const HUDOverlay: React.FC<HUDOverlayProps> = ({ color = '#22d3ee' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
      {/* Central Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[0.5px] rounded-full animate-pulse-slow" style={{ borderColor: color }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-dashed rounded-full animate-[spin_60s_linear_infinite]" style={{ borderColor: color }}></div>
      
      {/* Grid */}
      <div className="absolute inset-0" 
           style={{ backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
      </div>

      {/* Side Decorative Lines */}
      <div className="absolute top-0 left-10 bottom-0 w-[1px]" style={{ background: `linear-gradient(to bottom, transparent, ${color}80, transparent)` }}></div>
      <div className="absolute top-0 right-10 bottom-0 w-[1px]" style={{ background: `linear-gradient(to bottom, transparent, ${color}80, transparent)` }}></div>
      
      {/* Corner accents */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t border-l" style={{ borderColor: color }}></div>
      <div className="absolute top-10 right-10 w-20 h-20 border-t border-r" style={{ borderColor: color }}></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l" style={{ borderColor: color }}></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r" style={{ borderColor: color }}></div>
    </div>
  );
};

export default HUDOverlay;
