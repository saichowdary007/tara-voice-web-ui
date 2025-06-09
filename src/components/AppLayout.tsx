
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, LogOut, Mic, Settings } from 'lucide-react';
import VoiceAgentInterface from './VoiceAgentInterface';
import UserProfile from './UserProfile';
import { useToast } from '@/hooks/use-toast';

interface AppLayoutProps {
  onLogout: () => void;
}

type ActiveView = 'voice' | 'profile' | 'settings';

const AppLayout = ({ onLogout }: AppLayoutProps) => {
  const [activeView, setActiveView] = useState<ActiveView>('voice');
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Goodbye!",
      description: "You've been successfully logged out.",
    });
    onLogout();
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'voice':
        return <VoiceAgentInterface />;
      case 'profile':
        return <UserProfile />;
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Settings className="mx-auto mb-4 h-12 w-12" />
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p>Voice settings and preferences coming soon...</p>
            </div>
          </div>
        );
      default:
        return <VoiceAgentInterface />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-16 lg:w-64 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-bold text-lg bg-gradient-to-r from-ai-purple to-ai-blue bg-clip-text text-transparent">
                Tara
              </h1>
              <p className="text-xs text-muted-foreground">AI Voice Agent</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-2">
          <nav className="space-y-2">
            <Button
              variant={activeView === 'voice' ? 'secondary' : 'ghost'}
              className={`w-full justify-start ${
                activeView === 'voice' 
                  ? 'bg-ai-purple/10 text-ai-purple border-ai-purple/20' 
                  : 'hover:bg-secondary'
              }`}
              onClick={() => setActiveView('voice')}
            >
              <Mic className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Voice Chat</span>
            </Button>
            
            <Button
              variant={activeView === 'profile' ? 'secondary' : 'ghost'}
              className={`w-full justify-start ${
                activeView === 'profile' 
                  ? 'bg-ai-purple/10 text-ai-purple border-ai-purple/20' 
                  : 'hover:bg-secondary'
              }`}
              onClick={() => setActiveView('profile')}
            >
              <User className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Profile</span>
            </Button>
            
            <Button
              variant={activeView === 'settings' ? 'secondary' : 'ghost'}
              className={`w-full justify-start ${
                activeView === 'settings' 
                  ? 'bg-ai-purple/10 text-ai-purple border-ai-purple/20' 
                  : 'hover:bg-secondary'
              }`}
              onClick={() => setActiveView('settings')}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Settings</span>
            </Button>
          </nav>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-ai-purple text-primary-foreground">
                U
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-muted-foreground truncate">user@example.com</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline ml-2">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {renderActiveView()}
      </div>
    </div>
  );
};

export default AppLayout;
