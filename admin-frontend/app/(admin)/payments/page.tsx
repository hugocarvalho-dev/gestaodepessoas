'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DollarSign, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

export default function PaymentsOverviewPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getPaymentsSummary().then(setSummary).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const cards = [
    {
      label: 'Total Recebido',
      value: `R$ ${Number(summary?.total_received || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: '#16a34a',
      bgcolor: '#f0fdf4',
      icon: DollarSign,
    },
    {
      label: 'Pendente',
      value: `R$ ${Number(summary?.total_pending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: '#d97706',
      bgcolor: '#fffbeb',
      icon: Clock,
    },
    {
      label: 'Em Atraso',
      value: `R$ ${Number(summary?.total_overdue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      color: '#dc2626',
      bgcolor: '#fef2f2',
      icon: TrendingDown,
    },
    {
      label: 'Cobranças em Atraso',
      value: String(summary?.overdue_count || 0),
      color: '#dc2626',
      bgcolor: '#fef2f2',
      icon: AlertTriangle,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Financeiro
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: card.color }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: card.bgcolor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={card.color} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
        }}
      >
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': { fontSize: '0.875rem' },
          }}
        >
          Para ver os pagamentos de um tenant específico, acesse a página do tenant em <strong>Tenants</strong> e veja a seção de pagamentos.
        </Alert>
      </Paper>
    </Box>
  );
}
