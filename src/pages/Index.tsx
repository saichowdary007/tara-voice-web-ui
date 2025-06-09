
import React, { useState } from 'react';
import AuthPage from '@/components/AuthPage';
import AppLayout from '@/components/AppLayout';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        <AppLayout onLogout={handleLogout} />
      ) : (
        <AuthPage onAuthenticated={handleAuthenticated} />
      )}
    </div>
  );
};

export default Index;
