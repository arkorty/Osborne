import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedAvatarProps {
  className?: string;
}

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full',
        'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500',
        'bg-[length:200%_200%]',
        'animate-gradient-flow',
        className
      )}
    />
  );
};
