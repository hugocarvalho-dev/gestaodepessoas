'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  FileText,
  Download,
  Eye,
  Users,
  DollarSign,
  Building,
  Briefcase,
  Cake,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  Shield,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { api, Employee, Department, Position, DashboardOverview } from '@/lib/api';
import { getSelectedCompanyId } from '@/lib/company-context';
import {
  downloadPDF,
  previewPDF,
  ReportConfig,
  formatCurrency,
  formatDate,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  PAYMENT_CATEGORY_LABELS,
} from '@/lib/pdf-generator';
import { toast } from 'sonner';

// ─── Report Category Types ──────────────────────────────────────────
interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'pessoas' | 'organizacao' | 'financeiro' | 'gestao';
  generate: (data: ReportData) => ReportConfig;
}

interface ReportData {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  overview: DashboardOverview | null;
  companyName: string;
}

interface CategoryInfo {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

// ─── Categories ──────────────────────────────────────────────────────
const CATEGORIES: CategoryInfo[] = [
  { id: 'pessoas', label: 'Pessoas', icon: Users, color: '#0A1E3D' },
  { id: 'organizacao', label: 'Organização', icon: Building, color: '#5B9BAD' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, color: '#D4A84B' },
  { id: 'gestao', label: 'Gestão', icon: Shield, color: '#8B9D77' },
];

// ─── Report Definitions ─────────────────────────────────────────────
const REPORTS: ReportDefinition[] = [
  // ── Pessoas ──
  {
    id: 'employees-active',
    title: 'Colaboradores Ativos',
    description: 'Lista de todos os colaboradores com status ativo',
    icon: UserCheck,
    category: 'pessoas',
    generate: (data) => ({
      title: 'Colaboradores Ativos',
      companyName: data.companyName,
      summary: [
        { label: 'Total Ativos', value: data.employees.filter((e) => e.status === 'ACTIVE').length },
        { label: 'Tempo Integral', value: data.employees.filter((e) => e.status === 'ACTIVE' && e.employee_type === 'FULL_TIME').length },
        { label: 'Meio Período', value: data.employees.filter((e) => e.status === 'ACTIVE' && e.employee_type === 'PART_TIME').length },
        { label: 'Prestadores', value: data.employees.filter((e) => e.status === 'ACTIVE' && e.employee_type === 'CONTRACTOR').length },
      ],
      columns: [
        { header: 'Matrícula', dataKey: 'number' },
        { header: 'Nome', dataKey: 'name', width: 55 },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Departamento', dataKey: 'department' },
        { header: 'Cargo', dataKey: 'position' },
        { header: 'Admissão', dataKey: 'hireDate' },
      ],
      rows: data.employees
        .filter((e) => e.status === 'ACTIVE')
        .sort((a, b) => (a.person?.legal_name || '').localeCompare(b.person?.legal_name || ''))
        .map((e) => ({
          number: e.employee_number || '-',
          name: e.person?.legal_name || '-',
          type: EMPLOYEE_TYPE_LABELS[e.employee_type || ''] || '-',
          department: e.employee_department?.[0]?.department?.name || '-',
          position: e.employee_position?.[0]?.position?.name || '-',
          hireDate: formatDate(e.hire_date),
        })),
    }),
  },
  {
    id: 'employees-full',
    title: 'Cadastro Completo',
    description: 'Todos os colaboradores com dados pessoais e contato',
    icon: Users,
    category: 'pessoas',
    generate: (data) => ({
      title: 'Cadastro Completo de Colaboradores',
      companyName: data.companyName,
      orientation: 'landscape',
      summary: [
        { label: 'Total', value: data.employees.length },
        { label: 'Ativos', value: data.employees.filter((e) => e.status === 'ACTIVE').length },
        { label: 'Inativos', value: data.employees.filter((e) => e.status === 'INACTIVE').length },
        { label: 'Afastados', value: data.employees.filter((e) => e.status === 'ON_LEAVE').length },
        { label: 'Desligados', value: data.employees.filter((e) => e.status === 'TERMINATED').length },
      ],
      columns: [
        { header: 'Nome', dataKey: 'name', width: 50 },
        { header: 'CPF', dataKey: 'cpf' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Departamento', dataKey: 'department' },
        { header: 'Cargo', dataKey: 'position' },
        { header: 'Admissão', dataKey: 'hireDate' },
        { header: 'E-mail', dataKey: 'email' },
        { header: 'Telefone', dataKey: 'phone' },
      ],
      rows: data.employees
        .sort((a, b) => (a.person?.legal_name || '').localeCompare(b.person?.legal_name || ''))
        .map((e) => ({
          name: e.person?.legal_name || '-',
          cpf: e.person?.government_id || '-',
          status: EMPLOYEE_STATUS_LABELS[e.status] || e.status,
          type: EMPLOYEE_TYPE_LABELS[e.employee_type || ''] || '-',
          department: e.employee_department?.[0]?.department?.name || '-',
          position: e.employee_position?.[0]?.position?.name || '-',
          hireDate: formatDate(e.hire_date),
          email: e.person?.personal_contact?.[0]?.email || '-',
          phone: e.person?.personal_contact?.[0]?.phone || '-',
        })),
    }),
  },
  {
    id: 'employees-terminated',
    title: 'Desligamentos',
    description: 'Colaboradores desligados com data e motivo',
    icon: UserX,
    category: 'pessoas',
    generate: (data) => {
      const terminated = data.employees.filter((e) => e.status === 'TERMINATED');
      return {
        title: 'Relatório de Desligamentos',
        companyName: data.companyName,
        summary: [
          { label: 'Total Desligados', value: terminated.length },
        ],
        columns: [
          { header: 'Nome', dataKey: 'name', width: 55 },
          { header: 'Departamento', dataKey: 'department' },
          { header: 'Cargo', dataKey: 'position' },
          { header: 'Admissão', dataKey: 'hireDate' },
          { header: 'Desligamento', dataKey: 'termDate' },
          { header: 'Motivo', dataKey: 'reason' },
        ],
        rows: terminated
          .sort((a, b) => new Date(b.termination_date || 0).getTime() - new Date(a.termination_date || 0).getTime())
          .map((e) => ({
            name: e.person?.legal_name || '-',
            department: e.employee_department?.[0]?.department?.name || '-',
            position: e.employee_position?.[0]?.position?.name || '-',
            hireDate: formatDate(e.hire_date),
            termDate: formatDate(e.termination_date),
            reason: e.termination_reason || '-',
          })),
      };
    },
  },
  {
    id: 'birthdays',
    title: 'Aniversariantes',
    description: 'Aniversários dos colaboradores por mês',
    icon: Cake,
    category: 'pessoas',
    generate: (data) => {
      const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const withBday = data.employees
        .filter((e) => e.status === 'ACTIVE' && e.person?.date_of_birth)
        .map((e) => {
          const d = new Date(e.person!.date_of_birth!);
          return { ...e, bdayMonth: d.getMonth(), bdayDay: d.getDate() };
        })
        .sort((a, b) => a.bdayMonth - b.bdayMonth || a.bdayDay - b.bdayDay);

      return {
        title: 'Relatório de Aniversariantes',
        companyName: data.companyName,
        summary: [{ label: 'Total com Data', value: withBday.length }],
        columns: [
          { header: 'Nome', dataKey: 'name', width: 55 },
          { header: 'Data Nasc.', dataKey: 'dob' },
          { header: 'Mês', dataKey: 'month' },
          { header: 'Departamento', dataKey: 'department' },
          { header: 'Cargo', dataKey: 'position' },
        ],
        rows: withBday.map((e) => ({
          name: e.person?.legal_name || '-',
          dob: formatDate(e.person?.date_of_birth),
          month: MONTHS[e.bdayMonth],
          department: e.employee_department?.[0]?.department?.name || '-',
          position: e.employee_position?.[0]?.position?.name || '-',
        })),
      };
    },
  },

  // ── Organização ──
  {
    id: 'departments',
    title: 'Departamentos',
    description: 'Distribuição de colaboradores por departamento',
    icon: Building,
    category: 'organizacao',
    generate: (data) => {
      const deptMap = new Map<string, { name: string; count: number }>();
      data.employees.filter((e) => e.status === 'ACTIVE').forEach((e) => {
        const dept = e.employee_department?.[0]?.department;
        if (dept) {
          const existing = deptMap.get(dept.id);
          if (existing) existing.count++;
          else deptMap.set(dept.id, { name: dept.name, count: 1 });
        }
      });
      const deptRows = Array.from(deptMap.values()).sort((a, b) => b.count - a.count);
      const total = deptRows.reduce((s, d) => s + d.count, 0);

      return {
        title: 'Relatório por Departamento',
        companyName: data.companyName,
        summary: [
          { label: 'Departamentos', value: data.departments.length },
          { label: 'Colaboradores', value: total },
          { label: 'Média/Depto', value: data.departments.length > 0 ? Math.round(total / data.departments.length) : 0 },
        ],
        columns: [
          { header: 'Departamento', dataKey: 'name', width: 70 },
          { header: 'Colaboradores', dataKey: 'count' },
          { header: '% do Total', dataKey: 'pct' },
        ],
        rows: deptRows.map((d) => ({
          name: d.name,
          count: d.count,
          pct: total > 0 ? `${((d.count / total) * 100).toFixed(1)}%` : '0%',
        })),
      };
    },
  },
  {
    id: 'positions',
    title: 'Cargos',
    description: 'Listagem de cargos e quantidade de colaboradores',
    icon: Briefcase,
    category: 'organizacao',
    generate: (data) => {
      const posMap = new Map<string, { name: string; level: string; count: number }>();
      data.employees.filter((e) => e.status === 'ACTIVE').forEach((e) => {
        const pos = e.employee_position?.[0]?.position;
        if (pos) {
          const existing = posMap.get(pos.id);
          if (existing) existing.count++;
          else {
            const fullPos = data.positions.find((p) => p.id === pos.id);
            posMap.set(pos.id, {
              name: pos.name,
              level: fullPos?.position_level?.name || '-',
              count: 1,
            });
          }
        }
      });
      const posRows = Array.from(posMap.values()).sort((a, b) => b.count - a.count);

      return {
        title: 'Relatório de Cargos',
        companyName: data.companyName,
        summary: [
          { label: 'Total Cargos', value: data.positions.length },
          { label: 'Em Uso', value: posRows.length },
        ],
        columns: [
          { header: 'Cargo', dataKey: 'name', width: 65 },
          { header: 'Nível', dataKey: 'level' },
          { header: 'Colaboradores', dataKey: 'count' },
        ],
        rows: posRows.map((p) => ({
          name: p.name,
          level: p.level,
          count: p.count,
        })),
      };
    },
  },
  {
    id: 'headcount',
    title: 'Evolução do Quadro',
    description: 'Evolução mensal do número de colaboradores',
    icon: TrendingUp,
    category: 'organizacao',
    generate: (data) => {
      const evolution = data.overview?.headcountEvolution || [];
      return {
        title: 'Evolução do Quadro de Colaboradores',
        companyName: data.companyName,
        summary: [
          { label: 'Atual', value: data.overview?.activeEmployees || 0 },
          { label: 'Admissões/Mês', value: data.overview?.hiredThisMonth || 0 },
          { label: 'Desligamentos/Mês', value: data.overview?.terminatedThisMonth || 0 },
        ],
        columns: [
          { header: 'Período', dataKey: 'period' },
          { header: 'Colaboradores', dataKey: 'count' },
        ],
        rows: evolution.map((e) => ({
          period: `${e.month}/${e.year}`,
          count: e.count,
        })),
      };
    },
  },

  // ── Financeiro ──
  {
    id: 'salary-summary',
    title: 'Resumo Salarial',
    description: 'Distribuição salarial por departamento e cargo',
    icon: DollarSign,
    category: 'financeiro',
    generate: (data) => {
      const activeWithSalary = data.employees
        .filter((e) => e.status === 'ACTIVE')
        .map((e) => {
          const lastSalary = e.contract?.[0]?.salary?.sort(
            (a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime()
          )?.[0];
          return { ...e, currentSalary: lastSalary?.amount || 0 };
        })
        .filter((e) => e.currentSalary > 0);

      const totalSalary = activeWithSalary.reduce((s, e) => s + e.currentSalary, 0);
      const avg = activeWithSalary.length > 0 ? totalSalary / activeWithSalary.length : 0;
      const maxSalary = activeWithSalary.length > 0 ? Math.max(...activeWithSalary.map((e) => e.currentSalary)) : 0;
      const minSalary = activeWithSalary.length > 0 ? Math.min(...activeWithSalary.map((e) => e.currentSalary)) : 0;

      return {
        title: 'Resumo Salarial',
        companyName: data.companyName,
        summary: [
          { label: 'Folha Total', value: formatCurrency(totalSalary) },
          { label: 'Média', value: formatCurrency(avg) },
          { label: 'Maior', value: formatCurrency(maxSalary) },
          { label: 'Menor', value: formatCurrency(minSalary) },
          { label: 'Com Salário', value: activeWithSalary.length },
        ],
        columns: [
          { header: 'Nome', dataKey: 'name', width: 55 },
          { header: 'Departamento', dataKey: 'department' },
          { header: 'Cargo', dataKey: 'position' },
          { header: 'Tipo', dataKey: 'type' },
          { header: 'Salário', dataKey: 'salary' },
        ],
        rows: activeWithSalary
          .sort((a, b) => b.currentSalary - a.currentSalary)
          .map((e) => ({
            name: e.person?.legal_name || '-',
            department: e.employee_department?.[0]?.department?.name || '-',
            position: e.employee_position?.[0]?.position?.name || '-',
            type: EMPLOYEE_TYPE_LABELS[e.employee_type || ''] || '-',
            salary: formatCurrency(e.currentSalary),
          })),
      };
    },
  },
  {
    id: 'salary-by-dept',
    title: 'Folha por Departamento',
    description: 'Custo total de pessoal agrupado por departamento',
    icon: FileSpreadsheet,
    category: 'financeiro',
    generate: (data) => {
      const deptCost = new Map<string, { name: string; count: number; total: number }>();
      data.employees
        .filter((e) => e.status === 'ACTIVE')
        .forEach((e) => {
          const dept = e.employee_department?.[0]?.department;
          const salary = e.contract?.[0]?.salary?.sort(
            (a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime()
          )?.[0]?.amount || 0;
          if (dept) {
            const existing = deptCost.get(dept.id);
            if (existing) { existing.count++; existing.total += salary; }
            else deptCost.set(dept.id, { name: dept.name, count: 1, total: salary });
          }
        });
      const rows = Array.from(deptCost.values()).sort((a, b) => b.total - a.total);
      const grandTotal = rows.reduce((s, r) => s + r.total, 0);

      return {
        title: 'Folha de Pagamento por Departamento',
        companyName: data.companyName,
        summary: [
          { label: 'Folha Total', value: formatCurrency(grandTotal) },
          { label: 'Departamentos', value: rows.length },
        ],
        columns: [
          { header: 'Departamento', dataKey: 'name', width: 65 },
          { header: 'Colaboradores', dataKey: 'count' },
          { header: 'Custo Total', dataKey: 'total' },
          { header: 'Média/Colab.', dataKey: 'avg' },
          { header: '% da Folha', dataKey: 'pct' },
        ],
        rows: rows.map((r) => ({
          name: r.name,
          count: r.count,
          total: formatCurrency(r.total),
          avg: formatCurrency(r.count > 0 ? r.total / r.count : 0),
          pct: grandTotal > 0 ? `${((r.total / grandTotal) * 100).toFixed(1)}%` : '0%',
        })),
      };
    },
  },

  // ── Gestão ──
  {
    id: 'contracts',
    title: 'Contratos Ativos',
    description: 'Contratos vigentes com tipo e vencimento',
    icon: FileText,
    category: 'gestao',
    generate: (data) => {
      const contractRows = data.employees
        .filter((e) => e.status === 'ACTIVE' && e.contract && e.contract.length > 0)
        .map((e) => {
          const c = e.contract![0];
          return {
            name: e.person?.legal_name || '-',
            type: CONTRACT_TYPE_LABELS[c.contract_type || ''] || '-',
            start: formatDate(c.start_date),
            end: formatDate(c.end_date),
            hours: c.work_hours || '-',
            payment: PAYMENT_CATEGORY_LABELS[c.payment_category || ''] || '-',
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        title: 'Relatório de Contratos Ativos',
        companyName: data.companyName,
        summary: [{ label: 'Total Contratos', value: contractRows.length }],
        columns: [
          { header: 'Colaborador', dataKey: 'name', width: 55 },
          { header: 'Tipo Contrato', dataKey: 'type' },
          { header: 'Início', dataKey: 'start' },
          { header: 'Término', dataKey: 'end' },
          { header: 'Carga Horária', dataKey: 'hours' },
          { header: 'Pagamento', dataKey: 'payment' },
        ],
        rows: contractRows,
      };
    },
  },
  {
    id: 'contracts-expiring',
    title: 'Contratos a Vencer',
    description: 'Contratos com vencimento nos próximos 90 dias',
    icon: AlertTriangle,
    category: 'gestao',
    generate: (data) => {
      const now = new Date();
      const limit = new Date();
      limit.setDate(limit.getDate() + 90);

      const expiring = data.employees
        .filter((e) => e.status === 'ACTIVE' && e.contract?.[0]?.end_date)
        .filter((e) => {
          const end = new Date(e.contract![0].end_date!);
          return end >= now && end <= limit;
        })
        .map((e) => {
          const c = e.contract![0];
          const end = new Date(c.end_date!);
          const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            name: e.person?.legal_name || '-',
            department: e.employee_department?.[0]?.department?.name || '-',
            type: CONTRACT_TYPE_LABELS[c.contract_type || ''] || '-',
            end: formatDate(c.end_date),
            daysLeft: `${daysLeft} dias`,
          };
        })
        .sort((a, b) => parseInt(a.daysLeft) - parseInt(b.daysLeft));

      return {
        title: 'Contratos a Vencer (90 dias)',
        companyName: data.companyName,
        summary: [{ label: 'A Vencer', value: expiring.length }],
        columns: [
          { header: 'Colaborador', dataKey: 'name', width: 55 },
          { header: 'Departamento', dataKey: 'department' },
          { header: 'Tipo', dataKey: 'type' },
          { header: 'Vencimento', dataKey: 'end' },
          { header: 'Dias Restantes', dataKey: 'daysLeft' },
        ],
        rows: expiring,
      };
    },
  },
  {
    id: 'employee-type',
    title: 'Tipo de Vínculo',
    description: 'Distribuição por tipo de contratação',
    icon: Clock,
    category: 'gestao',
    generate: (data) => {
      const typeMap = new Map<string, number>();
      data.employees.filter((e) => e.status === 'ACTIVE').forEach((e) => {
        const t = e.employee_type || 'N/D';
        typeMap.set(t, (typeMap.get(t) || 0) + 1);
      });
      const total = data.employees.filter((e) => e.status === 'ACTIVE').length;

      return {
        title: 'Distribuição por Tipo de Vínculo',
        companyName: data.companyName,
        summary: [{ label: 'Total Ativos', value: total }],
        columns: [
          { header: 'Tipo de Vínculo', dataKey: 'type', width: 70 },
          { header: 'Quantidade', dataKey: 'count' },
          { header: '% do Total', dataKey: 'pct' },
        ],
        rows: Array.from(typeMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => ({
            type: EMPLOYEE_TYPE_LABELS[type] || type,
            count,
            pct: total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%',
          })),
      };
    },
  },
];

// ─── Main Reports Page ──────────────────────────────────────────────
export default function ReportsPage() {
  const { brand, mode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    pessoas: true,
    organizacao: true,
    financeiro: true,
    gestao: true,
  });

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [companyName, setCompanyName] = useState('');

  // ─── Load data ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getSelectedCompanyId();
      const [empsRaw, deptsRaw, possRaw, companies] = await Promise.all([
        api.getEmployees(),
        api.getDepartments(),
        api.getPositions(),
        api.getCompanies(),
      ]);

      const emps: Employee[] = empsRaw;
      const depts: Department[] = deptsRaw;
      const poss: Position[] = possRaw;

      let ov: DashboardOverview | null = null;
      if (companyId && companyId !== '__all__') {
        try {
          ov = await api.getDashboardOverview(Number(companyId));
        } catch { /* ignore */ }
        const company = companies.find((c) => String(c.id) === companyId);
        setCompanyName(company?.name || '');
      } else {
        setCompanyName(companies[0]?.name || '');
      }

      setEmployees(emps);
      setDepartments(depts);
      setPositions(poss);
      setOverview(ov);
    } catch {
      toast.error('Erro ao carregar dados para relatórios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Filtered reports ───────────────────────────────────────────
  const filteredReports = useMemo(() => {
    if (!search.trim()) return REPORTS;
    const q = search.toLowerCase();
    return REPORTS.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        CATEGORIES.find((c) => c.id === r.category)?.label.toLowerCase().includes(q)
    );
  }, [search]);

  const reportsByCategory = useMemo(() => {
    const map = new Map<string, ReportDefinition[]>();
    CATEGORIES.forEach((c) => map.set(c.id, []));
    filteredReports.forEach((r) => map.get(r.category)?.push(r));
    return map;
  }, [filteredReports]);

  // ─── Generate report ───────────────────────────────────────────
  const handleGenerate = useCallback(
    async (report: ReportDefinition, action: 'preview' | 'download') => {
      setGenerating(report.id);
      try {
        const reportData: ReportData = { employees, departments, positions, overview, companyName };
        const config = report.generate(reportData);

        if (config.rows.length === 0) {
          toast.warning('Nenhum dado encontrado para este relatório');
          return;
        }

        if (action === 'preview') {
          await previewPDF(config);
        } else {
          await downloadPDF(config);
          toast.success(`${report.title} exportado com sucesso`);
        }
      } catch (err) {
        console.error('Erro ao gerar relatório:', err);
        toast.error('Erro ao gerar relatório');
      } finally {
        setGenerating(null);
      }
    },
    [employees, departments, positions, overview, companyName]
  );

  // ─── Toggle category ───────────────────────────────────────────
  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.25, lineHeight: 1.3 }}>
            Relatórios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            {filteredReports.length} relatórios disponíveis · Dados em tempo real
          </Typography>
        </Box>
        <Tooltip title="Atualizar dados">
          <IconButton
            onClick={loadData}
            disabled={loading}
            size="small"
            sx={{
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover',
              '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'action.selected' },
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar relatório..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} style={{ opacity: 0.5 }} />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper',
            fontSize: '0.85rem',
          },
        }}
      />

