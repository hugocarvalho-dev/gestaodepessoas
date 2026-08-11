'use client';

import { Box, Typography } from '@mui/material';

interface LumeLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  darkBg?: boolean;
}

export function LumeLogo({ variant = 'full', size = 'md', darkBg = false }: LumeLogoProps) {
  const sizes = {
    sm: { icon: 28, text: 14 },
    md: { icon: 40, text: 18 },
    lg: { icon: 56, text: 26 },
    xl: { icon: 80, text: 36 },
  };

  const s = sizes[size];
  const textColor = darkBg ? '#FFFFFF' : '#0A1E3D';
  const subtextColor = darkBg ? 'rgba(255,255,255,0.35)' : '#C0C5CC';
  const gradId = `lume-grad-${size}-${darkBg ? 'd' : 'l'}`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: `${s.icon * 0.3}px` }}>
      {/* Icon — Geometric prism / structured light */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="80" height="80" rx="18" fill="#0A1E3D" />
        {/* Back plane — subtle depth */}
        <rect x="20" y="20" width="28" height="28" rx="4" fill="#1A3A5C" />
        {/* Front plane — gold accent, offset for depth */}
        <rect x="32" y="32" width="28" height="28" rx="4" fill={`url(#${gradId})`} />
        {/* Intersection highlight — light refraction */}
        <rect x="32" y="32" width="16" height="16" rx="3" fill="#FFFFFF" opacity="0.2" />
        {/* Small bright square — core light */}
        <rect x="22" y="22" width="8" height="8" rx="2" fill="#D4A84B" opacity="0.6" />
        <defs>
          <linearGradient id={gradId} x1="32" y1="32" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8C468" />
            <stop offset="1" stopColor="#D4A84B" />
          </linearGradient>
        </defs>
      </svg>

      {variant === 'full' && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: s.text,
              fontWeight: 700,
              color: textColor,
              letterSpacing: '0.01em',
              lineHeight: 1.2,
            }}
          >
            Lume
          </Typography>
          {size !== 'sm' && (
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: s.text * 0.48,
                fontWeight: 400,
                color: subtextColor,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                lineHeight: 1.3,
              }}
            >
              Gestão de Pessoas
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
