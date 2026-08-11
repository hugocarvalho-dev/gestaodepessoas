'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompanyContext } from '@/lib/hooks/useCompanyContext';
import { api, Employee, Department, Position } from '@/lib/api';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit, Eye, Download, Upload, LayoutGrid, List as ListIcon, Mail, Phone, Plus, Search, User, UserMinus, X, FileSpreadsheet } from 'lucide-react';
import ImportExportModal from './components/ImportExportModal';

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'email' | 'position' | 'department' | 'status';
type ViewMode = 'list' | 'grid';

function formatPhone(phone?: string | null): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone; // return as-is if not 10/11 digits
}

function getPrimaryContact(employee: Employee) {
  return employee.person?.personal_contact?.[0];
}

function getDepartmentName(employee: Employee) {
  return employee.employee_department?.[0]?.department?.name || 'Sem departamento';
}

function getPositionName(employee: Employee) {
  return employee.employee_position?.[0]?.position?.name || 'Sem cargo';
}

function getEmployeeName(employee: Employee) {
  return employee.person?.legal_name || 'Sem nome';
}

function getStatusLabel(status: Employee['status']) {
  if (status === 'ACTIVE') return 'Ativo';
  if (status === 'ON_LEAVE') return 'Afastado';
  if (status === 'INACTIVE') return 'Inativo';
  if (status === 'TERMINATED') return 'Desligado';
  return status;
}

function getStatusStyle(status: Employee['status']) {
  if (status === 'ACTIVE') {
    return { bgcolor: '#dcfce7', color: '#166534' };
  }
  if (status === 'ON_LEAVE') {
    return { bgcolor: '#fef9c3', color: '#854d0e' };
  }
  if (status === 'INACTIVE') {
    return { bgcolor: '#e2e8f0', color: '#334155' };
  }
  return { bgcolor: '#fee2e2', color: '#991b1b' };
}

