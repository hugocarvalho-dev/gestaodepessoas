'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Avatar,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Users,
  UserCheck,
  UserX,
  Building,
  Briefcase,
  Cake,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  UserPlus,
  AlertTriangle,
  PieChart,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { api, DashboardOverview } from '@/lib/api';
import { useTheme } from '@/components/providers/ThemeProvider';
import { getSelectedCompanyId } from '@/lib/company-context';

// ─── Dashboard Tab Types ─────────────────────────────────────────────
type DashboardTab = 'overview' | 'workforce' | 'departments';

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Visão Geral', icon: Activity },
  { id: 'workforce', label: 'Equipe', icon: Users },
  { id: 'departments', label: 'Departamentos', icon: PieChart },
];

// ─── Greeting ────────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getMonthLabel(): string {
  const now = new Date();
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ─── Employee Type Labels ────────────────────────────────────────────
const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Tempo integral',
  PART_TIME: 'Meio período',
  CONTRACTOR: 'Prestador',
  INTERN: 'Estagiário',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  INDEFINITE: 'Indeterminado',
  FIXED_TERM: 'Prazo fixo',
  APPRENTICE: 'Aprendiz',
  TEMPORARY: 'Temporário',
};

// ─── Color palette for charts ────────────────────────────────────────
const CHART_COLORS = ['#0A1E3D', '#D4A84B', '#5B9BAD', '#8B9D77', '#A68B6B', '#607D8B', '#37474F', '#78909C'];

