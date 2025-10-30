// Top 10 VS Code themes with their color schemes
export interface ThemeConfig {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover?: string;
    popoverForeground?: string;
    border: string;
    primary: string;
    primaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
  };
}

export const VSCODE_THEMES: ThemeConfig[] = [
  {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    type: 'dark',
    colors: {
      background: 'hsl(220, 13%, 18%)',
      foreground: 'hsl(220, 9%, 55%)',
      card: 'hsl(220, 13%, 20%)',
      cardForeground: 'hsl(220, 9%, 55%)',
      popover: 'hsl(220, 13%, 20%)',
      popoverForeground: 'hsl(220, 9%, 55%)',
      border: 'hsl(220, 13%, 25%)',
      primary: 'hsl(187, 47%, 55%)',
      primaryForeground: 'hsl(220, 13%, 18%)',
      muted: 'hsl(220, 13%, 22%)',
      mutedForeground: 'hsl(220, 9%, 40%)',
      accent: 'hsl(220, 13%, 22%)',
      accentForeground: 'hsl(220, 9%, 55%)',
      destructive: 'hsl(355, 65%, 65%)',
      destructiveForeground: 'hsl(220, 13%, 18%)',
    }
  },
  {
    id: 'dracula',
    name: 'Dracula Official',
    type: 'dark',
    colors: {
      background: 'hsl(231, 15%, 18%)',
      foreground: 'hsl(60, 30%, 96%)',
      card: 'hsl(232, 14%, 20%)',
      cardForeground: 'hsl(60, 30%, 96%)',
      border: 'hsl(231, 11%, 27%)',
      primary: 'hsl(265, 89%, 78%)',
      primaryForeground: 'hsl(231, 15%, 18%)',
      muted: 'hsl(232, 14%, 22%)',
      mutedForeground: 'hsl(233, 15%, 41%)',
      accent: 'hsl(232, 14%, 22%)',
      accentForeground: 'hsl(60, 30%, 96%)',
      destructive: 'hsl(0, 100%, 67%)',
      destructiveForeground: 'hsl(231, 15%, 18%)',
    }
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    type: 'dark',
    colors: {
      background: 'hsl(220, 13%, 9%)',
      foreground: 'hsl(213, 13%, 93%)',
      card: 'hsl(215, 28%, 17%)',
      cardForeground: 'hsl(213, 13%, 93%)',
      border: 'hsl(240, 3%, 25%)',
      primary: 'hsl(212, 92%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(215, 28%, 17%)',
      mutedForeground: 'hsl(217, 10%, 64%)',
      accent: 'hsl(215, 28%, 17%)',
      accentForeground: 'hsl(213, 13%, 93%)',
      destructive: 'hsl(0, 73%, 57%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
    }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    type: 'light',
    colors: {
      background: 'hsl(0, 0%, 99%)',
      foreground: 'hsl(213, 13%, 27%)',
      card: 'hsl(210, 29%, 97%)',
      cardForeground: 'hsl(213, 13%, 27%)',
      border: 'hsl(214, 18%, 86%)',
      primary: 'hsl(212, 92%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(214, 32%, 91%)',
      mutedForeground: 'hsl(213, 7%, 46%)',
      accent: 'hsl(214, 32%, 91%)',
      accentForeground: 'hsl(213, 13%, 27%)',
      destructive: 'hsl(357, 79%, 65%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
      background: 'hsl(220, 16%, 22%)',
      foreground: 'hsl(218, 27%, 94%)',
      card: 'hsl(220, 17%, 25%)',
      cardForeground: 'hsl(218, 27%, 94%)',
      border: 'hsl(220, 16%, 36%)',
      primary: 'hsl(213, 32%, 52%)',
      primaryForeground: 'hsl(220, 16%, 22%)',
      muted: 'hsl(220, 17%, 28%)',
      mutedForeground: 'hsl(220, 9%, 46%)',
      accent: 'hsl(220, 17%, 28%)',
      accentForeground: 'hsl(218, 27%, 94%)',
      destructive: 'hsl(354, 42%, 56%)',
      destructiveForeground: 'hsl(220, 16%, 22%)',
    }
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    type: 'dark',
    colors: {
      background: 'hsl(207, 26%, 17%)',
      foreground: 'hsl(207, 6%, 76%)',
      card: 'hsl(207, 26%, 19%)',
      cardForeground: 'hsl(207, 6%, 76%)',
      border: 'hsl(207, 26%, 25%)',
      primary: 'hsl(194, 100%, 70%)',
      primaryForeground: 'hsl(207, 26%, 17%)',
      muted: 'hsl(207, 26%, 21%)',
      mutedForeground: 'hsl(207, 6%, 56%)',
      accent: 'hsl(207, 26%, 21%)',
      accentForeground: 'hsl(207, 6%, 76%)',
      destructive: 'hsl(5, 74%, 59%)',
      destructiveForeground: 'hsl(207, 26%, 17%)',
    }
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    type: 'dark',
    colors: {
      background: 'hsl(60, 3%, 15%)',
      foreground: 'hsl(60, 5%, 96%)',
      card: 'hsl(60, 3%, 17%)',
      cardForeground: 'hsl(60, 5%, 96%)',
      border: 'hsl(60, 3%, 22%)',
      primary: 'hsl(81, 73%, 55%)',
      primaryForeground: 'hsl(60, 3%, 15%)',
      muted: 'hsl(60, 3%, 19%)',
      mutedForeground: 'hsl(60, 2%, 45%)',
      accent: 'hsl(60, 3%, 19%)',
      accentForeground: 'hsl(60, 5%, 96%)',
      destructive: 'hsl(0, 90%, 67%)',
      destructiveForeground: 'hsl(60, 3%, 15%)',
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    type: 'dark',
    colors: {
      background: 'hsl(243, 23%, 12%)',
      foreground: 'hsl(225, 27%, 90%)',
      card: 'hsl(243, 23%, 15%)',
      cardForeground: 'hsl(225, 27%, 90%)',
      border: 'hsl(243, 23%, 20%)',
      primary: 'hsl(265, 97%, 78%)',
      primaryForeground: 'hsl(243, 23%, 12%)',
      muted: 'hsl(243, 23%, 17%)',
      mutedForeground: 'hsl(225, 14%, 53%)',
      accent: 'hsl(243, 23%, 17%)',
      accentForeground: 'hsl(225, 27%, 90%)',
      destructive: 'hsl(0, 100%, 74%)',
      destructiveForeground: 'hsl(243, 23%, 12%)',
    }
  },
  {
    id: 'ayu-dark',
    name: 'Ayu Dark',
    type: 'dark',
    colors: {
      background: 'hsl(213, 14%, 12%)',
      foreground: 'hsl(60, 12%, 79%)',
      card: 'hsl(213, 14%, 15%)',
      cardForeground: 'hsl(60, 12%, 79%)',
      border: 'hsl(213, 14%, 20%)',
      primary: 'hsl(39, 100%, 81%)',
      primaryForeground: 'hsl(213, 14%, 12%)',
      muted: 'hsl(213, 14%, 17%)',
      mutedForeground: 'hsl(213, 14%, 40%)',
      accent: 'hsl(213, 14%, 17%)',
      accentForeground: 'hsl(60, 12%, 79%)',
      destructive: 'hsl(3, 100%, 69%)',
      destructiveForeground: 'hsl(213, 14%, 12%)',
    }
  },
  {
    id: 'synthwave-84',
    name: 'SynthWave \'84',
    type: 'dark',
    colors: {
      background: 'hsl(308, 56%, 4%)',
      foreground: 'hsl(0, 0%, 88%)',
      card: 'hsl(308, 56%, 6%)',
      cardForeground: 'hsl(0, 0%, 88%)',
      border: 'hsl(308, 56%, 12%)',
      primary: 'hsl(290, 100%, 75%)',
      primaryForeground: 'hsl(308, 56%, 4%)',
      muted: 'hsl(308, 56%, 8%)',
      mutedForeground: 'hsl(308, 26%, 35%)',
      accent: 'hsl(308, 56%, 8%)',
      accentForeground: 'hsl(0, 0%, 88%)',
      destructive: 'hsl(330, 100%, 74%)',
      destructiveForeground: 'hsl(308, 56%, 4%)',
    }
  },
  {
    id: 'light-plus',
    name: 'Light+ (default light)',
    type: 'light',
    colors: {
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(240, 10%, 4%)',
      card: 'hsl(0, 0%, 98%)',
      cardForeground: 'hsl(240, 10%, 4%)',
      border: 'hsl(214, 32%, 91%)',
      primary: 'hsl(210, 98%, 50%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(210, 40%, 96%)',
      mutedForeground: 'hsl(215, 16%, 47%)',
      accent: 'hsl(210, 40%, 96%)',
      accentForeground: 'hsl(240, 10%, 4%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
    }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    type: 'dark',
    colors: {
      background: 'hsl(70, 8%, 15%)',
      foreground: 'hsl(60, 30%, 96%)',
      card: 'hsl(70, 8%, 17%)',
      cardForeground: 'hsl(60, 30%, 96%)',
      border: 'hsl(70, 8%, 22%)',
      primary: 'hsl(81, 100%, 74%)',
      primaryForeground: 'hsl(70, 8%, 15%)',
      muted: 'hsl(70, 8%, 19%)',
      mutedForeground: 'hsl(55, 8%, 45%)',
      accent: 'hsl(70, 8%, 19%)',
      accentForeground: 'hsl(60, 30%, 96%)',
      destructive: 'hsl(0, 94%, 74%)',
      destructiveForeground: 'hsl(70, 8%, 15%)',
    }
  },
  {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    type: 'dark',
    colors: {
      background: 'hsl(220, 13%, 18%)',
      foreground: 'hsl(220, 9%, 55%)',
      card: 'hsl(220, 13%, 20%)',
      cardForeground: 'hsl(220, 9%, 55%)',
      border: 'hsl(220, 13%, 25%)',
      primary: 'hsl(187, 47%, 55%)',
      primaryForeground: 'hsl(220, 13%, 18%)',
      muted: 'hsl(220, 13%, 22%)',
      mutedForeground: 'hsl(220, 9%, 40%)',
      accent: 'hsl(220, 13%, 22%)',
      accentForeground: 'hsl(220, 9%, 55%)',
      destructive: 'hsl(355, 65%, 65%)',
      destructiveForeground: 'hsl(220, 13%, 18%)',
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    colors: {
      background: 'hsl(231, 15%, 18%)',
      foreground: 'hsl(60, 30%, 96%)',
      card: 'hsl(232, 14%, 20%)',
      cardForeground: 'hsl(60, 30%, 96%)',
      border: 'hsl(231, 11%, 27%)',
      primary: 'hsl(265, 89%, 78%)',
      primaryForeground: 'hsl(231, 15%, 18%)',
      muted: 'hsl(232, 14%, 22%)',
      mutedForeground: 'hsl(233, 15%, 41%)',
      accent: 'hsl(232, 14%, 22%)',
      accentForeground: 'hsl(60, 30%, 96%)',
      destructive: 'hsl(0, 100%, 67%)',
      destructiveForeground: 'hsl(231, 15%, 18%)',
    }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    type: 'light',
    colors: {
      background: 'hsl(0, 0%, 99%)',
      foreground: 'hsl(213, 13%, 27%)',
      card: 'hsl(210, 29%, 97%)',
      cardForeground: 'hsl(213, 13%, 27%)',
      border: 'hsl(214, 18%, 86%)',
      primary: 'hsl(212, 92%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      muted: 'hsl(214, 32%, 91%)',
      mutedForeground: 'hsl(213, 7%, 46%)',
      accent: 'hsl(214, 32%, 91%)',
      accentForeground: 'hsl(213, 13%, 27%)',
      destructive: 'hsl(357, 79%, 65%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
    }
  },
  {
    id: 'material-theme',
    name: 'Material Theme',
    type: 'dark',
    colors: {
      background: 'hsl(219, 28%, 12%)',
      foreground: 'hsl(218, 17%, 35%)',
      card: 'hsl(219, 28%, 14%)',
      cardForeground: 'hsl(218, 17%, 35%)',
      border: 'hsl(219, 28%, 18%)',
      primary: 'hsl(199, 98%, 48%)',
      primaryForeground: 'hsl(219, 28%, 12%)',
      muted: 'hsl(219, 28%, 16%)',
      mutedForeground: 'hsl(218, 11%, 25%)',
      accent: 'hsl(219, 28%, 16%)',
      accentForeground: 'hsl(218, 17%, 35%)',
      destructive: 'hsl(0, 74%, 67%)',
      destructiveForeground: 'hsl(219, 28%, 12%)',
    }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    type: 'dark',
    colors: {
      background: 'hsl(192, 100%, 11%)',
      foreground: 'hsl(44, 87%, 94%)',
      card: 'hsl(192, 100%, 13%)',
      cardForeground: 'hsl(44, 87%, 94%)',
      border: 'hsl(192, 81%, 14%)',
      primary: 'hsl(205, 69%, 49%)',
      primaryForeground: 'hsl(192, 100%, 11%)',
      muted: 'hsl(192, 100%, 15%)',
      mutedForeground: 'hsl(186, 8%, 55%)',
      accent: 'hsl(192, 100%, 15%)',
      accentForeground: 'hsl(44, 87%, 94%)',
      destructive: 'hsl(1, 79%, 63%)',
      destructiveForeground: 'hsl(192, 100%, 11%)',
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
      background: 'hsl(220, 16%, 22%)',
      foreground: 'hsl(218, 27%, 94%)',
      card: 'hsl(220, 16%, 24%)',
      cardForeground: 'hsl(218, 27%, 94%)',
      border: 'hsl(220, 16%, 28%)',
      primary: 'hsl(213, 32%, 52%)',
      primaryForeground: 'hsl(220, 16%, 22%)',
      muted: 'hsl(220, 16%, 26%)',
      mutedForeground: 'hsl(220, 16%, 36%)',
      accent: 'hsl(220, 16%, 26%)',
      accentForeground: 'hsl(218, 27%, 94%)',
      destructive: 'hsl(354, 42%, 56%)',
      destructiveForeground: 'hsl(220, 16%, 22%)',
    }
  },
  {
    id: 'palenight',
    name: 'Palenight',
    type: 'dark',
    colors: {
      background: 'hsl(229, 20%, 21%)',
      foreground: 'hsl(229, 25%, 87%)',
      card: 'hsl(229, 20%, 23%)',
      cardForeground: 'hsl(229, 25%, 87%)',
      border: 'hsl(229, 20%, 27%)',
      primary: 'hsl(207, 82%, 66%)',
      primaryForeground: 'hsl(229, 20%, 21%)',
      muted: 'hsl(229, 20%, 25%)',
      mutedForeground: 'hsl(229, 15%, 35%)',
      accent: 'hsl(229, 20%, 25%)',
      accentForeground: 'hsl(229, 25%, 87%)',
      destructive: 'hsl(0, 79%, 63%)',
      destructiveForeground: 'hsl(229, 20%, 21%)',
    }
  }
];

export const getThemeById = (id: string): ThemeConfig | undefined => {
  return VSCODE_THEMES.find(theme => theme.id === id);
};

export const getNextTheme = (currentThemeId: string): ThemeConfig => {
  const currentIndex = VSCODE_THEMES.findIndex(theme => theme.id === currentThemeId);
  const nextIndex = (currentIndex + 1) % VSCODE_THEMES.length;
  return VSCODE_THEMES[nextIndex];
};

// Cookie utilities
export const saveThemeToCookie = (themeId: string): void => {
  document.cookie = `theme=${themeId}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
};

export const getThemeFromCookie = (): string | null => {
  const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const applyTheme = (theme: ThemeConfig): void => {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--foreground', theme.colors.foreground);
  root.style.setProperty('--card', theme.colors.card);
  root.style.setProperty('--card-foreground', theme.colors.cardForeground);
  root.style.setProperty('--popover', theme.colors.popover || theme.colors.card);
  root.style.setProperty('--popover-foreground', theme.colors.popoverForeground || theme.colors.cardForeground);
  root.style.setProperty('--border', theme.colors.border);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
  root.style.setProperty('--muted', theme.colors.muted);
  root.style.setProperty('--muted-foreground', theme.colors.mutedForeground);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--accent-foreground', theme.colors.accentForeground);
  root.style.setProperty('--destructive', theme.colors.destructive);
  root.style.setProperty('--destructive-foreground', theme.colors.destructiveForeground);
  
  // Apply dark/light class
  if (theme.type === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
};