      {/* Loading skeleton */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i}>
              <Skeleton variant="rounded" height={40} sx={{ mb: 1, borderRadius: 2 }} />
              <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" height={52} sx={{ mt: 0.5, borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      ) : (
        /* Categories */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {CATEGORIES.map((cat) => {
            const catReports = reportsByCategory.get(cat.id) || [];
            if (catReports.length === 0) return null;
            const CatIcon = cat.icon;
            const isExpanded = expandedCategories[cat.id];

            return (
              <Box key={cat.id}>
                {/* Category header */}
                <Box
                  onClick={() => toggleCategory(cat.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1,
                    px: 1.5,
                    borderRadius: 2,
                    cursor: 'pointer',
                    userSelect: 'none',
                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    '&:hover': {
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    },
                    transition: 'background-color 0.15s',
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      bgcolor: `${cat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CatIcon size={14} color={cat.color} />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1, fontSize: '0.82rem' }}>
                    {cat.label}
                  </Typography>
                  <Chip
                    label={catReports.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    }}
                  />
                  {isExpanded ? (
                    <ChevronDown size={14} style={{ opacity: 0.5 }} />
                  ) : (
                    <ChevronRight size={14} style={{ opacity: 0.5 }} />
                  )}
                </Box>

                {/* Report items */}
                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {catReports.map((report) => {
                      const Icon = report.icon;
                      const isGenerating = generating === report.id;

                      return (
                        <ReportRow
                          key={report.id}
                          report={report}
                          Icon={Icon}
                          isGenerating={isGenerating}
                          mode={mode}
                          brand={brand}
                          onPreview={() => handleGenerate(report, 'preview')}
                          onDownload={() => handleGenerate(report, 'download')}
                        />
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            );
          })}

          {/* No results */}
          {filteredReports.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, opacity: 0.6 }}>
              <Search size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <Typography variant="body2" color="text.secondary">
                Nenhum relatório encontrado para &ldquo;{search}&rdquo;
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Report Row Component ────────────────────────────────────────────
function ReportRow({
  report,
  Icon,
  isGenerating,
  mode,
  brand,
  onPreview,
  onDownload,
}: {
  report: ReportDefinition;
  Icon: React.ElementType;
  isGenerating: boolean;
  mode: string;
  brand: any;
  onPreview: () => void;
  onDownload: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
        px: 2,
        ml: 1.5,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.15s',
        opacity: isGenerating ? 0.6 : 1,
        '&:hover': {
          boxShadow: mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#cbd5e1',
        },
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F7F8FA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={brand.accent} />
      </Box>

      {/* Text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem', lineHeight: 1.3 }} noWrap>
          {report.title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}
          noWrap
        >
          {report.description}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        <Tooltip title="Visualizar PDF">
          <IconButton
            size="small"
            onClick={onPreview}
            disabled={isGenerating}
            sx={{
              width: 30,
              height: 30,
              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover',
              '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'action.selected' },
            }}
          >
            <Eye size={14} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Baixar PDF">
          <IconButton
            size="small"
            onClick={onDownload}
            disabled={isGenerating}
            sx={{
              width: 30,
              height: 30,
              bgcolor: `${brand.accent}15`,
              color: brand.accent,
              '&:hover': { bgcolor: `${brand.accent}25` },
            }}
          >
            <Download size={14} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
