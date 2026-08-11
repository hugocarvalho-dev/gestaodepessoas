'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Paper,
} from '@mui/material';
import { Search, Plus, Pencil, Trash2, CreditCard, Users, Building, Clock } from 'lucide-react';
import { adminApi, Plan } from '@/lib/admin-api';

const BRAND = { primary: '#0A1E3D', accent: '#D4A84B' };

const defaultForm = {
  name: '',
  description: '',
  max_employees: 50,
  max_users: 5,
  max_companies: 1,
  price_monthly: 0,
  price_yearly: 0,
  is_trial: false,
  trial_days: 14,
  features: '',
  is_active: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPlans = useCallback(async () => {
    try {
      const data = await adminApi.getPlans();
      setPlans(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const filtered = plans
    .filter(
      (p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  const handleNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setError('');
    setDialogOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description || '',
      max_employees: plan.max_employees,
      max_users: plan.max_users,
      max_companies: plan.max_companies,
      price_monthly: Number(plan.price_monthly),
      price_yearly: Number(plan.price_yearly),
      is_trial: plan.is_trial,
      trial_days: plan.trial_days,
      features: plan.features ? (typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features)) : '',
      is_active: plan.is_active,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleDelete = (plan: Plan) => {
    setDeleting(plan);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let features: any = null;
      if (form.features.trim()) {
        try {
          features = JSON.parse(form.features);
        } catch {
          features = form.features.split(',').map((f: string) => f.trim()).filter(Boolean);
        }
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        max_employees: form.max_employees,
        max_users: form.max_users,
        max_companies: form.max_companies,
        price_monthly: form.price_monthly,
        price_yearly: form.price_yearly,
        is_trial: form.is_trial,
        trial_days: form.is_trial ? form.trial_days : 0,
        features,
        is_active: form.is_active,
      };

      if (editing) {
        await adminApi.updatePlan(editing.id, payload);
      } else {
        await adminApi.createPlan(payload);
      }
      setDialogOpen(false);
      loadPlans();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await adminApi.deletePlan(deleting.id);
      setDeleteDialogOpen(false);
      setDeleting(null);
      loadPlans();
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir plano');
    }
  };

  const fmtCurrency = (val: number) =>
    `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: BRAND.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: BRAND.primary }}>
            Planos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Gerencie os planos disponíveis para os clientes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleNew}
          sx={{
            bgcolor: '#0A1E3D',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            py: 1,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#132d54', boxShadow: 'none' },
          }}
        >
          Novo Plano
        </Button>
      </Box>

      {/* Search */}
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
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar planos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Plans Table */}
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
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>PLANO</TableCell>
                <TableCell>LIMITES</TableCell>
                <TableCell>PREÇO</TableCell>
                <TableCell>TIPO</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell align="right">AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum plano encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((plan) => (
                  <TableRow
                    key={plan.id}
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            bgcolor: plan.is_trial ? '#fef3c7' : `${BRAND.primary}10`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {plan.is_trial ? (
                            <Clock size={18} color="#d97706" />
                          ) : (
                            <CreditCard size={18} color={BRAND.primary} />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', color: BRAND.primary }}>
                            {plan.name}
                          </Typography>
                          {plan.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {plan.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          icon={<Users size={12} />}
                          label={`${plan.max_employees} colab.`}
                          size="small"
                          sx={{ fontSize: '0.65rem', fontWeight: 600, height: 24, bgcolor: 'rgba(10,30,61,0.06)', color: BRAND.primary }}
                        />
                        <Chip
                          icon={<Users size={12} />}
                          label={`${plan.max_users} usr.`}
                          size="small"
                          sx={{ fontSize: '0.65rem', fontWeight: 600, height: 24, bgcolor: 'rgba(10,30,61,0.06)', color: BRAND.primary }}
                        />
                        <Chip
                          icon={<Building size={12} />}
                          label={`${plan.max_companies} emp.`}
                          size="small"
                          sx={{ fontSize: '0.65rem', fontWeight: 600, height: 24, bgcolor: 'rgba(10,30,61,0.06)', color: BRAND.primary }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', color: BRAND.primary }}>
                        {fmtCurrency(Number(plan.price_monthly))}
                      </Typography>
                      {Number(plan.price_yearly) > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {fmtCurrency(Number(plan.price_yearly))}/ano
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      {plan.is_trial ? (
                        <Chip
                          label={`Trial ${plan.trial_days}d`}
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            height: 22,
                            bgcolor: '#fef3c7',
                            color: '#d97706',
                          }}
                        />
                      ) : (
                        <Chip
                          label="Comercial"
                          size="small"
                          sx={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            height: 22,
                            bgcolor: '#dcfce7',
                            color: '#16a34a',
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={plan.is_active ? 'Ativo' : 'Inativo'}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          height: 22,
                          bgcolor: plan.is_active ? '#dcfce7' : '#f3f4f6',
                          color: plan.is_active ? '#16a34a' : '#9ca3af',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }} align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEdit(plan)} sx={{ color: '#94a3b8', mr: 0.5 }}>
                          <Pencil size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => handleDelete(plan)} sx={{ color: '#94a3b8' }}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: BRAND.primary, pb: 1 }}>
          {editing ? 'Editar Plano' : 'Novo Plano'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Nome do Plano"
            fullWidth
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1, mb: 2, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            size="small"
          />

          <TextField
            label="Descrição"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            size="small"
          />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: BRAND.primary, fontSize: '0.85rem' }}>
            Limites
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              label="Máx. Colaboradores"
              type="number"
              value={form.max_employees}
              onChange={(e) => setForm({ ...form, max_employees: parseInt(e.target.value) || 0 })}
              size="small"
              sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            />
            <TextField
              label="Máx. Usuários"
              type="number"
              value={form.max_users}
              onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || 0 })}
              size="small"
              sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            />
            <TextField
              label="Máx. Empresas"
              type="number"
              value={form.max_companies}
              onChange={(e) => setForm({ ...form, max_companies: parseInt(e.target.value) || 0 })}
              size="small"
              sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            />
          </Box>

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: BRAND.primary, fontSize: '0.85rem' }}>
            Preço
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              label="Preço Mensal (R$)"
              type="number"
              value={form.price_monthly}
              onChange={(e) => setForm({ ...form, price_monthly: parseFloat(e.target.value) || 0 })}
              size="small"
              sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            />
            <TextField
              label="Preço Anual (R$)"
              type="number"
              value={form.price_yearly}
              onChange={(e) => setForm({ ...form, price_yearly: parseFloat(e.target.value) || 0 })}
              size="small"
              sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            />
          </Box>

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: BRAND.primary, fontSize: '0.85rem' }}>
            Configurações
          </Typography>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_trial}
                  onChange={(e) => setForm({ ...form, is_trial: e.target.checked })}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND.accent }, '& .MuiSwitch-switchBase.Mui-checked+.MuiSwitch-track': { bgcolor: BRAND.accent } }}
                />
              }
              label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Plano Trial (período de teste)</Typography>}
            />
          </Box>

          {form.is_trial && (
            <TextField
              label="Dias de Trial"
              type="number"
              value={form.trial_days}
              onChange={(e) => setForm({ ...form, trial_days: parseInt(e.target.value) || 0 })}
              size="small"
              fullWidth
              sx={{ mb: 2, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
            />
          )}

          <TextField
            label="Features (separadas por vírgula)"
            fullWidth
            multiline
            rows={2}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            placeholder="Ex: Relatórios, Dashboard, Importação"
            size="small"
            sx={{ mb: 2, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND.accent } }}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND.accent }, '& .MuiSwitch-switchBase.Mui-checked+.MuiSwitch-track': { bgcolor: BRAND.accent } }}
                />
              }
              label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Plano ativo</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: BRAND.primary,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { bgcolor: '#132d54' },
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : editing ? 'Salvar' : 'Criar Plano'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#dc2626' }}>
          Excluir Plano
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Tem certeza que deseja excluir o plano <strong>{deleting?.name}</strong>?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{
              bgcolor: '#dc2626',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
