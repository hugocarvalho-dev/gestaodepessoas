'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import type { CustomColors } from '@/lib/api';

type ThemeMode = 'light' | 'dark';

// ─── Lume Default Brand Tokens ─────────────────────────────────────
export const defaultBrand = {
  primary:      '#0A1E3D',
  primaryLight: '#1A3A5C',
  primaryDark:  '#061225',
  accent:       '#D4A84B',
  accentLight:  '#E0C078',
  accentDark:   '#B8923D',
  background:   '#F7F8FA',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F0F2F5',
  muted:        '#E8EBF0',
  border:       'rgba(10,30,61,0.10)',
  textPrimary:  '#0A1E3D',
  textSecondary:'#6B7280',
};

// Helpers: lighten / darken a hex color by percentage
function adjustColor(hex: string, amount: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const nr = clamp(r + Math.round(255 * amount));
  const ng = clamp(g + Math.round(255 * amount));
  const nb = clamp(b + Math.round(255 * amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

/** Build a full brand object from partial custom overrides */
export function buildBrand(custom?: CustomColors | null) {
  const primary    = custom?.primary    ?? defaultBrand.primary;
  const accent     = custom?.accent     ?? defaultBrand.accent;
  const background = custom?.background ?? defaultBrand.background;
  const surface    = custom?.surface    ?? defaultBrand.surface;
  const surfaceAlt = custom?.surfaceAlt ?? defaultBrand.surfaceAlt;
  const muted      = custom?.muted      ?? defaultBrand.muted;

  return {
    primary,
    primaryLight: adjustColor(primary, 0.07),
    primaryDark:  adjustColor(primary, -0.03),
    accent,
    accentLight:  adjustColor(accent, 0.10),
    accentDark:   adjustColor(accent, -0.06),
    background,
    surface,
    surfaceAlt,
    muted,
    border: `rgba(${parseInt(primary.slice(1, 3), 16)},${parseInt(primary.slice(3, 5), 16)},${parseInt(primary.slice(5, 7), 16)},0.10)`,
    textPrimary: primary,
    textSecondary: '#6B7280',
  };
}

const dmSans = 'var(--font-dm-sans), "DM Sans", "Inter", sans-serif';
const inter  = 'var(--font-inter), "Inter", "Roboto", "Helvetica", "Arial", sans-serif';

// ─── Context ────────────────────────────────────────────────────────
interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  brand: ReturnType<typeof buildBrand>;
  customColors: CustomColors | null;
  setCustomColors: (colors: CustomColors | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Kept for backwards compatibility — re‑exports the *current* default
export const brand = defaultBrand;

// ─── Provider ───────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [customColors, setCustomColorsState] = useState<CustomColors | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') setModeState(saved);

    try {
      const savedColors = localStorage.getItem('customColors');
      if (savedColors) setCustomColorsState(JSON.parse(savedColors));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('theme', mode);
  }, [mode, mounted]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme', newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const setCustomColors = useCallback((colors: CustomColors | null) => {
    setCustomColorsState(colors);
    if (colors) {
      localStorage.setItem('customColors', JSON.stringify(colors));
    } else {
      localStorage.removeItem('customColors');
    }
  }, []);

  // Derived brand from custom colors
  const activeBrand = useMemo(() => buildBrand(customColors), [customColors]);

  const isLight = mode === 'light';

  // ─── Dark mode palette tokens ─────────────────────────────────────
  const dark = {
    bg:          '#0F1318',
    bgPaper:     '#181D24',
    bgElevated:  '#1E252E',
    surfaceAlt:  '#232B36',
    border:      'rgba(255,255,255,0.08)',
    borderSolid: '#2A3240',
    text:        '#E8ECF1',
    textMuted:   '#8896A6',
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main:  isLight ? activeBrand.primary : adjustColor(activeBrand.primary, 0.15),
        light: isLight ? activeBrand.primaryLight : adjustColor(activeBrand.primary, 0.25),
        dark:  activeBrand.primaryDark,
        contrastText: '#ffffff',
      },
      secondary: {
        main:  activeBrand.accent,
        light: activeBrand.accentLight,
        dark:  activeBrand.accentDark,
        contrastText: '#ffffff',
      },
      background: {
        default: isLight ? activeBrand.background : dark.bg,
        paper:   isLight ? activeBrand.surface    : dark.bgPaper,
      },
      text: {
        primary:   isLight ? activeBrand.textPrimary   : dark.text,
        secondary: isLight ? activeBrand.textSecondary  : dark.textMuted,
      },
      divider: isLight ? activeBrand.border : dark.border,
      action: {
        hover:    isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
        selected: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
        disabled: isLight ? 'rgba(0,0,0,0.26)' : 'rgba(255,255,255,0.2)',
        disabledBackground: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)',
      },
    },

    typography: {
      fontFamily: inter,
      h1: { fontFamily: dmSans, fontWeight: 600, fontSize: '2.25rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
      h2: { fontFamily: dmSans, fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.25, letterSpacing: '-0.01em' },
      h3: { fontFamily: dmSans, fontWeight: 600, fontSize: '1.375rem', lineHeight: 1.3 },
      h4: { fontFamily: dmSans, fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.35 },
      h5: { fontFamily: dmSans, fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.35 },
      h6: { fontFamily: dmSans, fontWeight: 600, fontSize: '1rem', lineHeight: 1.4 },
      subtitle1: { fontFamily: inter, fontWeight: 500, fontSize: '1rem' },
      subtitle2: { fontFamily: inter, fontWeight: 500, fontSize: '0.875rem' },
      body1: { fontFamily: inter, fontWeight: 400, fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontFamily: inter, fontWeight: 400, fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontFamily: inter, fontWeight: 500, fontSize: '0.6875rem', lineHeight: 1.4 },
      overline: { fontFamily: inter, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' },
      button: { fontFamily: inter, fontWeight: 600, fontSize: '0.875rem', textTransform: 'none' as const },
    },

    shape: { borderRadius: 8 },

    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
          containedPrimary: {
            backgroundColor: isLight ? activeBrand.primary : adjustColor(activeBrand.primary, 0.15),
            '&:hover': { backgroundColor: isLight ? activeBrand.primaryLight : adjustColor(activeBrand.primary, 0.22) },
          },
          containedSecondary: {
            backgroundColor: activeBrand.accent,
            '&:hover': { backgroundColor: activeBrand.accentDark },
          },
          outlinedPrimary: {
            borderColor: isLight ? activeBrand.primary : dark.borderSolid,
            color: isLight ? activeBrand.primary : dark.text,
            '&:hover': {
              borderColor: isLight ? activeBrand.primaryLight : dark.textMuted,
              backgroundColor: isLight ? `${activeBrand.primary}0A` : 'rgba(255,255,255,0.04)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.4)',
            borderWidth: '1px', borderStyle: 'solid',
            borderColor: isLight ? activeBrand.muted : dark.borderSolid,
            backgroundColor: isLight ? undefined : dark.bgPaper,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(isLight ? {} : { backgroundColor: dark.bgPaper }),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            fontSize: '0.8125rem',
            ...(isLight ? {} : { borderColor: dark.borderSolid }),
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isLight ? activeBrand.textSecondary : dark.textMuted,
              paddingTop: 6, paddingBottom: 6, lineHeight: 1.4,
              ...(isLight ? {} : { borderColor: dark.borderSolid }),
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: isLight ? {} : { borderColor: dark.borderSolid },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: isLight ? {} : {
            '& .MuiTableRow-root:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              ...(isLight ? {} : {
                '& .MuiOutlinedInput-notchedOutline': { borderColor: dark.borderSolid },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: dark.textMuted },
                backgroundColor: dark.bgElevated,
              }),
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: isLight ? activeBrand.primary : activeBrand.accent,
              },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: isLight ? {} : {
            backgroundColor: dark.bgPaper,
            border: `1px solid ${dark.borderSolid}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: isLight ? {} : {
            backgroundColor: dark.bgElevated,
            border: `1px solid ${dark.borderSolid}`,
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: isLight ? {} : {
            '& .MuiOutlinedInput-notchedOutline': { borderColor: dark.borderSolid },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: isLight ? {} : { borderColor: dark.borderSolid },
        },
      },
      MuiAlert: {
        styleOverrides: {
          standardInfo: isLight ? {} : { backgroundColor: 'rgba(59,130,246,0.1)', color: '#93C5FD' },
          standardError: isLight ? {} : { backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' },
          standardSuccess: isLight ? {} : { backgroundColor: 'rgba(34,197,94,0.1)', color: '#86EFAC' },
          standardWarning: isLight ? {} : { backgroundColor: 'rgba(234,179,8,0.1)', color: '#FDE68A' },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: isLight ? {} : { backgroundColor: dark.bgElevated, border: `1px solid ${dark.borderSolid}`, color: dark.text },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          track: isLight ? {} : { backgroundColor: dark.borderSolid },
        },
      },
    },
  }), [mode, isLight, activeBrand, dark]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleTheme, brand: activeBrand, customColors, setCustomColors }}>
      <MuiThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          {children}
        </LocalizationProvider>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
