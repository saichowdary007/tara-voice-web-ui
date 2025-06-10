
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type AgentStatus = 'idle' | 'connecting' | 'calibrating' | 'listening' | 'thinking' | 'speaking';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const ConversationInterface = () => {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStatusText = () => {
    switch (status) {
      case 'connecting': return 'Connecting...';
      case 'calibrating': return 'Calibrating Microphone...';
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready to chat';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return 'text-green-400';
      case 'thinking': return 'text-yellow-400';
      case 'speaking': return 'text-ai-purple';
      case 'connecting':
      case 'calibrating': return 'text-ai-blue';
      default: return 'text-muted-foreground';
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      setStatus('thinking');
      
      // Simulate processing
      setTimeout(() => {
        setStatus('speaking');
        const agentMessage: Message = {
          id: Date.now().toString(),
          type: 'agent',
          content: "I heard you! I'm ready to help with whatever you need. This is a demo response from Tara.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
        
        setTimeout(() => {
          setStatus('idle');
        }, 2000);
      }, 1500);
    } else {
      try {
        setStatus('calibrating');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setStatus('listening');
        setIsRecording(true);
        
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: "Voice message recorded",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        
        toast({
          title: "Recording started",
          description: "Speak now - click the mic again to stop",
        });
      } catch (error) {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice features",
          variant: "destructive",
        });
        setStatus('idle');
      }
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
    setTextInput('');
    setStatus('thinking');

    // Simulate agent response
    setTimeout(() => {
      setStatus('idle');
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `Thanks for your message: "${textInput}". I'm here to help! This is a demo response from Tara.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="flex items-center justify-center p-4 border-b border-border">
        <div className={`text-sm font-medium ${getStatusColor()} transition-colors duration-200`}>
          {getStatusText()}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="mx-auto mb-4 h-12 w-12 text-ai-purple" />
            <h3 className="text-lg font-semibold mb-2">Hi, I'm Tara!</h3>
            <p>Your ultra-fast AI voice assistant. Click the microphone to start talking or type a message below.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <Card className={`max-w-[80%] p-4 ${
                message.type === 'user' 
                  ? 'bg-ai-purple text-primary-foreground' 
                  : 'bg-card border-border'
              }`}>
                <div className="flex items-start space-x-3">
                  {message.type === 'agent' && (
                    <Bot className="h-5 w-5 text-ai-purple mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.type === 'user' && (
                    <User className="h-5 w-5 text-primary-foreground mt-0.5 flex-shrink-0" />
                  )}
                </div>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-4">
          {/* Voice Input Button */}
          <Button
            onClick={handleVoiceInput}
            variant="outline"
            size="lg"
            className={`
              relative h-14 w-14 rounded-full border-2 transition-all duration-200
              ${isRecording || status === 'listening' 
                ? 'border-green-400 bg-green-400/10 listening-pulse' 
                : 'border-ai-purple hover:border-ai-purple hover:bg-ai-purple/10'
              }
              ${status === 'thinking' ? 'pulse-glow' : ''}
            `}
            disabled={status === 'thinking' || status === 'speaking'}
          >
            {isRecording ? (
              <MicOff className="h-6 w-6 text-green-400" />
            ) : (
              <Mic className={`h-6 w-6 ${
                status === 'listening' ? 'text-green-400' : 'text-ai-purple'
              }`} />
            )}
          </Button>

          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex space-x-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-secondary border-border focus:border-ai-purple transition-colors"
              disabled={status === 'thinking' || status === 'speaking'}
            />
            <Button 
              type="submit" 
              size="lg"
              className="bg-ai-purple hover:bg-ai-purple/90 text-primary-foreground"
              disabled={!textInput.trim() || status === 'thinking' || status === 'speaking'}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConversationInterface;
