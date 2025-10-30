"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { ThemeProvider } from "next-themes";
import {
  VSCODE_THEMES,
  getThemeById,
  applyTheme,
  saveThemeToCookie,
  getThemeFromCookie,
} from "@/lib/themes";
import { LegalFooter } from "@/components/Footer";
import { DMCAModalComponent } from "@/components/DMCAModal";
import { DisclaimerModalComponent } from "@/components/DisclaimerModal";

const Home = () => {
  const router = useRouter();
  const [newRoomCode, setNewRoomCode] = useState("");
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isDMCAOpen, setIsDMCAOpen] = useState(false);

  const nextTheme = useCallback(() => {
    setCurrentThemeIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % VSCODE_THEMES.length;
      const theme = VSCODE_THEMES[newIndex];
      applyTheme(theme);
      saveThemeToCookie(theme.id);
      return newIndex;
    });
  }, []);

  useEffect(() => {
    setIsClient(true);

    // Initialize theme from cookie
    const savedThemeId = getThemeFromCookie();
    if (savedThemeId) {
      const themeIndex = VSCODE_THEMES.findIndex(
        (theme) => theme.id === savedThemeId
      );
      if (themeIndex !== -1) {
        setCurrentThemeIndex(themeIndex);
        const theme = getThemeById(savedThemeId);
        if (theme) {
          applyTheme(theme);
        }
      }
    } else {
      // Apply default theme (first in array)
      const defaultTheme = VSCODE_THEMES[0];
      applyTheme(defaultTheme);
    }

    // Simple keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextTheme();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [nextTheme]);

  useEffect(() => {
    const joinRoom = () => {
      if (newRoomCode) {
        router.push(`/room?code=${newRoomCode.toUpperCase()}`);
      }
    };

    if (newRoomCode.length === 6) {
      joinRoom();
    }
  }, [newRoomCode, router]);

  const createNewRoom = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    router.push(`/room?code=${code}`);
  };

  if (!isClient) {
    return null;
  }

  const currentTheme = VSCODE_THEMES[currentThemeIndex];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background dark:bg-background ui-font">
      <Card className="relative z-10 px-12 py-24 backdrop-blur-sm shadow-lg bg-card/0 bg-opacity-0 dark:bg-card/70 border border-border dark:border-border flex flex-col items-center">
        <div className="flex flex-col items-center">
          <h1 className="text-8xl translate-x-1.5 font-bold text-foreground mb-4">
            Osborne
          </h1>
        </div>

        {/* Theme Switcher - Pill Button */}
        <div className="mb-12">
          <button
            onClick={nextTheme}
            className="px-4 min-w-36 py-2 bg-muted hover:bg-muted/80 rounded-full text-sm font-medium text-foreground transition-colors border border-border/50 hover:border-border"
            aria-label="Switch to next theme"
          >
            {currentTheme.name}
          </button>
        </div>

        <CardContent className="flex flex-col items-center space-y-4 ui-font">
          <InputOTP
            value={newRoomCode}
            onChange={(value) => setNewRoomCode(value.toUpperCase())}
            maxLength={6}
            pattern="[A-Z0-9]*"
            inputMode="text"
          >
            <InputOTPGroup>
              {[...Array(6)].map((_, index) => (
                <InputOTPSlot key={index} index={index} className="otp-input" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <span className="text-xl text-foreground/70 ui-font font-medium">
            or
          </span>
          <Button
            onClick={createNewRoom}
            variant="default"
            className="w-min bg-primary text-primary-foreground text-xl font-semibold hover:bg-primary/80 ui-font px-6 py-3"
          >
            Create Room
          </Button>

          {/* Attribution */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              made with <Heart className="inline w-4 h-4 text-red-500 mx-1" />{" "}
              by{" "}
              <a
                href="https://webark.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                WebArk
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
      <LegalFooter
        onDisclaimerOpen={() => setIsDisclaimerOpen(true)}
        onDMCAOpen={() => setIsDMCAOpen(true)}
      />

      {/* Modals */}
      <DisclaimerModalComponent
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
      <DMCAModalComponent
        isOpen={isDMCAOpen}
        onClose={() => setIsDMCAOpen(false)}
      />
    </div>
  );
};

const HomeWrapper = () => (
  <ThemeProvider attribute="class" defaultTheme="dark">
    <Home />
  </ThemeProvider>
);

export default HomeWrapper;
