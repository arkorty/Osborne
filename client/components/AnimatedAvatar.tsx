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
        'bg-gradient-to-r from-primary to-muted',
        'bg-[length:200%_200%]',
        'animate-gradient-flow',
        'animate-[spin_8s_linear_infinite]',
        className
      )}
    />
  );
};