function resolveImageUrl(url?: string | null) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const backendBase = apiBase.replace(/\/api$/, '');
  if (url.startsWith('/uploads/')) {
    const subPath = url.replace('/uploads/', '');
    return `${backendBase}/api/upload/${subPath}`;
  }
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function EmployeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedCompanyId, isLoading: isLoadingCompany } = useCompanyContext();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [importExportOpen, setImportExportOpen] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Nome', 'CPF', 'E-mail', 'Telefone', 'Departamento', 'Cargo', 'Status', 'Data Admissão', 'Tipo Vínculo'];
    const rows = sortedEmployees.map((emp) => {
      const contact = getPrimaryContact(emp);
      return [
        getEmployeeName(emp),
        emp.person?.government_id || '',
        contact?.email || '',
        contact?.phone || '',
        getDepartmentName(emp),
        getPositionName(emp),
        getStatusLabel(emp.status),
        emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('pt-BR') : '',
        emp.employee_type || '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `colaboradores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadTemplate = () => {
    const headers = ['Nome Completo*', 'CPF*', 'Data Nascimento', 'Gênero (MALE/FEMALE/OTHER)', 'E-mail*', 'Telefone', 'Departamento', 'Cargo', 'Tipo Vínculo', 'Data Admissão*', 'Salário'];
    const csv = '\uFEFF' + headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_importacao_colaboradores.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // URL param filters
  const departmentIdFilter = searchParams.get('department');
  const positionIdFilter = searchParams.get('position');
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [positionName, setPositionName] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empResponse, deptResponse, posResponse] = await Promise.all([
        api.getEmployees(),
        api.getDepartments(),
        api.getPositions(),
      ]);
      setEmployees(empResponse);
      setAllDepartments(deptResponse);
      setAllPositions(posResponse);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar colaboradores');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCompany && selectedCompanyId) {
      fetchData();
    }
  }, [isLoadingCompany, selectedCompanyId]);

  // Resolve department name from URL filter
  useEffect(() => {
    if (!departmentIdFilter) { setDepartmentName(null); return; }
    const dept = allDepartments.find((d) => d.id === departmentIdFilter);
    if (dept) { setDepartmentName(dept.name); return; }
    api.getDepartment(departmentIdFilter).then((d) => setDepartmentName(d.name)).catch(() => setDepartmentName(departmentIdFilter));
  }, [departmentIdFilter, allDepartments]);

  // Resolve position name from URL filter
  useEffect(() => {
    if (!positionIdFilter) { setPositionName(null); return; }
    const pos = allPositions.find((p) => p.id === positionIdFilter);
    if (pos) { setPositionName(pos.name); return; }
    api.getPosition(positionIdFilter).then((p) => setPositionName(p.name)).catch(() => setPositionName(positionIdFilter));
  }, [positionIdFilter, allPositions]);

  const clearUrlFilter = (param: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);
    const qs = params.toString();
    router.push(qs ? `/employees?${qs}` : '/employees');
  };

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return employees.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase();
      const email = (getPrimaryContact(employee)?.email || '').toLowerCase();
      const position = getPositionName(employee).toLowerCase();
      const department = getDepartmentName(employee).toLowerCase();

      const matchesSearch = !term || name.includes(term) || email.includes(term) || position.includes(term) || department.includes(term);
      const matchesStatus = !statusFilter || employee.status === statusFilter;

      // Department filter: URL param OR dropdown
      const activeDeptId = departmentIdFilter || departmentFilter;
      const matchesDepartment = !activeDeptId || employee.employee_department?.some(
        (ed) => ed.department_id === activeDeptId || ed.department?.id === activeDeptId
      );

      // Position filter: URL param OR dropdown
      const activePosId = positionIdFilter || positionFilter;
      const matchesPosition = !activePosId || employee.employee_position?.some(
        (ep) => ep.position_id === activePosId || ep.position?.id === activePosId
      );

      return matchesSearch && matchesStatus && matchesDepartment && matchesPosition;
    });
  }, [employees, searchTerm, statusFilter, departmentIdFilter, departmentFilter, positionIdFilter, positionFilter]);

  const sortedEmployees = useMemo(() => {
    const list = [...filteredEmployees];

    list.sort((a, b) => {
      const aName = getEmployeeName(a);
      const bName = getEmployeeName(b);
      const aEmail = getPrimaryContact(a)?.email || '';
      const bEmail = getPrimaryContact(b)?.email || '';
      const aPosition = getPositionName(a);
      const bPosition = getPositionName(b);
      const aDepartment = getDepartmentName(a);
      const bDepartment = getDepartmentName(b);
      const aStatus = getStatusLabel(a.status);
      const bStatus = getStatusLabel(b.status);

      let result = 0;
      switch (sortField) {
        case 'email':
          result = aEmail.localeCompare(bEmail, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'position':
          result = aPosition.localeCompare(bPosition, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'department':
          result = aDepartment.localeCompare(bDepartment, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'status':
          result = aStatus.localeCompare(bStatus, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'name':
        default:
          result = aName.localeCompare(bName, 'pt-BR', { sensitivity: 'base' });
      }

      return sortDirection === 'asc' ? result : -result;
    });

    return list;
  }, [filteredEmployees, sortField, sortDirection]);

  const handleSortBy = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const handleTermination = (id: string) => {
    // Funcionalidade de desligamento será implementada futuramente
  };

  if (loading || isLoadingCompany) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedCompanyId) {
    return (
      <Paper
        sx={{
          p: 6,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
          boxShadow: 'none',
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Nenhuma empresa selecionada
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecione uma empresa no topo da aplicação para listar os colaboradores.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Colaboradores
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sortedEmployees.length} colaboradores encontrados
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Importar / Exportar colaboradores">
            <Button
              variant="outlined"
              startIcon={<FileSpreadsheet size={16} />}
              onClick={() => setImportExportOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.813rem', borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}
            >
              Importar / Exportar
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => router.push('/employees/new')}
            sx={{
            bgcolor: 'primary.main',
            textTransform: 'none',
            px: 2.5,
            py: 1,
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
          }}
        >
          Novo Colaborador
        </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nome, cargo ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Departamento"
            value={departmentIdFilter || departmentFilter}
            onChange={(e) => {
              if (departmentIdFilter) clearUrlFilter('department');
              setDepartmentFilter(e.target.value);
            }}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {allDepartments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Cargo"
            value={positionIdFilter || positionFilter}
            onChange={(e) => {
              if (positionIdFilter) clearUrlFilter('position');
              setPositionFilter(e.target.value);
            }}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {allPositions.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <span>{p.name}</span>
                  {p.position_level?.name && (
                    <Chip
                      label={p.position_level.name}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: '#f0fdf4',
                        color: '#16a34a',
                        ml: 'auto',
                      }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="ACTIVE">Ativo</MenuItem>
            <MenuItem value="ON_LEAVE">Afastado</MenuItem>
            <MenuItem value="INACTIVE">Inativo</MenuItem>
            <MenuItem value="TERMINATED">Desligado</MenuItem>
          </TextField>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={viewMode}
            onChange={(_, value: ViewMode | null) => value && setViewMode(value)}
          >
            <ToggleButton value="grid" aria-label="Visão em bloco">
              <LayoutGrid size={16} />
            </ToggleButton>
            <ToggleButton value="list" aria-label="Visão em lista">
              <ListIcon size={16} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Active URL filter chips */}
      {(departmentIdFilter || positionIdFilter) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">Filtrando por:</Typography>
          {departmentIdFilter && (
            <Chip
              label={`Departamento: ${departmentName || '...'}`}
              size="small"
              onDelete={() => clearUrlFilter('department')}
              deleteIcon={<X size={14} />}
              sx={{
                height: 28,
                fontSize: '0.78rem',
                fontWeight: 600,
                bgcolor: '#F0F2F5',
                color: 'primary.main',
                '& .MuiChip-deleteIcon': { color: 'primary.main', '&:hover': { color: 'primary.dark' } },
              }}
            />
          )}
          {positionIdFilter && (
            <Chip
              label={`Cargo: ${positionName || '...'}`}
              size="small"
              onDelete={() => clearUrlFilter('position')}
              deleteIcon={<X size={14} />}
              sx={{
                height: 28,
                fontSize: '0.78rem',
                fontWeight: 600,
                bgcolor: '#f0fdf4',
                color: '#16a34a',
                '& .MuiChip-deleteIcon': { color: '#16a34a', '&:hover': { color: '#15803d' } },
              }}
            />
          )}
        </Box>
      )}

      {viewMode === 'list' && sortedEmployees.length > 0 && (
        <Paper
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            overflow: 'hidden',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('name')}
                    >
                      COLABORADOR
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'email'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('email')}
                    >
                      CONTATO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'position'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('position')}
                    >
                      CARGO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'department'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('department')}
                    >
                      DEPARTAMENTO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'status'}
                      direction={sortDirection}
                      onClick={() => handleSortBy('status')}
                    >
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    AÇÕES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedEmployees.map((employee) => {
                  const contact = getPrimaryContact(employee);
                  return (
                    <TableRow
                      key={employee.id}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={resolveImageUrl(employee.person?.photo_url)}
                            sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '0.82rem', fontWeight: 700 }}
                          >
                            {getEmployeeName(employee).charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                              {getEmployeeName(employee)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {employee.employee_number || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                          {contact?.email || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {formatPhone(contact?.phone)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                          {getPositionName(employee)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={getDepartmentName(employee)}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            bgcolor: '#F0F2F5',
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: '#E8EBF0',
                             }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={getStatusLabel(employee.status)}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            ...getStatusStyle(employee.status),
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 1.5 }} align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Ver colaborador">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/employees/${employee.id}`)}
                              sx={{ color: 'text.secondary', '&:hover': { color: '#0f172a', bgcolor: 'transparent' } }}
                            >
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar colaborador">
                            <IconButton
                              size="small"
                              onClick={() => router.push(`/employees/edit/${employee.id}`)}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                            >
                              <Edit size={18} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Desligar colaborador">
                            <IconButton
                              size="small"
                              onClick={() => handleTermination(employee.id)}
                              sx={{ color: 'text.secondary', '&:hover': { color: '#f59e0b', bgcolor: 'transparent' } }}
                            >
                              <UserMinus size={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {viewMode === 'grid' && sortedEmployees.length > 0 && (
        <Grid container spacing={2}>
          {sortedEmployees.map((employee) => {
            const contact = getPrimaryContact(employee);
            return (
              <Grid key={employee.id} size={{ xs: 6, sm: 4, md: 3, xl: 2 }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    height: '100%',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#93c5fd',
                      boxShadow: '0 4px 20px rgba(37, 99, 235, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => router.push(`/employees/${employee.id}`)}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    {/* Avatar + Name + Position */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2.5, pb: 1.5, px: 1.5 }}>
                      <Avatar
                        src={resolveImageUrl(employee.person?.photo_url)}
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: 'primary.main',
                          fontSize: '1.3rem',
                          fontWeight: 700,
                          mb: 1.2,
                          border: '3px solid #e2e8f0',
                        }}
                      >
                        {getEmployeeName(employee).charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        sx={{ fontSize: '0.88rem', textAlign: 'center', lineHeight: 1.3, maxWidth: '100%' }}
                        noWrap
                      >
                        {getEmployeeName(employee)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.76rem', textAlign: 'center', mt: 0.3 }}
                        noWrap
                      >
                        {getPositionName(employee)}
                      </Typography>

                      {/* Department chip */}
                      <Chip
                        label={getDepartmentName(employee)}
                        size="small"
                        sx={{
                          mt: 1,
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          bgcolor: '#F0F2F5',
                          color: 'primary.main',
                          border: '1px solid #E8EBF0',
                        }}
                      />
                    </Box>

                    {/* Contact info - centered */}
                    <Box sx={{ px: 1.5, pb: 1.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                          <Mail size={12} color="#94a3b8" />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.72rem' }}>
                            {contact?.email || '-'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                          <Phone size={12} color="#94a3b8" />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.72rem' }}>
                            {formatPhone(contact?.phone)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Status */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        px: 1.5,
                        py: 1.2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        bgcolor: '#fafbfc',
                      }}
                    >
                      <Chip
                        label={getStatusLabel(employee.status)}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          ...getStatusStyle(employee.status),
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {sortedEmployees.length === 0 && (
        <Paper
          sx={{
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
          }}
        >
          <User size={44} color="#94a3b8" />
          <Typography variant="h6" fontWeight={600} sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>
            Nenhum colaborador encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.85rem' }}>
            {searchTerm ? 'Tente buscar com outros termos.' : 'Crie o primeiro colaborador para esta empresa.'}
          </Typography>
          <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => router.push('/employees/new')}
          sx={{
            bgcolor: 'primary.main',
            textTransform: 'none',
            px: 2.5,
            py: 1,
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
          }}
        >
          Novo Colaborador
        </Button>
        </Paper>
      )}

      <ImportExportModal
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        onImportSuccess={fetchData}
      />
    </Box>
  );
}
