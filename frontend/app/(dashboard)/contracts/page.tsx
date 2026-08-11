'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCompanyContext } from '@/lib/hooks/useCompanyContext';
import { api, Contract, ContractTypeConfig, Employee } from '@/lib/api';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { BriefcaseBusiness, Edit, Eye, FileText, Plus, Search, Trash2 } from 'lucide-react';
import DateInput from '@/components/ui/DateInput';

type ContractStatus = 'Ativo' | 'Renovacao Pendente' | 'Encerrado';
type SortDirection = 'asc' | 'desc';
type SortField = 'employee' | 'type' | 'startDate' | 'endDate' | 'status';

interface ContractForm {
  employee_id: string;
  contract_type: string;
  payment_category: string;
  work_hours: string;
  start_date: string;
  end_date: string;
}

const EMPTY_FORM: ContractForm = {
  employee_id: '',
  contract_type: 'INDEFINITE',
  payment_category: 'MONTHLY',
  work_hours: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
};

const fallbackContractTypeLabels: Record<string, string> = {
  INDEFINITE: 'Indeterminado',
  FIXED_TERM: 'Prazo Determinado',
  APPRENTICE: 'Aprendiz',
  TEMPORARY: 'Temporario',
  EXPERIENCE: 'Experiencia',
};

const paymentCategoryLabels: Record<string, string> = {
  MONTHLY: 'Mensal',
  HOURLY: 'Por hora',
  COMMISSION: 'Comissao',
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null): string {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('pt-BR') : '-';
}

function employeeName(contract: Contract): string {
  return contract.employee?.person?.legal_name || contract.employee?.employee_number || 'Colaborador sem nome';
}

function employeePhoto(contract: Contract): string | undefined {
  return contract.employee?.person?.photo_url || undefined;
}

function getStatus(contract: Contract): ContractStatus {
  const endDate = parseDate(contract.end_date);
  if (!endDate) return 'Ativo';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (end < today) return 'Encerrado';

  const daysUntilEnd = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilEnd <= 30 ? 'Renovacao Pendente' : 'Ativo';
}

function getStatusColor(status: ContractStatus) {
  switch (status) {
    case 'Ativo':
      return { bg: '#dcfce7', color: '#166534' };
    case 'Renovacao Pendente':
      return { bg: '#fef3c7', color: '#854d0e' };
    case 'Encerrado':
      return { bg: '#fee2e2', color: '#991b1b' };
    default:
      return { bg: '#f1f5f9', color: '#475569' };
  }
}

