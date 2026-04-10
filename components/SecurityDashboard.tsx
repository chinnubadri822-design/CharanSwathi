
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  activeCoreColor: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ isOpen, onClose, activeCoreColor }) => {
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [threats, setThreats] = useState<string[]>([]);
  const [firewallStatus, setFirewallStatus] = useState('ACTIVE');
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);
  const [networkTraffic, setNetworkTraffic] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCpuUsage(Math.floor(Math.random() * 15) + 5); // 5-20%
        setRamUsage(Math.floor(Math.random() * 10) + 40); // 40-50%
        setNetworkTraffic(Math.floor(Math.random() * 50) + 10); // 10-60 KB/s
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScan();
    }
  }, [isOpen]);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setThreats([]);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 200);
  };

  const threatLogs = [
    "Analyzing local network packets...",
    "Scanning encrypted partitions...",
    "Verifying Stark-Net integrity...",
    "Checking for unauthorized uplink attempts...",
    "Firewall: Level 5 protocols active.",
    "No malicious signatures detected.",
    "System integrity: 99.99%"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
          
          <div className="relative glass w-full max-w-4xl h-[80vh] border-2 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)]" style={{ borderColor: `${activeCoreColor}44` }}>
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: `${activeCoreColor}22` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border flex items-center justify-center animate-pulse" style={{ borderColor: activeCoreColor }}>
                  <i className="fa-solid fa-shield-halved text-xl" style={{ color: activeCoreColor }}></i>
                </div>
                <div>
                  <h2 className="orbitron font-bold tracking-[0.2em] text-lg" style={{ color: activeCoreColor }}>SECURITY PROTOCOLS</h2>
                  <p className="text-[10px] font-mono uppercase opacity-60">Stark Industries Global Defense Grid</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-xmark text-xl opacity-50"></i>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel: Status */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900/50 p-4 border rounded-lg" style={{ borderColor: `${activeCoreColor}11` }}>
                  <span className="text-[10px] orbitron opacity-50 block mb-4">FIREWALL STATUS</span>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                    <span className="orbitron text-xl font-bold text-green-500">{firewallStatus}</span>
                  </div>
                  <p className="text-[10px] font-mono mt-2 opacity-40 italic">Level 7 Encryption Active</p>
                </div>

                <div className="bg-slate-900/50 p-4 border rounded-lg" style={{ borderColor: `${activeCoreColor}11` }}>
                  <span className="text-[10px] orbitron opacity-50 block mb-4">THREAT LEVEL</span>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                    <span className="orbitron text-xl font-bold text-blue-500">LOW</span>
                  </div>
                  <p className="text-[10px] font-mono mt-2 opacity-40 italic">No active intrusions detected</p>
                </div>

                <div className="bg-slate-900/50 p-4 border rounded-lg" style={{ borderColor: `${activeCoreColor}11` }}>
                  <span className="text-[10px] orbitron opacity-50 block mb-4">NEURAL LINK</span>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                    <span className="orbitron text-xl font-bold text-cyan-500">STABLE</span>
                  </div>
                  <p className="text-[10px] font-mono mt-2 opacity-40 italic">Uplink: 1.2 GB/s</p>
                </div>

                {/* Hardware Diagnostic Section */}
                <div className="bg-slate-900/50 p-4 border rounded-lg space-y-4" style={{ borderColor: `${activeCoreColor}22` }}>
                  <span className="text-[10px] orbitron text-cyan-400 block border-b border-cyan-500/20 pb-2">HARDWARE DIAGNOSTIC</span>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-mono opacity-60">
                      <span>CPU LOAD</span>
                      <span>{cpuUsage}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-cyan-500" animate={{ width: `${cpuUsage}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-mono opacity-60">
                      <span>MEMORY ALLOCATION</span>
                      <span>{ramUsage}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-purple-500" animate={{ width: `${ramUsage}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-mono opacity-60">
                      <span>NETWORK TRAFFIC</span>
                      <span>{networkTraffic} KB/s</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-green-500" animate={{ width: `${(networkTraffic/100)*100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Panel: Scanning */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="flex-1 bg-slate-900/50 p-6 border rounded-lg flex flex-col" style={{ borderColor: `${activeCoreColor}11` }}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] orbitron opacity-50">ACTIVE SCANNING</span>
                    <span className="font-mono text-sm" style={{ color: activeCoreColor }}>{Math.floor(scanProgress)}%</span>
                  </div>
                  
                  <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden mb-8">
                    <motion.div 
                      className="absolute top-0 left-0 h-full"
                      style={{ backgroundColor: activeCoreColor }}
                      animate={{ width: `${scanProgress}%` }}
                    />
                  </div>

                  <div className="flex-1 font-mono text-[10px] space-y-2 overflow-y-auto pr-2 scrollbar-none">
                    {threatLogs.map((log, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.2 }}
                        className="flex items-start gap-3"
                      >
                        <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                        <span className={i === threatLogs.length - 1 ? 'text-green-400 font-bold' : 'opacity-70'}>{log}</span>
                      </motion.div>
                    ))}
                    {isScanning && (
                      <div className="flex items-center gap-2 animate-pulse">
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: activeCoreColor }}></span>
                        <span style={{ color: activeCoreColor }}>Scanning sector {Math.floor(Math.random() * 9999)}...</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={startScan}
                    disabled={isScanning}
                    className="mt-6 w-full py-3 border orbitron text-[10px] tracking-widest hover:bg-white/5 transition-all disabled:opacity-50"
                    style={{ borderColor: `${activeCoreColor}44`, color: activeCoreColor }}
                  >
                    {isScanning ? 'SCAN IN PROGRESS' : 'RE-INITIALIZE SCAN'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-black/40 border-t flex items-center justify-between text-[8px] font-mono opacity-40 uppercase tracking-widest" style={{ borderColor: `${activeCoreColor}11` }}>
              <span>Encrypted via Stark-OS v4.2.0</span>
              <span>All rights reserved © Stark Industries</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SecurityDashboard;
