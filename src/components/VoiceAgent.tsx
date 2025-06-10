import React, { useState, useRef, useEffect } from 'react';
import { authService, createWebSocketConnection } from '../lib/api';
import { startRecording, stopRecording, playAudio, stopAudioPlayback } from '../lib/audio';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Mic, MicOff, Send, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

type AgentStatus = 
  | 'connecting' 
  | 'calibrating' 
  | 'listening' 
  | 'thinking' 
  | 'speaking' 
  | 'idle' 
  | 'error';

interface VoiceAgentProps {
  onSignOut?: () => void;
}

export function VoiceAgent({ onSignOut }: VoiceAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [textInput, setTextInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioQueue, setAudioQueue] = useState<Blob[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  const navigate = useNavigate();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check authentication on load
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/signin');
    } else {
      connectWebSocket();
    }
  }, [navigate]);

  // Connect WebSocket when authenticated
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Process audio queue
  useEffect(() => {
    if (audioQueue.length > 0 && !isMuted && agentStatus !== 'speaking') {
      playNextAudio();
    }
  }, [audioQueue, isMuted, agentStatus]);

  const connectWebSocket = () => {
    setAgentStatus('connecting');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAgentStatus('error');
        return;
      }
      
      const ws = createWebSocketConnection(token);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setAgentStatus('idle');
      };

      ws.onmessage = (event) => {
        // Check if the message is binary (audio)
        if (event.data instanceof Blob) {
          handleAudioMessage(event.data);
          return;
        }

        // Handle text messages
        try {
          const data = event.data;
          console.log('Received text:', data);
          
          if (data.startsWith('🎤 You said:')) {
            // This is a transcription confirmation, we already added the user message
            // We could update the placeholder message here if needed
            return;
          } else if (data.startsWith('🤔 Sorry, I didn\'t catch that.')) {
            setAgentStatus('idle');
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              type: 'agent',
              content: "Sorry, I didn't catch that. Could you try again?",
              timestamp: new Date()
            }]);
          } else if (data.startsWith('🤖 Thinking...')) {
            setAgentStatus('thinking');
          } else if (data.startsWith('💬 AI:')) {
            const content = data.substring(5).trim();
            const newMessage = {
              id: Date.now().toString(),
              type: 'agent' as const,
              content,
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, newMessage]);
            setAgentStatus('idle'); // Will change to 'speaking' when audio arrives
          } else {
            console.log('Unhandled message:', data);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setAgentStatus('idle');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setAgentStatus('error');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setAgentStatus('error');
    }
  };

  const handleAudioMessage = (audioBlob: Blob) => {
    // Add to audio queue
    setAudioQueue(prev => [...prev, audioBlob]);
    setAgentStatus('speaking');
  };

  const playNextAudio = () => {
    if (audioQueue.length === 0) return;
    
    const nextAudio = audioQueue[0];
    const audio = playAudio(nextAudio);
    audioRef.current = audio;
    
    audio.onended = () => {
      // Remove the played audio from the queue
      setAudioQueue(prev => prev.slice(1));
      setAgentStatus(prev => prev === 'speaking' && audioQueue.length <= 1 ? 'idle' : prev);
    };
  };

  const handleBargein = () => {
    // Stop current audio playback
    stopAudioPlayback(audioRef.current);

    // Clear audio queue and set status to listening
    setAudioQueue([]);
    setAgentStatus('listening');
  };

  const handleRecordingStart = async () => {
    // Implement barge-in by stopping any current audio playback
    handleBargein();
    
    try {
      const { mediaRecorder, stream } = await startRecording();
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      setIsRecording(true);
      setAgentStatus('listening');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setAgentStatus('error');
    }
  };

  const handleRecordingStop = async () => {
    if (!mediaRecorderRef.current || !streamRef.current) return;
    
    try {
      const audioBlob = await stopRecording(mediaRecorderRef.current, streamRef.current);
      setIsRecording(false);
      setAgentStatus('thinking');
      
      // Add user message immediately to improve perceived responsiveness
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: '...', // Will be updated when transcription arrives
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Send audio blob directly to WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(audioBlob);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setAgentStatus('error');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setAgentStatus('thinking');

    // Send text message to backend
    // Note: The current backend doesn't support text messages via WebSocket
    // This would need to be implemented on the backend
    
    setTextInput('');
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
    } else if (isMuted && audioQueue.length > 0) {
      playNextAudio();
    }
  };

  const handleSignOut = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    authService.signOut();
    
    if (onSignOut) {
      onSignOut();
    } else {
      navigate('/signin');
    }
  };

  const getStatusDetails = () => {
    switch (agentStatus) {
      case 'idle':
        return { label: 'Ready', color: 'bg-green-500' };
      case 'connecting':
        return { label: 'Connecting...', color: 'bg-blue-500 animate-pulse' };
      case 'calibrating':
        return { label: 'Calibrating Microphone...', color: 'bg-blue-500 animate-pulse' };
      case 'listening':
        return { label: 'Listening...', color: 'bg-blue-500 animate-pulse' };
      case 'thinking':
        return { label: 'Thinking...', color: 'bg-yellow-500 animate-pulse' };
      case 'speaking':
        return { label: 'Speaking...', color: 'bg-purple-500 animate-pulse' };
      case 'error':
        return { label: 'Error', color: 'bg-red-500' };
      default:
        return { label: 'Initializing...', color: 'bg-gray-500' };
    }
  };

  const statusDetails = getStatusDetails();

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-purple-600">Tara Voice Agent</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/profile')}
            className="flex items-center"
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="flex items-center"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="p-2 bg-slate-100 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${statusDetails.color}`}></div>
            <span>{statusDetails.label}</span>
          </div>
          
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={toggleMute}
            className="flex items-center"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h2 className="text-xl font-semibold mb-2">👋 Hello!</h2>
              <p>Start a conversation with Tara by speaking or typing a message.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
                  } rounded-lg p-3`}
                >
                  <div className="flex items-start">
                    <Avatar className="h-8 w-8 mr-2">
                      {message.type === 'user' ? '👤' : '🤖'}
                    </Avatar>
                    
                    <div>
                      <div className="font-medium">
                        {message.type === 'user' ? 'You' : 'Tara'}
                      </div>
                      <div>{message.content}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Section */}
      <Card className="p-4 border-t">
        <div className="flex flex-col space-y-4">
          {/* Voice Input */}
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                onClick={handleRecordingStart}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={agentStatus === 'connecting' || agentStatus === 'error'}
              >
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={handleRecordingStop}
                variant="destructive"
                className="animate-pulse"
              >
                <MicOff className="mr-2 h-5 w-5" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="flex space-x-2">
            <Input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              type="submit"
              disabled={!textInput.trim() || !isConnected}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
} 