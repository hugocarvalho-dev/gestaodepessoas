'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyContext } from '@/lib/hooks/useCompanyContext';
import { api, Position, PositionLevel } from '@/lib/api';
import {
  Alert,
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
import { Briefcase, Edit, Plus, Search, Trash2, Users } from 'lucide-react';
type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'description' | 'employees' | 'level';

function truncateDescription(desc?: string | null, maxLen = 100): string {
  if (!desc) return '-';
  if (desc.length <= maxLen) return desc;
  return desc.slice(0, maxLen).trimEnd() + '...';
}

export default function PositionsPage() {
  const router = useRouter();
  const { selectedCompanyId, isLoading: isLoadingCompany } = useCompanyContext();

  const [positions, setPositions] = useState<Position[]>([]);
  const [positionLevels, setPositionLevels] = useState<PositionLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLevelId, setFormLevelId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAllCompanies = !selectedCompanyId;

  /* ---- fetch ---- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const posResponse = await api.getPositions();
      const levelsResponse = isAllCompanies ? [] : await api.getPositionLevels();
      setPositions(posResponse);
      setPositionLevels(levelsResponse);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cargos');
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCompany) {
      fetchData();
    }
  }, [isLoadingCompany, selectedCompanyId]);

  /* ---- filter ---- */
  const filteredPositions = useMemo(() => {
    let list = positions;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((p) => {
        const name = p.name.toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(term) || desc.includes(term);
      });
    }

    if (levelFilter) {
      list = list.filter((p) => p.position_level_id === levelFilter);
    }

    return list;
  }, [positions, searchTerm, levelFilter]);

  /* ---- sort ---- */
  const sortedPositions = useMemo(() => {
    const list = [...filteredPositions];
    list.sort((a, b) => {
      let result = 0;
      switch (sortField) {
        case 'name':
          result = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'description':
          result = (a.description || '').localeCompare(b.description || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'level':
          result = (a.position_level?.name || '').localeCompare(b.position_level?.name || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'employees':
          result = (a.employeeCount || 0) - (b.employeeCount || 0);
          break;
      }
      return sortDirection === 'asc' ? result : -result;
    });
    return list;
  }, [filteredPositions, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /* ---- dialog handlers ---- */
  const handleOpenCreate = () => {
    setEditingPosition(null);
    setFormName('');
    setFormDescription('');
    setFormLevelId('');
    setFormError(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (position: Position) => {
    setEditingPosition(position);
    setFormName(position.name);
    setFormDescription(position.description || '');
    setFormLevelId(position.position_level_id || '');
    setFormError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPosition(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Nome do cargo é obrigatório');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (editingPosition) {
        await api.updatePosition(editingPosition.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          position_level_id: formLevelId || null,
        });
        setSuccessMessage('Cargo atualizado com sucesso');
      } else {
        await api.createPosition({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          position_level_id: formLevelId || null,
        });
        setSuccessMessage('Cargo criado com sucesso');
      }
      handleCloseDialog();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar cargo');
    } finally {
      setSaving(false);
    }
  };

  /* ---- delete ---- */
  const handleOpenDelete = (position: Position) => {
    setDeletingPosition(position);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingPosition) return;
    try {
      setDeleting(true);
      await api.deletePosition(deletingPosition.id);
      setSuccessMessage('Cargo excluído com sucesso');
      setOpenDeleteDialog(false);
      setDeletingPosition(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir cargo');
      setOpenDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  /* ---- navigate to employees filtered by position ---- */
  const handleClickEmployeeCount = (position: Position) => {
    router.push(`/employees?position=${position.id}`);
  };

  const totalCount = positions.length;

  /* ---- loading ---- */
  if (loading || isLoadingCompany) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
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
          Selecione uma empresa no topo da aplicação para listar os cargos.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Cargos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount} cargo{totalCount !== 1 ? 's' : ''} cadastrado{totalCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleOpenCreate}
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
          Novo Cargo
        </Button>
      </Box>

      {/* Search */}
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
            placeholder="Buscar cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 260 }}
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
            label="Nível"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {positionLevels.map((level) => (
              <MenuItem key={level.id} value={level.id}>{level.name}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {sortedPositions.length === 0 && !loading && (
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
          <Briefcase size={44} color="#94a3b8" />
          <Typography variant="h6" fontWeight={600} sx={{ mt: 2, mb: 1, fontSize: '1rem' }}>
            Nenhum cargo encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.85rem' }}>
            {searchTerm || levelFilter ? 'Tente buscar com outros termos ou ajuste o filtro.' : 'Crie o primeiro cargo para esta empresa.'}
          </Typography>
          {!searchTerm && !levelFilter && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleOpenCreate}
              sx={{
                bgcolor: 'primary.main',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
              }}
            >
              Novo Cargo
            </Button>
          )}
        </Paper>
      )}

      {/* Table */}
      {sortedPositions.length > 0 && (
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
                      CARGO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'level'}
                      direction={sortField === 'level' ? sortDirection : 'asc'}
                      onClick={() => handleSort('level')}
                    >
                      NÍVEL
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
                  <TableCell>
                    <TableSortLabel
                      active={sortField === 'description'}
                      direction={sortField === 'description' ? sortDirection : 'asc'}
                      onClick={() => handleSort('description')}
                    >
                      DESCRIÇÃO
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    AÇÕES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPositions.map((position) => {
                  const empCount = position.employeeCount ?? position.employee_position?.length ?? 0;

                  return (
                    <TableRow
                      key={position.id}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        '&:last-child td': { borderBottom: 0 },
                      }}
                    >
                      {/* Nome do cargo */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1.5,
                              bgcolor: '#F0F2F5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Briefcase size={18} color="#0A1E3D" />
                          </Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                            {position.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Nível */}
                      <TableCell sx={{ py: 1.25 }}>
                        {position.position_level ? (
                          <Chip
                            label={position.position_level.name}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              bgcolor: '#f0fdf4',
                              color: '#16a34a',
                              border: '1px solid',
                              borderColor: '#dcfce7',
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Quantidade de colaboradores - clicável */}
                      <TableCell sx={{ py: 1.25 }}>
                        <Chip
                          label={empCount}
                          icon={<Users size={12} />}
                          size="small"
                          onClick={() => handleClickEmployeeCount(position)}
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

                      {/* Descrição truncada com tooltip */}
                      <TableCell sx={{ py: 1.25, maxWidth: 280 }}>
                        {position.description ? (
                          <Tooltip title={position.description} arrow placement="top-start">
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.8rem',
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 280,
                                display: 'block',
                                cursor: 'default',
                              }}
                            >
                              {truncateDescription(position.description)}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* Ações */}
                      <TableCell sx={{ py: 1.25 }} align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(position)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
                              }}
                            >
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(position)}
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
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
          {editingPosition ? 'Editar Cargo' : 'Novo Cargo'}
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
              label="Nome do Cargo"
              placeholder="Ex: Analista de Sistemas"
              required
              size="small"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <TextField
              fullWidth
              select
              label="Nível"
              size="small"
              value={formLevelId}
              onChange={(e) => setFormLevelId(e.target.value)}
              helperText="Opcional. Ex: Júnior, Pleno, Sênior"
            >
              <MenuItem value="">
                <em>Sem nível</em>
              </MenuItem>
              {positionLevels.map((level) => (
                <MenuItem key={level.id} value={level.id}>
                  {level.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descrição"
              placeholder="Descrição das responsabilidades"
              size="small"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
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
        <DialogTitle sx={{ fontSize: '1.1rem', fontWeight: 700 }}>Excluir Cargo</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Tem certeza que deseja excluir o cargo{' '}
            <strong>{deletingPosition?.name}</strong>?
          </Typography>
          {deletingPosition && (deletingPosition.employeeCount || 0) > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Este cargo possui {deletingPosition.employeeCount} colaborador(es) vinculado(s).
              Desvincule-os antes de excluir.
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
            disabled={deleting || (deletingPosition?.employeeCount || 0) > 0}
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
