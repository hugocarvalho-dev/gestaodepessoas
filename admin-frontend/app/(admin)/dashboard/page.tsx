'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Users,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Clock,
  CreditCard,
  RefreshCw,
  Eye,
  Building,
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { adminApi, DashboardOverview } from '@/lib/admin-api';
import { useRouter } from 'next/navigation';

// ─── Brand constants ─────────────────────────────────────────────────
const BRAND = { primary: '#0A1E3D', accent: '#D4A84B' };
const CHART_COLORS = ['#0A1E3D', '#D4A84B', '#5B9BAD', '#8B9D77', '#A68B6B', '#607D8B', '#37474F', '#78909C'];

// ─── Greeting ────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── KPI Card ────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  positive,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  delta?: string;
  positive?: boolean;
  accent?: boolean;
}) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 3,
        p: 2.5,
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
          {label}
        </Typography>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: accent ? `${BRAND.accent}15` : 'rgba(10,30,61,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color={accent ? BRAND.accent : BRAND.primary} />
        </Box>
      </Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.2, color: BRAND.primary }}>
        {value}
      </Typography>
      {delta && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 500,
            color: positive === undefined ? 'text.secondary' : positive ? '#059669' : '#DC2626',
          }}
        >
          {delta}
        </Typography>
      )}
    </Box>
  );
}

// ─── Section Card ────────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  children,
  action,
  minHeight,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  minHeight?: number | string;
}) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 3,
        p: 3,
        border: '1px solid #e2e8f0',
        height: '100%',
        minHeight,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.3, color: BRAND.primary }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
  );
}

// ─── Status helpers ──────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  TRIAL: { label: 'Trial', bg: '#fef3c7', color: '#d97706' },
  ACTIVE: { label: 'Ativo', bg: '#dcfce7', color: '#16a34a' },
  SUSPENDED: { label: 'Suspenso', bg: '#fee2e2', color: '#dc2626' },
  CANCELLED: { label: 'Cancelado', bg: '#f3f4f6', color: '#6b7280' },
  INACTIVE: { label: 'Inativo', bg: '#f3f4f6', color: '#9ca3af' },
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Custom',
};

// ─── Main Dashboard Page ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const result = await adminApi.getDashboard();
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const greeting = useMemo(() => getGreeting(), []);

  const pieData = useMemo(() => {
    if (!data?.subscriptions?.length) return [];
    return data.subscriptions.map((s) => ({
      name: PLAN_LABELS[s.plan] || s.plan,
      value: s.count,
    }));
  }, [data]);

  // ─── Loading Skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={280} height={36} />
          <Skeleton variant="text" width={200} height={20} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2.5, mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2.5 }}>
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: 3,
          p: 6,
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <AlertTriangle size={40} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 12, color: '#dc2626' }} />
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
          Erro ao carregar dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Não foi possível carregar os dados. Tente novamente.
        </Typography>
      </Box>
    );
  }

  const fmtCurrency = (val: number) =>
    `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5, color: BRAND.primary }}>
            {greeting}, Administrador
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Visão geral da plataforma
          </Typography>
        </Box>
        <Tooltip title="Atualizar">
          <IconButton
            onClick={handleRefresh}
            sx={{
              bgcolor: '#fff',
              border: '1px solid #e2e8f0',
              '&:hover': { bgcolor: '#f8fafc' },
            }}
          >
            <RefreshCw
              size={18}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                color: BRAND.primary,
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tenant KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KpiCard
          label="Total de Clientes"
          value={data.tenants.total}
          icon={Users}
          accent
        />
        <KpiCard
          label="Clientes Ativos"
          value={data.tenants.active}
          icon={CheckCircle}
          delta={data.tenants.total > 0 ? `${((data.tenants.active / data.tenants.total) * 100).toFixed(0)}% do total` : undefined}
          positive={true}
        />
        <KpiCard
          label="Em Trial"
          value={data.tenants.trial}
          icon={Clock}
        />
        <KpiCard
          label="Suspensos"
          value={data.tenants.suspended}
          icon={AlertTriangle}
          delta={data.tenants.cancelled > 0 ? `${data.tenants.cancelled} cancelado(s)` : undefined}
          positive={false}
        />
      </Box>

      {/* Financial KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KpiCard
          label="Receita Total"
          value={fmtCurrency(data.payments.total_received)}
          icon={DollarSign}
          accent
        />
        <KpiCard
          label="Receita do Mês"
          value={fmtCurrency(data.payments.month_received)}
          icon={TrendingUp}
          positive={true}
          delta={data.payments.month_received > 0 ? 'Mês atual' : undefined}
        />
        <KpiCard
          label="Pendente"
          value={fmtCurrency(data.payments.pending_amount)}
          icon={CreditCard}
          delta={data.payments.pending_count > 0 ? `${data.payments.pending_count} cobrança(s)` : undefined}
        />
        <KpiCard
          label="Em Atraso"
          value={`${data.payments.overdue_count}`}
          icon={AlertTriangle}
          delta={data.payments.overdue_amount > 0 ? fmtCurrency(data.payments.overdue_amount) : undefined}
          positive={false}
        />
      </Box>

      {/* Charts + Recent Tenants */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        {/* Plan Distribution Chart */}
        <SectionCard
          title="Distribuição de Planos"
          subtitle={`${data.subscriptions.length} plano(s) ativos`}
        >
          {pieData.length > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ResponsiveContainer width="50%" height={220}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                      color: BRAND.primary,
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {pieData.map((item, i) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: CHART_COLORS[i % CHART_COLORS.length],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      ({item.value})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, opacity: 0.6 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Sem dados de planos
              </Typography>
            </Box>
          )}
        </SectionCard>

        {/* Tenant Status Bar Chart */}
        <SectionCard
          title="Status dos Clientes"
          subtitle="Distribuição por status"
        >
          {(() => {
            const barData = [
              { name: 'Ativos', value: data.tenants.active },
              { name: 'Trial', value: data.tenants.trial },
              { name: 'Suspensos', value: data.tenants.suspended },
              { name: 'Cancelados', value: data.tenants.cancelled },
            ];
            return (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                      color: BRAND.primary,
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </SectionCard>
      </Box>

      {/* Recent Tenants Table */}
      <SectionCard
        title="Clientes Recentes"
        action={
          <Chip
            label={`${data.recent_tenants.length} últimos`}
            size="small"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              bgcolor: `${BRAND.accent}15`,
              color: BRAND.accent,
              height: 24,
            }}
          />
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {data.recent_tenants.map((t: any) => {
            const sc = STATUS_MAP[t.status] || STATUS_MAP.INACTIVE;
            return (
              <Box
                key={t.id}
                onClick={() => router.push(`/tenants/${t.id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              >
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    bgcolor: BRAND.primary,
                    color: '#fff',
                  }}
                >
                  {t.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', lineHeight: 1.3 }} noWrap>
                    {t.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} noWrap>
                    {t.email}
                  </Typography>
                </Box>
                <Chip
                  label={PLAN_LABELS[t.subscription?.plan] || t.subscription?.plan || '—'}
                  size="small"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    height: 22,
                    bgcolor: 'rgba(10,30,61,0.06)',
                    color: BRAND.primary,
                  }}
                />
                <Chip
                  label={sc.label}
                  size="small"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    height: 22,
                    bgcolor: sc.bg,
                    color: sc.color,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                  {new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </Typography>
                <Tooltip title="Ver detalhes">
                  <IconButton size="small" sx={{ color: '#94a3b8' }}>
                    <Eye size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </SectionCard>

      {/* Animation keyframes for refresh */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Box>
  );
}
