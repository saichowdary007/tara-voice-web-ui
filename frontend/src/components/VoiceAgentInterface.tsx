
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Type, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import ThreeGlobe from './ThreeGlobe';

type AgentStatus = 'idle' | 'connecting' | 'calibrating' | 'listening' | 'thinking' | 'speaking';

interface VoiceSession {
  id: string;
  startTime: Date;
  lastActivity: Date;
}

const VoiceAgentInterface = () => {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [session, setSession] = useState<VoiceSession | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize voice session
    setSession({
      id: Date.now().toString(),
      startTime: new Date(),
      lastActivity: new Date()
    });
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connecting to Tara...';
      case 'calibrating': return 'Calibrating microphone...';
      case 'listening': return 'Listening - speak now';
      case 'thinking': return 'Tara is thinking...';
      case 'speaking': return 'Tara is speaking';
      default: return 'Ready - tap to start talking';
    }
  };

  const getStatusSubtext = () => {
    if (status === 'idle') return 'Your AI voice assistant is ready for natural conversation';
    if (status === 'listening') return 'Speak naturally, I\'m listening...';
    if (status === 'thinking') return 'Processing your request...';
    if (status === 'speaking') return 'Playing response...';
    return '';
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      setStatus('thinking');
      
      // Update session activity
      if (session) {
        setSession({
          ...session,
          lastActivity: new Date()
        });
      }
      
      // Simulate processing and response
      setTimeout(() => {
        setStatus('speaking');
        
        // Simulate speaking duration
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      }, 1500);
    } else {
      try {
        setStatus('calibrating');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setStatus('listening');
        setIsRecording(true);
        
        toast({
          title: "Listening started",
          description: "Speak naturally - Tara is listening",
        });
      } catch (error) {
        toast({
          title: "Microphone access needed",
          description: "Please allow microphone access to talk with Tara",
          variant: "destructive",
        });
        setStatus('idle');
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setStatus('thinking');
    setTextInput('');
    setShowTextInput(false);

    // Update session activity
    if (session) {
      setSession({
        ...session,
        lastActivity: new Date()
      });
    }

    // Simulate response
    setTimeout(() => {
      setStatus('speaking');
      setTimeout(() => {
        setStatus('idle');
      }, 2500);
    }, 1000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Audio enabled" : "Audio muted",
      description: isMuted ? "You can now hear Tara's responses" : "Tara's voice is now muted",
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-ai-purple to-ai-blue bg-clip-text text-transparent">
            Tara
          </h1>
          <p className="text-sm text-muted-foreground">AI Voice Assistant</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTextInput(!showTextInput)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        {/* Three.js Globe */}
        <ThreeGlobe status={status} isRecording={isRecording} />
        
        {/* Status Text */}
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-semibold">{getStatusText()}</h2>
          <p className="text-muted-foreground text-sm">{getStatusSubtext()}</p>
        </div>

        {/* Voice Control Button */}
        <Button
          onClick={handleVoiceInput}
          size="lg"
          className={`
            h-16 w-16 rounded-full transition-all duration-200 relative
            ${isRecording || status === 'listening' 
              ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25' 
              : status === 'thinking' || status === 'speaking'
              ? 'bg-muted cursor-not-allowed'
              : 'bg-ai-purple hover:bg-ai-purple/90 shadow-lg shadow-ai-purple/25'
            }
          `}
          disabled={status === 'thinking' || status === 'speaking'}
        >
          {isRecording ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
          
          {/* Pulse effect when listening */}
          {(isRecording || status === 'listening') && (
            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
          )}
        </Button>

        {/* Session Info */}
        {session && (
          <div className="text-xs text-muted-foreground text-center">
            Session active since {session.startTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Text Input (when toggled) */}
      {showTextInput && (
        <div className="p-4 border-t border-border/50 bg-secondary/20">
          <form onSubmit={handleTextSubmit} className="flex space-x-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message to Tara..."
              className="flex-1 bg-background border-border focus:border-ai-purple"
              disabled={status === 'thinking' || status === 'speaking'}
            />
            <Button 
              type="submit"
              disabled={!textInput.trim() || status === 'thinking' || status === 'speaking'}
              className="bg-ai-purple hover:bg-ai-purple/90"
            >
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VoiceAgentInterface;
