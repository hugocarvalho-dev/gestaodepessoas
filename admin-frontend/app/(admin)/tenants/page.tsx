'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
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
  Grid,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, Plus, Eye } from 'lucide-react';
import { adminApi, Tenant, PaginatedResponse } from '@/lib/admin-api';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'SUSPENDED', label: 'Suspenso' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'INACTIVE', label: 'Inativo' },
];

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  TRIAL: { bg: '#fef3c7', text: '#d97706', label: 'Trial' },
  ACTIVE: { bg: '#dcfce7', text: '#16a34a', label: 'Ativo' },
  SUSPENDED: { bg: '#fee2e2', text: '#dc2626', label: 'Suspenso' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelado' },
  INACTIVE: { bg: '#f3f4f6', text: '#9ca3af', label: 'Inativo' },
};

export default function TenantsPage() {
  const router = useRouter();
  const [response, setResponse] = useState<PaginatedResponse<Tenant> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTenants({ page, search: search || undefined, status: statusFilter || undefined });
      setResponse(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {response?.meta.total ?? 0} {(response?.meta.total ?? 0) === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setShowCreateModal(true)}
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
          Novo Cliente
        </Button>
      </Box>

      {/* Filters */}
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
            placeholder="Buscar por nome, slug, CNPJ ou e-mail..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            sx={{ minWidth: 150 }}
          >
            {STATUS_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Table */}
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
                <TableCell>CLIENTE</TableCell>
                <TableCell>CNPJ/CPF</TableCell>
                <TableCell>CONTATO</TableCell>
                <TableCell>PLANO</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell>EMPRESAS</TableCell>
                <TableCell align="right">AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : !response?.data.length ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum cliente encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : response.data.map((t) => {
                const sc = statusColors[t.status] || statusColors.INACTIVE;
                return (
                  <TableRow
                    key={t.id}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#0A1E3D', fontSize: '0.82rem', fontWeight: 700 }}>
                          {t.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                            {t.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {t.slug}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                        {t.document || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                        {t.email}
                      </Typography>
                      {t.phone && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {t.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={t.subscription?.plan || 'Sem plano'}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          bgcolor: '#F0F2F5',
                          color: '#0A1E3D',
                          border: '1px solid',
                          borderColor: '#E8EBF0',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        label={sc.label}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: sc.bg,
                          color: sc.text,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                        {t._count?.companies ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }} align="right">
                      <Tooltip title="Ver cliente">
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/tenants/${t.id}`)}
                          sx={{ color: 'text.secondary', '&:hover': { color: '#0f172a', bgcolor: 'transparent' } }}
                        >
                          <Eye size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {response && response.meta.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              borderColor: '#e2e8f0',
              color: '#475569',
              '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
            }}
          >
            Anterior
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', px: 2 }}>
            Página {response.meta.page} de {response.meta.totalPages} ({response.meta.total} resultados)
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={page >= response.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              borderColor: '#e2e8f0',
              color: '#475569',
              '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
            }}
          >
            Próxima
          </Button>
        </Box>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(tenantId) => {
            setShowCreateModal(false);
            router.push(`/tenants/${tenantId}`);
          }}
        />
      )}
    </Box>
  );
}

// ─── Create Tenant Modal ───

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({
    slug: '', name: '', trade_name: '', document: '', email: '', phone: '',
    address: '', address_number: '', complement: '', neighborhood: '',
    city: '', state: '', postal_code: '', country: 'BR',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const created = await adminApi.createTenant(form as any);
      onCreated(created.id);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid #e2e8f0',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', pb: 1 }}>
        Novo Cliente
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" id="create-tenant-form" onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Slug (subdomínio) *"
                size="small"
                fullWidth
                value={form.slug}
                onChange={(e) => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="acme-corp"
                required
                helperText={form.slug ? `${form.slug}.seudominio.com` : ' '}
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="E-mail *"
                size="small"
                fullWidth
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="contato@empresa.com"
                required
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Razão Social *"
                size="small"
                fullWidth
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Empresa LTDA"
                required
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nome Fantasia"
                size="small"
                fullWidth
                value={form.trade_name}
                onChange={(e) => setField('trade_name', e.target.value)}
                placeholder="Empresa"
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="CNPJ/CPF"
                size="small"
                fullWidth
                value={form.document}
                onChange={(e) => setField('document', e.target.value)}
                placeholder="00.000.000/0001-00"
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Telefone"
                size="small"
                fullWidth
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="(11) 99999-9999"
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="CEP"
                size="small"
                fullWidth
                value={form.postal_code}
                onChange={(e) => setField('postal_code', e.target.value)}
                placeholder="00000-000"
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Logradouro"
                size="small"
                fullWidth
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="Rua, Avenida..."
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Número"
                size="small"
                fullWidth
                value={form.address_number}
                onChange={(e) => setField('address_number', e.target.value)}
                placeholder="123"
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Complemento"
                size="small"
                fullWidth
                value={form.complement}
                onChange={(e) => setField('complement', e.target.value)}
                placeholder="Sala 1, Bloco A"
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Bairro"
                size="small"
                fullWidth
                value={form.neighborhood}
                onChange={(e) => setField('neighborhood', e.target.value)}
                placeholder="Centro"
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Cidade"
                size="small"
                fullWidth
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="UF"
                size="small"
                fullWidth
                value={form.state}
                onChange={(e) => setField('state', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                inputProps={{ maxLength: 2 }}
                InputProps={{ sx: { fontSize: '0.875rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            borderColor: '#e2e8f0',
            color: '#475569',
            '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
          }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="create-tenant-form"
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: 'primary.main',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
          }}
        >
          {loading ? 'Criando...' : 'Criar Cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
