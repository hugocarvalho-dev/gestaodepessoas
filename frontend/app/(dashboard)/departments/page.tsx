'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyContext } from '@/lib/hooks/useCompanyContext';
import { api, Department, Employee } from '@/lib/api';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Snackbar,
} from '@mui/material';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  Trash2,
  Network,
  Building2,
  Users,
} from 'lucide-react';

type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'employees' | 'manager' | 'children';
type ViewMode = 'list' | 'grid';

function getEmployeeCount(dept: Department): number {
  return dept.employee_department?.length || 0;
}

function getManagerName(dept: Department) {
  return (dept as any).employee?.person?.legal_name || null;
}

function getChildrenCount(dept: Department): number {
  return dept.other_department?.length || 0;
}

export default function DepartamentosPage() {
  const router = useRouter();
  const { selectedCompanyId, isLoading: isLoadingCompany } = useCompanyContext();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Expand/collapse state for tree
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formManagerId, setFormManagerId] = useState('');
  const [formParentId, setFormParentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Whether viewing all companies
  const isAllCompanies = !selectedCompanyId;

  /* ---- fetch ---- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const deptResponse = await api.getDepartments();
      const empResponse = isAllCompanies ? [] : await api.getEmployees();
      setDepartments(deptResponse);
      setEmployees(empResponse);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCompany) {
      fetchData();
    }
  }, [isLoadingCompany, selectedCompanyId]);

  /* ---- tree structure: only root departments (no parent) ---- */
  const rootDepartments = useMemo(() => {
    return departments.filter((d) => !d.parent_department_id);
  }, [departments]);

  /* ---- filter ---- */
  const matchesSearch = (dept: Department, term: string): boolean => {
    if (!term) return true;
    const name = dept.name.toLowerCase();
    const manager = (getManagerName(dept) || '').toLowerCase();
    const company = (dept.company?.name || '').toLowerCase();
    if (name.includes(term) || manager.includes(term) || company.includes(term)) return true;
    if (dept.other_department?.some((child) => matchesSearch(child, term))) return true;
    return false;
  };

  const filteredRoots = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rootDepartments.filter((dept) => matchesSearch(dept, term));
  }, [rootDepartments, searchTerm]);

  const sortedRoots = useMemo(() => {
    const list = [...filteredRoots];
    list.sort((a, b) => {
      let result = 0;
      switch (sortField) {
        case 'name':
          result = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'employees':
          result = getEmployeeCount(a) - getEmployeeCount(b);
          break;
        case 'manager':
          result = (getManagerName(a) || '').localeCompare(getManagerName(b) || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'children':
          result = getChildrenCount(a) - getChildrenCount(b);
          break;
      }
      return sortDirection === 'asc' ? result : -result;
    });
    return list;
  }, [filteredRoots, sortField, sortDirection]);

  /* ---- toggle expand ---- */
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---- sort handler ---- */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /* Employee options for manager */
  const employeeOptions = useMemo(() => {
    return employees.map((emp) => ({
      id: emp.id,
      label: emp.person?.legal_name || emp.employee_number || 'Colaborador',
    }));
  }, [employees]);

  /* Available parent departments (exclude self and its children when editing) */
  const parentOptions = useMemo(() => {
    if (!editingDept) return departments;
    const excludeIds = new Set<string>();
    const collectIds = (dept: Department) => {
      excludeIds.add(dept.id);
      dept.other_department?.forEach(collectIds);
    };
    collectIds(editingDept);
    return departments.filter((d) => !excludeIds.has(d.id));
  }, [departments, editingDept]);

  /* ---- dialog handlers ---- */
  const handleOpenCreate = (parentId?: string) => {
    setEditingDept(null);
    setFormName('');
    setFormManagerId('');
    setFormParentId(parentId || '');
    setFormError(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormManagerId(dept.manager_employee_id || '');
    setFormParentId(dept.parent_department_id || '');
    setFormError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDept(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Nome do departamento é obrigatório');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (editingDept) {
        await api.updateDepartment(editingDept.id, {
          name: formName.trim(),
          manager_employee_id: formManagerId || null,
          parent_department_id: formParentId || null,
        });
        setSuccessMessage('Departamento atualizado com sucesso');
      } else {
        await api.createDepartment({
          name: formName.trim(),
          company_id: selectedCompanyId || undefined,
          manager_employee_id: formManagerId || undefined,
          parent_department_id: formParentId || undefined,
        });
        setSuccessMessage('Departamento criado com sucesso');
      }
      handleCloseDialog();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar departamento');
    } finally {
      setSaving(false);
    }
  };

  /* ---- delete ---- */
  const handleOpenDelete = (dept: Department) => {
    setDeletingDept(dept);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      setDeleting(true);
      await api.deleteDepartment(deletingDept.id);
      setSuccessMessage('Departamento excluído com sucesso');
      setOpenDeleteDialog(false);
      setDeletingDept(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir departamento');
    } finally {
      setDeleting(false);
    }
  };

  /* ---- navigate to employees ---- */
  const handleClickDept = (dept: Department) => {
    router.push(`/employees?department=${dept.id}`);
  };

  /* ---- view mode ---- */
  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
    if (newMode !== null) setViewMode(newMode);
  };

  /* total count including all children */
  const totalDeptCount = departments.length;

  /* ---- loading ---- */
  if (loading || isLoadingCompany) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  /* ---- Grid Card Component ---- */
  const DeptCard = ({ dept, depth = 0 }: { dept: Department; depth?: number }) => {
    const empCount = getEmployeeCount(dept);
    const manager = getManagerName(dept);
    const children = dept.other_department || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(dept.id);

    return (
      <>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dept.id}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              transition: 'all 0.15s',
              ml: depth * 3,
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                borderColor: '#cbd5e1',
              },
            }}
          >
            <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
              {/* Top row: icon + name + employee chip */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1, cursor: 'pointer' }}
                onClick={() => handleClickDept(dept)}
              >
                {/* Expand/collapse toggle */}
                {hasChildren ? (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(dept.id);
                    }}
                    sx={{ p: 0.25, color: 'text.secondary' }}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </IconButton>
                ) : (
                  <Box sx={{ width: 24 }} />
                )}

                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    bgcolor: '#F0F2F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Network size={18} color="#0A1E3D" />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    noWrap
                    sx={{ fontSize: '0.9rem', lineHeight: 1.3 }}
                  >
                    {dept.name}
                  </Typography>
                  {dept.company?.name && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Building2 size={11} color="#94a3b8" />
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                        {dept.company.name}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Chip
                  label={`${empCount}`}
                  icon={<Users size={12} />}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: '#F0F2F5',
                    color: 'primary.main',
                    '& .MuiChip-icon': { color: '#0A1E3D', ml: 0.5 },
                  }}
                />
              </Box>

              {/* Info row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, ml: 4 }}>
                {manager && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    Gerente: <strong>{manager}</strong>
                  </Typography>
                )}
                {hasChildren && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {children.length} subdept{children.length !== 1 ? 's' : '.'}
                  </Typography>
                )}
              </Box>

              {/* Actions row */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  ml: 4,
                  pt: 0.75,
                  borderTop: '1px solid #f1f5f9',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEdit(dept)}
                    sx={{
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 0.5,
                      '&:hover': { bgcolor: '#F0F2F5', color: 'primary.main', borderColor: '#E8EBF0' },
                    }}
                  >
                    <Edit size={14} />
                  </IconButton>
                </Tooltip>
                {!isAllCompanies && (
                  <Tooltip title="Adicionar subdepartamento">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenCreate(dept.id)}
                      sx={{
                        color: 'text.secondary',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 0.5,
                        '&:hover': { bgcolor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' },
                      }}
                    >
                      <Plus size={14} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Excluir">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDelete(dept)}
                    sx={{
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 0.5,
                      '&:hover': { bgcolor: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' },
                    }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Children (expanded) */}
        {hasChildren && isExpanded && (
          <>
            {children.map((child) => (
              <DeptCard key={child.id} dept={child} depth={depth + 1} />
            ))}
          </>
        )}
      </>
    );
  };

  /* ---- List Row Component (recursive) ---- */
  const DeptRow = ({ dept, depth = 0 }: { dept: Department; depth?: number }) => {
    const empCount = getEmployeeCount(dept);
    const manager = getManagerName(dept);
    const children = dept.other_department || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(dept.id);

    return (
      <>
        <TableRow
          sx={{
            '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' },
            '&:last-child td': { borderBottom: 0 },
          }}
          onClick={() => handleClickDept(dept)}
        >
          <TableCell sx={{ py: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: depth * 3 }}>
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(dept.id);
                  }}
                  sx={{ p: 0.25, color: 'text.secondary' }}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </IconButton>
              ) : (
                <Box sx={{ width: 24 }} />
              )}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: '#F0F2F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Network size={16} color="#0A1E3D" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', lineHeight: 1.2 }}>
                  {dept.name}
                </Typography>
                {dept.company?.name && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {dept.company.name}
                  </Typography>
                )}
              </Box>
            </Box>
          </TableCell>
          <TableCell sx={{ py: 1.25 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {manager || '-'}
            </Typography>
          </TableCell>
          <TableCell sx={{ py: 1.25 }}>
            <Chip
              label={empCount}
              icon={<Users size={12} />}
              size="small"
              onClick={(e) => { e.stopPropagation(); handleClickDept(dept); }}
              sx={{
                height: 22,
                minWidth: 28,
                fontSize: '0.75rem',
                fontWeight: 700,
                bgcolor: '#F0F2F5',
                color: 'primary.main',
                cursor: 'pointer',
                '& .MuiChip-icon': { color: '#0A1E3D', ml: 0.5 },
                '&:hover': { bgcolor: '#E8EBF0' },
              }}
            />
          </TableCell>
          <TableCell sx={{ py: 1.25 }} align="right" onClick={(e) => e.stopPropagation()}>
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  onClick={() => handleOpenEdit(dept)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
                  }}
                >
                  <Edit size={16} />
                </IconButton>
              </Tooltip>
              {!isAllCompanies && (
                <Tooltip title="Subdepartamento">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenCreate(dept.id)}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { bgcolor: '#f0fdf4', color: '#16a34a' },
                    }}
                  >
                    <Plus size={16} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Excluir">
                <IconButton
                  size="small"
                  onClick={() => handleOpenDelete(dept)}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' },
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Tooltip>
            </Box>
          </TableCell>
        </TableRow>

        {/* Children rows */}
        {hasChildren &&
          isExpanded &&
          children.map((child) => <DeptRow key={child.id} dept={child} depth={depth + 1} />)}
      </>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Departamentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalDeptCount} departamento{totalDeptCount !== 1 ? 's' : ''} cadastrado{totalDeptCount !== 1 ? 's' : ''}
            {isAllCompanies && ' (todas as empresas)'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isAllCompanies && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => handleOpenCreate()}
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
              Novo Departamento
            </Button>
          )}
        </Box>
      </Box>

      {/* Search + View Toggle */}
      <Paper
        sx={{
          p: 1.5,
          mb: 2.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar departamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 320 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#94a3b8" />
              </InputAdornment>
            ),
          }}
        />
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
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {sortedRoots.length === 0 && !loading && (
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
          <Network size={44} color="#94a3b8" />
          <Typography variant="h6" fontWeight={600} sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>
            Nenhum departamento encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.85rem' }}>
            {searchTerm ? 'Tente buscar com outros termos.' : 'Crie o primeiro departamento para esta empresa.'}
          </Typography>
          {!searchTerm && !isAllCompanies && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => handleOpenCreate()}
              sx={{
                bgcolor: 'primary.main',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
              }}
            >
              Novo Departamento
            </Button>
          )}
        </Paper>
      )}

      {/* Grid View (tree) */}
      {viewMode === 'grid' && sortedRoots.length > 0 && (
        <Grid container spacing={1.5}>
          {sortedRoots.map((dept) => (
            <DeptCard key={dept.id} dept={dept} />
          ))}
        </Grid>
      )}

      {/* List View (tree) */}
      {viewMode === 'list' && sortedRoots.length > 0 && (
        <Paper
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: 'none',
          }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortField === 'name' ? sortDirection : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      DEPARTAMENTO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'manager'}
                      direction={sortField === 'manager' ? sortDirection : 'asc'}
                      onClick={() => handleSort('manager')}
                    >
                      GERENTE
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'employees'}
                      direction={sortField === 'employees' ? sortDirection : 'asc'}
                      onClick={() => handleSort('employees')}
                    >
                      COLABORADORES
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    AÇÕES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRoots.map((dept) => (
                  <DeptRow key={dept.id} dept={dept} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {editingDept ? 'Editar Departamento' : formParentId ? 'Novo Subdepartamento' : 'Novo Departamento'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Nome do Departamento"
              placeholder="Ex: Recursos Humanos"
              required
              size="small"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />

            {!isAllCompanies && (
              <TextField
                fullWidth
                select
                label="Gerente do Departamento"
                size="small"
                value={formManagerId}
                onChange={(e) => setFormManagerId(e.target.value)}
              >
                <MenuItem value="">Sem gerente</MenuItem>
                {employeeOptions.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.label}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              fullWidth
              select
              label="Pertence ao departamento"
              size="small"
              value={formParentId}
              onChange={(e) => setFormParentId(e.target.value)}
              helperText="Selecione para torná-lo um subdepartamento"
            >
              <MenuItem value="">Nenhum (raiz)</MenuItem>
              {parentOptions.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: 'primary.main',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Excluir Departamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Tem certeza que deseja excluir o departamento{' '}
            <strong>{deletingDept?.name}</strong>? Esta ação não pode ser desfeita.
          </Typography>
          {deletingDept && getChildrenCount(deletingDept) > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este departamento possui {getChildrenCount(deletingDept)} subdepartamento(s). Eles serão movidos para o nível raiz.
            </Alert>
          )}
          {deletingDept && getEmployeeCount(deletingDept) > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este departamento possui colaboradores vinculados. Desvincule-os antes de excluir.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setOpenDeleteDialog(false)}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              bgcolor: '#ef4444',
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' },
            }}
          >
            {deleting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
