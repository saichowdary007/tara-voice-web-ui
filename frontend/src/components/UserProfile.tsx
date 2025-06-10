
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Edit2, Save, X, Plus } from 'lucide-react';

interface UserFact {
  key: string;
  value: string;
}

const UserProfile = () => {
  const [userFacts, setUserFacts] = useState<UserFact[]>([
    { key: 'name', value: 'John Doe' },
    { key: 'location', value: 'San Francisco, CA' },
    { key: 'occupation', value: 'Software Engineer' },
    { key: 'interests', value: 'AI, Technology, Music' },
  ]);
  
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const handleSave = (key: string) => {
    setUserFacts(prev => 
      prev.map(fact => 
        fact.key === key ? { ...fact, value: editValue } : fact
      )
    );
    setEditingKey(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleDelete = (key: string) => {
    setUserFacts(prev => prev.filter(fact => fact.key !== key));
  };

  const handleAddNew = () => {
    if (newKey && newValue) {
      setUserFacts(prev => [...prev, { key: newKey, value: newValue }]);
      setNewKey('');
      setNewValue('');
      setIsAddingNew(false);
    }
  };

  const handleCancelAdd = () => {
    setNewKey('');
    setNewValue('');
    setIsAddingNew(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center space-x-3 mb-2">
          <User className="h-8 w-8 text-ai-purple" />
          <span>Your Profile</span>
        </h1>
        <p className="text-muted-foreground">
          This is what Tara has learned about you during your conversations.
        </p>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Personal Information
            <Badge variant="secondary" className="text-ai-purple">
              {userFacts.length} facts stored
            </Badge>
          </CardTitle>
          <CardDescription>
            Tara learns and remembers details about you to provide more personalized assistance.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {userFacts.map((fact) => (
            <div
              key={fact.key}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/50"
            >
              <div className="flex-1">
                <Label className="text-sm font-medium capitalize text-foreground">
                  {fact.key.replace(/_/g, ' ')}
                </Label>
                {editingKey === fact.key ? (
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="mt-1 bg-background border-border focus:border-ai-purple"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{fact.value}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {editingKey === fact.key ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSave(fact.key)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(fact.key, fact.value)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(fact.key)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add New Fact */}
          {isAddingNew ? (
            <div className="p-4 rounded-lg border border-dashed border-ai-purple bg-ai-purple/5">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Fact Name</Label>
                  <Input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="e.g., favorite_food, hobby, etc."
                    className="mt-1 bg-background border-border focus:border-ai-purple"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Value</Label>
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter the value..."
                    className="mt-1 bg-background border-border focus:border-ai-purple"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleAddNew}
                    disabled={!newKey || !newValue}
                    className="bg-ai-purple hover:bg-ai-purple/90 text-primary-foreground"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Add Fact
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAdd}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsAddingNew(true)}
              className="w-full border-dashed border-ai-purple text-ai-purple hover:bg-ai-purple/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Fact
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-amber-500">Privacy & Data</CardTitle>
          <CardDescription>
            Your data is stored securely and is only used to improve your experience with Tara.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>All data is encrypted and stored securely</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Information is only used to personalize your experience</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>You can edit or delete any stored information at any time</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
