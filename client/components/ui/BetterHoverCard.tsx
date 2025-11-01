"use client";

import * as React from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface CustomHoverCardProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  holdDelay?: number;
  contentClassName?: string;
}

// Context for managing mutually exclusive hover cards
const HoverCardContext = React.createContext<{
  openId: string | null;
  setOpenId: (id: string | null) => void;
}>({
  openId: null,
  setOpenId: () => {},
});

export const BetterHoverCard = ({ trigger, children, holdDelay = 600, contentClassName }: CustomHoverCardProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTouchHeld, setIsTouchHeld] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout>();
  const isTouchDevice = React.useMemo(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0), []);
  const idRef = React.useRef(Math.random().toString(36).substr(2, 9));
  const { openId, setOpenId } = React.useContext(HoverCardContext);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTouchDevice && e.pointerType === 'touch') {
      e.currentTarget.addEventListener('contextmenu', (e) => e.preventDefault(), { once: true });
      timerRef.current = setTimeout(() => {
        setIsOpen(true);
        setIsTouchHeld(true);
        setOpenId(idRef.current);
      }, holdDelay);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isTouchDevice && e.pointerType === 'touch') {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (isTouchDevice && open && !isTouchHeld) {
      return; // Ignore open on tap for touch devices
    }
    if (open) {
      setOpenId(idRef.current);
    } else if (openId === idRef.current) {
      setOpenId(null);
    }
    setIsOpen(open);
    if (!open) {
      setIsTouchHeld(false);
    }
  };

  // Sync isOpen with context
  React.useEffect(() => {
    setIsOpen(openId === idRef.current);
  }, [openId]);

  return (
    <HoverCard open={isOpen} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent className={cn(contentClassName)}>
        {children}
      </HoverCardContent>
    </HoverCard>
  );
};

// Provider component to wrap the app or relevant section
export const HoverCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <HoverCardContext.Provider value={{ openId, setOpenId }}>
      {children}
    </HoverCardContext.Provider>
  );
};
