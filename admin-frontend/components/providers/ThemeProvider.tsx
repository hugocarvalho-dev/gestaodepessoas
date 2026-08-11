'use client';

import { ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

const dmSans = 'var(--font-dm-sans), "DM Sans", "Inter", sans-serif';
const inter  = 'var(--font-inter), "Inter", "Roboto", "Helvetica", "Arial", sans-serif';

export const brand = {
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: brand.primary,
        light: brand.primaryLight,
        dark: brand.primaryDark,
        contrastText: '#ffffff',
      },
      secondary: {
        main: brand.accent,
        light: brand.accentLight,
        dark: brand.accentDark,
        contrastText: '#ffffff',
      },
      background: {
        default: brand.background,
        paper: brand.surface,
      },
      text: {
        primary: brand.textPrimary,
        secondary: brand.textSecondary,
      },
      divider: brand.border,
      action: {
        hover: 'rgba(0,0,0,0.04)',
        selected: 'rgba(0,0,0,0.08)',
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
            backgroundColor: brand.primary,
            '&:hover': { backgroundColor: brand.primaryLight },
          },
          containedSecondary: {
            backgroundColor: brand.accent,
            '&:hover': { backgroundColor: brand.accentDark },
          },
          outlinedPrimary: {
            borderColor: brand.primary,
            color: brand.primary,
            '&:hover': {
              borderColor: brand.primaryLight,
              backgroundColor: `${brand.primary}0A`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: brand.muted,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, fontSize: '0.8125rem' },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: brand.textSecondary,
              paddingTop: 6,
              paddingBottom: 6,
              lineHeight: 1.4,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: brand.primary,
              },
            },
          },
        },
      },
      MuiDialog: { styleOverrides: { paper: {} } },
      MuiDrawer: { styleOverrides: { paper: { border: 'none' } } },
    },
  }), []);

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  );
}