export default function ContractsPage() {
  const { selectedCompanyId, isLoading: isLoadingCompany } = useCompanyContext();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractTypeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM);

  const hasCompany = Boolean(selectedCompanyId);

  const contractTypeLabel = (value?: string | null) => {
    if (!value) return 'Nao informado';
    return contractTypes.find((type) => type.value === value)?.label || fallbackContractTypeLabels[value] || value;
  };

  const fetchData = async () => {
    if (!hasCompany) {
      setContracts([]);
      setEmployees([]);
      setContractTypes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [contractsResp, employeesResp, typesResp] = await Promise.all([
        api.getContracts({ take: 100 }),
        api.getEmployees({ take: 200 }),
        api.getContractTypeConfigs(),
      ]);
      setContracts(contractsResp);
      setEmployees(employeesResp);
      setContractTypes(typesResp);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contratos');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCompany) {
      fetchData();
    }
  }, [isLoadingCompany, selectedCompanyId]);

  const employeeOptions = useMemo(() => {
    return employees.map((employee) => ({
      id: employee.id,
      label: employee.person?.legal_name || employee.employee_number || 'Colaborador sem nome',
    }));
  }, [employees]);

  const filteredContracts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return contracts.filter((contract) => {
      const status = getStatus(contract);
      if (statusFilter && status !== statusFilter) return false;
      if (!term) return true;
      return [
        employeeName(contract),
        contract.employee?.employee_number || '',
        contractTypeLabel(contract.contract_type),
        contract.work_hours || '',
        contract.payment_category ? paymentCategoryLabels[contract.payment_category] || contract.payment_category : '',
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [contracts, searchTerm, statusFilter, contractTypes]);

  const sortedContracts = useMemo(() => {
    const list = [...filteredContracts];
    list.sort((a, b) => {
      let result = 0;
      switch (sortField) {
        case 'employee':
          result = employeeName(a).localeCompare(employeeName(b), 'pt-BR', { sensitivity: 'base' });
          break;
        case 'type':
          result = contractTypeLabel(a.contract_type).localeCompare(contractTypeLabel(b.contract_type), 'pt-BR', { sensitivity: 'base' });
          break;
        case 'endDate':
          result = (parseDate(a.end_date)?.getTime() || 0) - (parseDate(b.end_date)?.getTime() || 0);
          break;
        case 'status':
          result = getStatus(a).localeCompare(getStatus(b), 'pt-BR', { sensitivity: 'base' });
          break;
        case 'startDate':
        default:
          result = (parseDate(a.start_date)?.getTime() || 0) - (parseDate(b.start_date)?.getTime() || 0);
          break;
      }
      return sortDirection === 'asc' ? result : -result;
    });
    return list;
  }, [filteredContracts, sortField, sortDirection, contractTypes]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection(field === 'startDate' ? 'desc' : 'asc');
  };

  const setField = (field: keyof ContractForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditingContract(null);
    setForm({
      ...EMPTY_FORM,
      contract_type: contractTypes[0]?.value || EMPTY_FORM.contract_type,
    });
    setFormError(null);
    setOpenDialog(true);
  };

  const openEdit = (contract: Contract) => {
    setEditingContract(contract);
    setForm({
      employee_id: contract.employee_id,
      contract_type: contract.contract_type || 'INDEFINITE',
      payment_category: contract.payment_category || 'MONTHLY',
      work_hours: contract.work_hours || '',
      start_date: contract.start_date?.slice(0, 10) || '',
      end_date: contract.end_date?.slice(0, 10) || '',
    });
    setFormError(null);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setEditingContract(null);
    setFormError(null);
  };

  const saveContract = async () => {
    if (!form.employee_id) {
      setFormError('Selecione um colaborador');
      return;
    }
    if (!form.start_date) {
      setFormError('Informe a data de inicio');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const payload = {
        employee_id: form.employee_id,
        contract_type: form.contract_type as any,
        payment_category: form.payment_category as any,
        work_hours: form.work_hours.trim() || undefined,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
      };

      if (editingContract) {
        await api.updateContract(editingContract.id, payload as any);
        setSuccessMessage('Contrato atualizado com sucesso');
      } else {
        await api.createContract(payload as any);
        setSuccessMessage('Contrato criado com sucesso');
      }

      closeDialog();
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar contrato');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingContract) return;

    try {
      setDeleting(true);
      await api.deleteContract(deletingContract.id);
      setSuccessMessage('Contrato excluido com sucesso');
      setDeletingContract(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir contrato');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || isLoadingCompany) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasCompany) {
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
          Selecione uma empresa no topo da aplicacao para listar os contratos.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Contratos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} cadastrado{contracts.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={openCreate}
          disabled={employeeOptions.length === 0}
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
          Novo Contrato
        </Button>
      </Box>

      <Paper
        sx={{
          p: 1.5,
          mb: 2.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Buscar por colaborador, tipo ou jornada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Ativo">Ativo</MenuItem>
            <MenuItem value="Renovacao Pendente">Renovacao Pendente</MenuItem>
            <MenuItem value="Encerrado">Encerrado</MenuItem>
          </TextField>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {employeeOptions.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Cadastre um colaborador antes de criar contratos.
        </Alert>
      )}

      {sortedContracts.length === 0 ? (
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
          <BriefcaseBusiness size={44} color="#94a3b8" />
          <Typography variant="h6" fontWeight={600} sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>
            Nenhum contrato encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.85rem' }}>
            {searchTerm || statusFilter ? 'Ajuste os filtros para ver outros contratos.' : 'Crie o primeiro contrato para um colaborador desta empresa.'}
          </Typography>
          {!searchTerm && !statusFilter && employeeOptions.length > 0 && (
            <Button variant="contained" startIcon={<Plus size={18} />} onClick={openCreate} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Novo Contrato
            </Button>
          )}
        </Paper>
      ) : (
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
                    <TableSortLabel active={sortField === 'employee'} direction={sortField === 'employee' ? sortDirection : 'asc'} onClick={() => handleSort('employee')}>
                      COLABORADOR
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'type'} direction={sortField === 'type' ? sortDirection : 'asc'} onClick={() => handleSort('type')}>
                      TIPO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>JORNADA</TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'startDate'} direction={sortField === 'startDate' ? sortDirection : 'asc'} onClick={() => handleSort('startDate')}>
                      INICIO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'endDate'} direction={sortField === 'endDate' ? sortDirection : 'asc'} onClick={() => handleSort('endDate')}>
                      FIM
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortField === 'status'} direction={sortField === 'status' ? sortDirection : 'asc'} onClick={() => handleSort('status')}>
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">ACOES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedContracts.map((contract) => {
                  const status = getStatus(contract);
                  const statusColors = getStatusColor(status);

                  return (
                    <TableRow key={contract.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={employeePhoto(contract)} alt={employeeName(contract)} sx={{ width: 38, height: 38 }}>
                            {employeeName(contract).slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                              {employeeName(contract)}
                            </Typography>
                            {contract.employee?.employee_number && (
                              <Typography variant="caption" color="text.secondary">
                                Matricula {contract.employee.employee_number}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileText size={14} color="#64748b" />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {contractTypeLabel(contract.contract_type)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {contract.work_hours || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {formatDate(contract.start_date)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {contract.end_date ? formatDate(contract.end_date) : 'Indeterminado'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={status}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: statusColors.bg,
                            color: statusColors.color,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }} align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Ver detalhes">
                            <IconButton size="small" onClick={() => setViewingContract(contract)} sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'primary.main' } }}>
                              <Eye size={17} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(contract)} sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'primary.main' } }}>
                              <Edit size={17} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton size="small" onClick={() => setDeletingContract(contract)} sx={{ color: 'text.secondary', '&:hover': { bgcolor: '#fee2e2', color: '#ef4444' } }}>
                              <Trash2 size={17} />
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

      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2, border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
        </DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField fullWidth select label="Colaborador" size="small" value={form.employee_id} onChange={(e) => setField('employee_id', e.target.value)} required disabled={Boolean(editingContract) || saving}>
              <MenuItem value="">Selecione o colaborador</MenuItem>
              {employeeOptions.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField fullWidth select label="Tipo de Contrato" size="small" value={form.contract_type} onChange={(e) => setField('contract_type', e.target.value)} required disabled={saving}>
              {contractTypes.length === 0 && Object.entries(fallbackContractTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
              {contractTypes.map((type) => (
                <MenuItem key={type.id} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField fullWidth select label="Categoria de Pagamento" size="small" value={form.payment_category} onChange={(e) => setField('payment_category', e.target.value)} disabled={saving}>
              {Object.entries(paymentCategoryLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Jornada" placeholder="Ex: 44h semanais" size="small" value={form.work_hours} onChange={(e) => setField('work_hours', e.target.value)} disabled={saving} />
            <DateInput label="Data de Inicio" value={form.start_date} onChange={(value) => setField('start_date', value)} required disabled={saving} />
            <DateInput label="Data de Termino" value={form.end_date} onChange={(value) => setField('end_date', value)} helperText="Deixe em branco para contrato indeterminado" disabled={saving} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={closeDialog} disabled={saving} sx={{ textTransform: 'none', fontSize: '0.875rem', color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveContract} disabled={saving} sx={{ bgcolor: 'primary.main', textTransform: 'none', fontSize: '0.875rem', fontWeight: 600, boxShadow: 'none' }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(viewingContract)} onClose={() => setViewingContract(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Detalhes do Contrato</DialogTitle>
        <DialogContent>
          {viewingContract && (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2"><strong>Colaborador:</strong> {employeeName(viewingContract)}</Typography>
              <Typography variant="body2"><strong>Tipo:</strong> {contractTypeLabel(viewingContract.contract_type)}</Typography>
              <Typography variant="body2"><strong>Pagamento:</strong> {viewingContract.payment_category ? paymentCategoryLabels[viewingContract.payment_category] || viewingContract.payment_category : '-'}</Typography>
              <Typography variant="body2"><strong>Jornada:</strong> {viewingContract.work_hours || '-'}</Typography>
              <Typography variant="body2"><strong>Inicio:</strong> {formatDate(viewingContract.start_date)}</Typography>
              <Typography variant="body2"><strong>Fim:</strong> {viewingContract.end_date ? formatDate(viewingContract.end_date) : 'Indeterminado'}</Typography>
              <Typography variant="body2"><strong>Status:</strong> {getStatus(viewingContract)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setViewingContract(null)} sx={{ textTransform: 'none' }}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deletingContract)} onClose={() => setDeletingContract(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, border: '1px solid', borderColor: 'divider' } }}>
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Excluir Contrato</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Tem certeza que deseja excluir o contrato de <strong>{deletingContract ? employeeName(deletingContract) : ''}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeletingContract(null)} disabled={deleting} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={confirmDelete} disabled={deleting} sx={{ bgcolor: '#ef4444', textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: '#dc2626', boxShadow: 'none' } }}>
            {deleting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(successMessage)} autoHideDuration={4000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
