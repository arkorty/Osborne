import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
      isConnected 
        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
    } ${className}`}>
      {isConnected ? (
        <Wifi size={14} />
      ) : (
        <WifiOff size={14} />
      )}
    </div>
  );
};