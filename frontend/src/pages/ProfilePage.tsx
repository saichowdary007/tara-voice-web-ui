import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, ChevronLeft, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, profileService } from '@/lib/api';

interface ProfileFact {
  key: string;
  value: string;
}

export default function ProfilePage() {
  const [profileFacts, setProfileFacts] = useState<ProfileFact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/signin');
      return;
    }
    
    fetchProfileData();
  }, [navigate]);

  const fetchProfileData = async () => {
    try {
      const response = await profileService.getUserProfile();
      setProfileFacts(response.profile_facts || []);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        // Unauthorized, redirect to login
        authService.signOut();
        navigate('/signin');
      } else {
        setError('Failed to load profile data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    authService.signOut();
    navigate('/signin');
  };

  const handleEditFact = async (key: string, newValue: string) => {
    try {
      await profileService.updateUserFact(key, newValue);
      
      // Update the local state
      setProfileFacts(prev => 
        prev.map(fact => 
          fact.key === key ? { ...fact, value: newValue } : fact
        )
      );
    } catch (err) {
      console.error('Error updating fact:', err);
      setError('Failed to update fact');
    }
  };

  const handleDeleteFact = async (key: string) => {
    try {
      await profileService.deleteUserFact(key);
      
      // Update the local state
      setProfileFacts(prev => prev.filter(fact => fact.key !== key));
    } catch (err) {
      console.error('Error deleting fact:', err);
      setError('Failed to delete fact');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Chat
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
        
        <Card className="mb-6">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Your Profile</CardTitle>
            <CardDescription className="text-center">
              Information Tara has learned about you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : profileFacts.length === 0 ? (
              <div className="text-center py-6">
                <p>Tara hasn't learned anything about you yet.</p>
                <p className="mt-2">Try having a conversation to build your profile!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profileFacts.map((fact) => (
                  <div 
                    key={fact.key} 
                    className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                          {fact.key}
                        </div>
                        <div className="text-lg">
                          {fact.value}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newValue = prompt("Edit fact:", fact.value);
                            if (newValue !== null && newValue !== fact.value) {
                              handleEditFact(fact.key, newValue);
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete "${fact.key}"?`)) {
                              handleDeleteFact(fact.key);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 