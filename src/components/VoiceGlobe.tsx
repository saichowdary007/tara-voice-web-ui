
import React, { useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface VoiceGlobeProps {
  status: 'idle' | 'connecting' | 'calibrating' | 'listening' | 'thinking' | 'speaking';
  isRecording: boolean;
}

const VoiceGlobe = ({ status, isRecording }: VoiceGlobeProps) => {
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const globe = globeRef.current;
    
    // Create floating particles for ambient effect
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-ai-purple/30 rounded-full animate-pulse';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 2 + 's';
      globe.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 3000);
    };

    let particleInterval: NodeJS.Timeout;
    
    if (status === 'listening' || status === 'speaking') {
      particleInterval = setInterval(createParticle, 200);
    }

    return () => {
      if (particleInterval) {
        clearInterval(particleInterval);
      }
    };
  }, [status]);

  const getGlobeSize = () => {
    switch (status) {
      case 'listening': return 'w-48 h-48';
      case 'thinking': return 'w-44 h-44';
      case 'speaking': return 'w-52 h-52';
      default: return 'w-40 h-40';
    }
  };

  const getGlobeAnimation = () => {
    switch (status) {
      case 'connecting':
      case 'calibrating': return 'animate-spin';
      case 'listening': return 'listening-pulse';
      case 'thinking': return 'pulse-glow animate-pulse';
      case 'speaking': return 'animate-bounce';
      default: return 'animate-pulse';
    }
  };

  const getGlobeColor = () => {
    switch (status) {
      case 'listening': return 'text-green-400';
      case 'thinking': return 'text-yellow-400';
      case 'speaking': return 'text-ai-purple';
      case 'connecting':
      case 'calibrating': return 'text-ai-blue';
      default: return 'text-ai-purple/70';
    }
  };

  const getGlowEffect = () => {
    switch (status) {
      case 'listening': return 'shadow-[0_0_50px_rgba(34,197,94,0.5)]';
      case 'thinking': return 'shadow-[0_0_50px_rgba(251,191,36,0.5)]';
      case 'speaking': return 'shadow-[0_0_50px_rgba(139,92,246,0.5)]';
      default: return 'shadow-[0_0_30px_rgba(139,92,246,0.3)]';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring effect */}
      <div 
        className={`absolute rounded-full border-2 transition-all duration-500 ${
          status === 'listening' ? 'border-green-400/30 scale-150' :
          status === 'thinking' ? 'border-yellow-400/30 scale-125' :
          status === 'speaking' ? 'border-ai-purple/30 scale-175' :
          'border-ai-purple/20 scale-100'
        } ${getGlobeSize()} ${status === 'listening' || status === 'speaking' ? 'animate-ping' : ''}`}
      />
      
      {/* Middle ring */}
      <div 
        className={`absolute rounded-full border transition-all duration-300 ${
          status === 'listening' ? 'border-green-400/50 scale-125' :
          status === 'thinking' ? 'border-yellow-400/50 scale-110' :
          status === 'speaking' ? 'border-ai-purple/50 scale-140' :
          'border-ai-purple/30 scale-105'
        } ${getGlobeSize()}`}
      />

      {/* Main globe container */}
      <div 
        ref={globeRef}
        className={`relative rounded-full bg-gradient-to-br from-ai-purple/20 to-ai-blue/20 backdrop-blur-sm border border-ai-purple/30 flex items-center justify-center transition-all duration-300 ${getGlobeSize()} ${getGlobeAnimation()} ${getGlowEffect()}`}
      >
        {/* Globe icon */}
        <Globe 
          className={`transition-all duration-300 ${getGlobeColor()}`}
          size={status === 'speaking' ? 80 : status === 'listening' ? 72 : 64}
          strokeWidth={status === 'listening' || status === 'speaking' ? 1.5 : 2}
        />

        {/* Inner glow effect */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${
          status === 'listening' ? 'from-green-400/10 to-transparent' :
          status === 'thinking' ? 'from-yellow-400/10 to-transparent' :
          status === 'speaking' ? 'from-ai-purple/20 to-transparent' :
          'from-ai-purple/10 to-transparent'
        }`} />
      </div>

      {/* Voice wave indicators for speaking */}
      {status === 'speaking' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full border-2 border-ai-purple/20 animate-ping`}
              style={{
                width: `${200 + i * 50}px`,
                height: `${200 + i * 50}px`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceGlobe;
