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
import { ThemeProvider } from "next-themes";
import {
  VSCODE_THEMES,
  getThemeById,
  applyTheme,
  saveThemeToCookie,
  getThemeFromCookie,
} from "@/lib/themes";

const Home = () => {
  const router = useRouter();
  const [newRoomCode, setNewRoomCode] = useState("");
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const nextTheme = useCallback(() => {
    setCurrentThemeIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % VSCODE_THEMES.length;
      const theme = VSCODE_THEMES[newIndex];
      applyTheme(theme);
      saveThemeToCookie(theme.id);
      return newIndex;
    });
  }, []);

  const prevTheme = useCallback(() => {
    setCurrentThemeIndex((prevIndex) => {
      const newIndex = prevIndex === 0
        ? VSCODE_THEMES.length - 1
        : prevIndex - 1;
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
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevTheme();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextTheme();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [nextTheme, prevTheme]);

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
      <Card className="relative z-10 max-w-md min-w-96 backdrop-blur-sm shadow-lg bg-card/0 bg-opacity-0 dark:bg-card/70 border border-border dark:border-border  p-6 flex flex-col items-center">
        {/* Theme Slider - Simple Version */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between bg-card rounded-lg p-3 border">
            <button
              onClick={prevTheme}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Previous theme"
            >
              ←
            </button>

            <div className="text-center flex-1 mx-4">
              <div className="text-sm font-medium text-foreground">
                {currentTheme.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentThemeIndex + 1} of {VSCODE_THEMES.length}
              </div>
            </div>

            <button
              onClick={nextTheme}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Next theme"
            >
              →
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-6xl font-bold text-foreground mb-4">
            Osborne
          </h1>
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
        </CardContent>
      </Card>
    </div>
  );
};

const HomeWrapper = () => (
  <ThemeProvider attribute="class" defaultTheme="dark">
    <Home />
  </ThemeProvider>
);

export default HomeWrapper;
