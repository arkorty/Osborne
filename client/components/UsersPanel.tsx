import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';

interface ActiveUser {
  id: string;
  name: string;
  color: string;
  lastSeen: Date;
  isTyping?: boolean;
  currentLine?: number;
}

interface ActiveUsersPanelProps {
  isVisible: boolean;
  className?: string;
}

export const ActiveUsersPanel: React.FC<ActiveUsersPanelProps> = ({
  isVisible,
  className = ''
}) => {
  const [activeUsers] = useState<ActiveUser[]>([
    // Mock data for demonstration
    {
      id: '1',
      name: 'You',
      color: '#b8bb26',
      lastSeen: new Date(),
      isTyping: false,
      currentLine: 15,
    },
    {
      id: '2', 
      name: 'Alice',
      color: '#fb4934',
      lastSeen: new Date(Date.now() - 30000), // 30 seconds ago
      isTyping: true,
      currentLine: 8,
    },
    {
      id: '3',
      name: 'Bob',
      color: '#83a598',
      lastSeen: new Date(Date.now() - 120000), // 2 minutes ago
      isTyping: false,
      currentLine: 23,
    },
  ]);

  const getStatusIndicator = (user: ActiveUser) => {
    const timeDiff = Date.now() - user.lastSeen.getTime();
    if (timeDiff < 60000) { // Less than 1 minute
      return { status: 'online', color: 'rgb(184, 187, 38)' }; // success color
    } else if (timeDiff < 300000) { // Less than 5 minutes
      return { status: 'away', color: 'rgb(250, 189, 47)' }; // warning color
    } else {
      return { status: 'offline', color: 'rgb(146, 131, 116)' }; // muted color
    }
  };

  const formatLastSeen = (date: Date) => {
    const timeDiff = Date.now() - date.getTime();
    if (timeDiff < 60000) {
      return 'Just now';
    } else if (timeDiff < 3600000) {
      const minutes = Math.floor(timeDiff / 60000);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(timeDiff / 3600000);
      return `${hours}h ago`;
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`w-64 bg-card border border-border rounded-md shadow-lg flex flex-col ${className}`}>
      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-96">
        {activeUsers.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            <Users size={20} className="mx-auto mb-1 opacity-50" />
            <p className="text-xs">No users</p>
          </div>
        ) : (
          activeUsers.map((user) => {
            const { status, color } = getStatusIndicator(user);
            return (
              <Card key={user.id} className="bg-background border-border">
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <Circle
                          size={6}
                          className="absolute -bottom-0.5 -right-0.5 border border-background rounded-full"
                          style={{ color, fill: color }}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatLastSeen(user.lastSeen)}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 h-4"
                      style={{ borderColor: user.color, color: user.color }}
                    >
                      {status}
                    </Badge>
                  </div>
                  
                  {user.currentLine && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        L{user.currentLine}
                      </span>
                      {user.isTyping && (
                        <div className="flex space-x-1">
                          <div 
                            className="w-1 h-1 rounded-full animate-pulse"
                            style={{ backgroundColor: user.color }}
                          />
                          <div 
                            className="w-1 h-1 rounded-full animate-pulse"
                            style={{ 
                              backgroundColor: user.color,
                              animationDelay: '0.1s'
                            }}
                          />
                          <div 
                            className="w-1 h-1 rounded-full animate-pulse"
                            style={{ 
                              backgroundColor: user.color,
                              animationDelay: '0.2s'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Footer with total count */}
      <div className="p-2 border-t border-border bg-muted/50 rounded-b-md">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {activeUsers.filter(u => getStatusIndicator(u).status === 'online').length} online
          </span>
          <span>
            {activeUsers.filter(u => u.isTyping).length} typing
          </span>
        </div>
      </div>
    </div>
  );
};