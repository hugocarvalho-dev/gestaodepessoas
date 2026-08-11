'use client';

import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '4rem', md: '6rem' },
          fontWeight: 800,
          color: 'primary.main',
          mb: 2,
        }}
      >
        404
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Página não encontrada
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
        A página que você está procurando não existe ou foi movida.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<Home size={20} />}
        onClick={() => router.push('/dashboard')}
        sx={{
          bgcolor: 'primary.main',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        Voltar ao Dashboard
      </Button>
    </Box>
  );
}
