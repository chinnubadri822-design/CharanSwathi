
import React from 'react';

interface HUDOverlayProps {
  color?: string;
}

const HUDOverlay: React.FC<HUDOverlayProps> = ({ color = '#22d3ee' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(15,23,42,1)_0%,_rgba(2,6,23,1)_100%)]"></div>
      
      {/* Animated Nebula Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 animate-pulse" style={{ backgroundColor: color }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 animate-pulse" style={{ backgroundColor: color, animationDelay: '2s' }}></div>

      {/* Central HUD Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border-[0.5px] rounded-full opacity-5 animate-pulse-slow" style={{ borderColor: color }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border-[1px] border-dashed rounded-full opacity-10 animate-[spin_120s_linear_infinite]" style={{ borderColor: color }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-[0.5px] rounded-full opacity-5 animate-[spin_40s_linear_infinite_reverse]" style={{ borderColor: color }}></div>
      
      {/* Perspective Grid */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, 
             backgroundSize: '60px 60px',
             perspective: '1000px',
             transform: 'rotateX(60deg) translateY(-100px) scale(2)'
           }}>
      </div>

      {/* Floating Data Points (Simulated) */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 rounded-full animate-ping"
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`, 
              backgroundColor: color,
              animationDuration: `${3 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Side Decorative Lines */}
      <div className="absolute top-0 left-10 bottom-0 w-[1px] opacity-20" style={{ background: `linear-gradient(to bottom, transparent, ${color}80, transparent)` }}></div>
      <div className="absolute top-0 right-10 bottom-0 w-[1px] opacity-20" style={{ background: `linear-gradient(to bottom, transparent, ${color}80, transparent)` }}></div>
      
      {/* Corner accents */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t border-l opacity-30" style={{ borderColor: color }}></div>
      <div className="absolute top-10 right-10 w-20 h-20 border-t border-r opacity-30" style={{ borderColor: color }}></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l opacity-30" style={{ borderColor: color }}></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r opacity-30" style={{ borderColor: color }}></div>
    </div>
  );
};

export default HUDOverlay;