// ─── KPI Card ────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  positive,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  delta?: string;
  deltaLabel?: string;
  positive?: boolean;
  accent?: boolean;
}) {
  const { brand, mode } = useTheme();
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
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
            bgcolor: accent ? `${brand.accent}15` : (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color={accent ? brand.accent : brand.primary} style={{ opacity: mode === 'dark' ? 0.8 : 1 }} />
        </Box>
      </Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.2 }}>
        {value}
      </Typography>
      {delta && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {positive !== undefined && (
            positive
              ? <ArrowUpRight size={12} color="#059669" />
              : <ArrowDownRight size={12} color="#DC2626" />
          )}
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
          {deltaLabel && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {deltaLabel}
            </Typography>
          )}
        </Box>
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
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        minHeight,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.95rem', lineHeight: 1.3 }}>
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

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, opacity: 0.6 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {message}
      </Typography>
    </Box>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { brand, mode } = useTheme();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const companyId = getSelectedCompanyId();
      const [user, overview] = await Promise.all([
        api.getCurrentUser(),
        companyId && companyId !== '__all__'
          ? api.getDashboardOverview(Number(companyId))
          : null,
      ]);
      setUserName(user.firstName);
      if (overview) setData(overview);
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for company changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'selected_company_id') {
        setLoading(true);
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const greeting = useMemo(() => getGreeting(), []);
  const monthLabel = useMemo(() => getMonthLabel(), []);

  // ─── Derived data ──────────────────────────────────────────────────
  const retentionRate = data && data.totalEmployees > 0
    ? ((data.activeEmployees / data.totalEmployees) * 100).toFixed(1)
    : '0';

  const pieData = useMemo(() => {
    if (!data?.departmentDistribution?.length) return [];
    return data.departmentDistribution.slice(0, 6);
  }, [data]);

  const typeData = useMemo(() => {
    if (!data?.employeeTypeDistribution?.length) return [];
    return data.employeeTypeDistribution.map(d => ({
      name: EMPLOYEE_TYPE_LABELS[d.type] || d.type,
      value: d.count,
    }));
  }, [data]);

  // ─── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={280} height={36} />
          <Skeleton variant="text" width={200} height={20} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2.5, mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
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

  // ─── No company selected ──────────────────────────────────────────
  if (!data) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {greeting}, {userName || 'Usuário'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecione uma empresa no seletor acima para ver o dashboard.
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 6,
            border: '1px solid',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Building size={40} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 12 }} />
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Nenhuma empresa selecionada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            Use o seletor de empresa na barra superior para escolher uma empresa e visualizar os indicadores do dashboard.
          </Typography>
        </Box>
      </Box>
    );
  }

  // ─── Overview Tab ──────────────────────────────────────────────────
  const renderOverview = () => (
    <>
      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KpiCard
          label="Total de Colaboradores"
          value={data.totalEmployees}
          icon={Users}
          delta={data.hiredThisMonth > 0 ? `+${data.hiredThisMonth} este mês` : undefined}
          positive={data.hiredThisMonth > 0 ? true : undefined}
          accent
        />
        <KpiCard
          label="Colaboradores Ativos"
          value={data.activeEmployees}
          icon={UserCheck}
          delta={`${retentionRate}% retenção`}
          positive={Number(retentionRate) >= 80}
        />
        <KpiCard
          label="Departamentos"
          value={data.totalDepartments}
          icon={Building}
        />
        <KpiCard
          label="Cargos"
          value={data.totalPositions}
          icon={Briefcase}
        />
      </Box>

      {/* Chart + Activity */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        {/* Headcount Evolution Chart */}
        <SectionCard
          title="Evolução do Quadro"
          subtitle="Últimos 6 meses"
          minHeight={340}
        >
          {data.headcountEvolution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.headcountEvolution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={brand.accent} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={brand.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#2A3240' : '#e2e8f0'} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: mode === 'dark' ? '#8896A6' : '#6B7280' }}
                  axisLine={{ stroke: mode === 'dark' ? '#2A3240' : '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: mode === 'dark' ? '#8896A6' : '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: mode === 'dark' ? '#1E252E' : '#fff',
                    border: `1px solid ${mode === 'dark' ? '#2A3240' : '#e2e8f0'}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: mode === 'dark' ? '#E8ECF1' : '#0A1E3D',
                  }}
                  formatter={(value: number) => [`${value} colaboradores`, 'Headcount']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={brand.accent}
                  strokeWidth={2.5}
                  fill="url(#colorCount)"
                  dot={{ fill: brand.accent, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Sem dados de evolução ainda" />
          )}
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard
          title="Atividade Recente"
          action={
            <Chip
              label={monthLabel}
              size="small"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                bgcolor: `${brand.accent}15`,
                color: brand.accent,
                height: 24,
              }}
            />
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {data.recentHires?.length > 0 ? (
              data.recentHires.map((hire) => (
                <Box
                  key={hire.id}
                  onClick={() => router.push(`/employees/${hire.id}`)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Avatar
                    src={hire.photo || undefined}
                    sx={{
                      width: 36,
                      height: 36,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      bgcolor: 'primary.main',
                    }}
                  >
                    {hire.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', lineHeight: 1.3 }} noWrap>
                      {hire.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }} noWrap>
                      {hire.position || hire.department || 'Nova contratação'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {new Date(hire.hireDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </Typography>
                </Box>
              ))
            ) : (
              <EmptyState message="Nenhuma contratação recente" />
            )}
          </Box>
        </SectionCard>
      </Box>

      {/* Bottom section: Birthdays + Contracts Expiring */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {/* Birthdays */}
        <SectionCard
          title="Aniversariantes do Mês"
          action={<Cake size={16} style={{ opacity: 0.4 }} />}
        >
          {data.birthdaysThisMonth?.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.birthdaysThisMonth.map((person) => (
                <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: brand.accent, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, flex: 1 }}>
                    {person.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {new Date(person.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <EmptyState message="Nenhum aniversariante este mês" />
          )}
        </SectionCard>

        {/* Contracts Expiring */}
        <SectionCard
          title="Contratos a Vencer"
          subtitle="Próximos 30 dias"
          action={<AlertTriangle size={16} style={{ opacity: 0.4, color: '#f59e0b' }} />}
        >
          {data.contractsExpiringSoon?.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.contractsExpiringSoon.map((contract) => (
                <Box key={contract.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b', flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }} noWrap>
                      {contract.employeeName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {CONTRACT_TYPE_LABELS[contract.contractType || ''] || contract.contractType}
                    </Typography>
                  </Box>
                  <Chip
                    label={new Date(contract.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    size="small"
                    sx={{ fontSize: '0.65rem', height: 22, bgcolor: 'rgba(245,158,11,0.1)', color: '#d97706', fontWeight: 600 }}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <EmptyState message="Nenhum contrato a vencer nos próximos 30 dias" />
          )}
        </SectionCard>
      </Box>
    </>
  );

  // ─── Workforce Tab ─────────────────────────────────────────────────
  const renderWorkforce = () => (
    <>
      {/* Status distribution */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <KpiCard label="Ativos" value={data.activeEmployees} icon={UserCheck} accent />
        <KpiCard label="Inativos" value={data.inactiveEmployees} icon={UserX} />
        <KpiCard
          label="Em Licença"
          value={data.onLeaveEmployees}
          icon={Calendar}
        />
        <KpiCard
          label="Admissões no Mês"
          value={data.hiredThisMonth}
          icon={UserPlus}
          delta={data.terminatedThisMonth > 0 ? `${data.terminatedThisMonth} desligamento(s)` : undefined}
          positive={data.hiredThisMonth > data.terminatedThisMonth}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {/* Employee Type Distribution */}
        <SectionCard title="Distribuição por Tipo" subtitle="Colaboradores ativos">
          {typeData.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {typeData.map((item, i) => {
                const total = typeData.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <Box key={item.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {item.value} ({pct.toFixed(0)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F0F2F5',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          bgcolor: CHART_COLORS[i % CHART_COLORS.length],
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          ) : (
            <EmptyState message="Sem dados de tipo de colaborador" />
          )}
        </SectionCard>

        {/* Headcount chart (bar) */}
        <SectionCard title="Evolução Mensal" subtitle="Quadro de colaboradores">
          {data.headcountEvolution?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.headcountEvolution} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={mode === 'dark' ? '#2A3240' : '#e2e8f0'} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: mode === 'dark' ? '#8896A6' : '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: mode === 'dark' ? '#8896A6' : '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: mode === 'dark' ? '#1E252E' : '#fff',
                    border: `1px solid ${mode === 'dark' ? '#2A3240' : '#e2e8f0'}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: mode === 'dark' ? '#E8ECF1' : '#0A1E3D',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.headcountEvolution.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === data.headcountEvolution.length - 1 ? brand.accent : (mode === 'dark' ? '#2A3240' : '#EDF1F6')}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Sem dados de evolução" />
          )}
        </SectionCard>
      </Box>
    </>
  );

  // ─── Departments Tab ───────────────────────────────────────────────
  const renderDepartments = () => (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        {/* Pie Chart */}
        <SectionCard title="Distribuição por Departamento" subtitle={`${data.totalDepartments} departamentos`}>
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
                    dataKey="count"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: mode === 'dark' ? '#1E252E' : '#fff',
                      border: `1px solid ${mode === 'dark' ? '#2A3240' : '#e2e8f0'}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: mode === 'dark' ? '#E8ECF1' : '#0A1E3D',
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
              <Box sx={{ flex: 1 }}>
                {pieData.map((item, i) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', flex: 1 }} noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                      {item.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <EmptyState message="Nenhum departamento com colaboradores" />
          )}
        </SectionCard>

        {/* Department ranking */}
        <SectionCard title="Ranking de Departamentos" subtitle="Por número de colaboradores">
          {data.departmentDistribution?.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5 }}>
              {data.departmentDistribution.slice(0, 8).map((dept, i) => {
                const maxCount = data.departmentDistribution[0]?.count || 1;
                const pct = (dept.count / maxCount) * 100;
                return (
                  <Box key={dept.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 1,
                            bgcolor: i < 3 ? `${brand.accent}15` : 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: i < 3 ? brand.accent : 'text.secondary',
                          }}
                        >
                          {i + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {dept.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        {dept.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F0F2F5',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          bgcolor: i < 3 ? brand.accent : (mode === 'dark' ? '#3A4552' : '#CBD5E1'),
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          ) : (
            <EmptyState message="Nenhum departamento cadastrado" />
          )}
        </SectionCard>
      </Box>
    </>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {greeting}, {userName}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aqui está o panorama da sua organização
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Atualizar dados">
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                width: 36,
                height: 36,
              }}
            >
              <RefreshCw
                size={16}
                style={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </IconButton>
          </Tooltip>
          <Chip
            label={monthLabel}
            size="small"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              bgcolor: `${brand.accent}15`,
              color: brand.accent,
              height: 28,
              borderRadius: 2,
            }}
          />
        </Box>
      </Box>

      {/* Tab navigation */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <Box
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2,
                py: 1,
                borderRadius: 2.5,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                ...(isActive
                  ? {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      boxShadow: mode === 'dark'
                        ? '0 2px 8px rgba(0,0,0,0.3)'
                        : '0 2px 8px rgba(10,30,61,0.2)',
                    }
                  : {
                      bgcolor: 'background.paper',
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'text.primary',
                      },
                    }),
              }}
            >
              <Icon size={16} />
              {tab.label}
            </Box>
          );
        })}
      </Box>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'workforce' && renderWorkforce()}
      {activeTab === 'departments' && renderDepartments()}

      {/* CSS for refresh spin */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </Box>
  );
}
