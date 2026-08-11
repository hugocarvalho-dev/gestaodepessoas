'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Building2, Edit, LayoutGrid, List as ListIcon, MapPin, Phone, Search } from 'lucide-react';
import { api, Company } from '@/lib/api';

type ViewMode = 'grid' | 'list';

interface CompanyFormData {
  phone: string;
  address: string;
  address_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const defaultFormData: CompanyFormData = {
  phone: '',
  address: '',
  address_number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'BR',
};

const cleanCnpj = (value: string) => value.replace(/\D/g, '');

const formatCnpj = (value?: string) => {
  const digits = cleanCnpj(value || '');
  if (digits.length !== 14) return value || '-';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const formatPhone = (value?: string) => {
  if (!value) return '-';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return value;
};

const formatAddress = (company: Company) => {
  const parts: string[] = [];
  if (company.address) {
    let line = company.address;
    if (company.address_number) line += `, ${company.address_number}`;
    if (company.complement) line += ` - ${company.complement}`;
    parts.push(line);
  }
  if (company.neighborhood) parts.push(company.neighborhood);
  const cityState = [company.city, company.state].filter(Boolean).join(' - ');
  if (cityState) parts.push(cityState);
  if (company.postal_code) parts.push(`CEP: ${company.postal_code}`);
  return parts.join(', ') || '-';
};

const formatPostalCode = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [canManageCompanies, setCanManageCompanies] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = await api.getCurrentUser();

      const hasManagerRole = (currentUser.companies || []).some((company) =>
        (company.roles || []).some((role) =>
          ['SUPER_ADMIN', 'Super Admin', 'SUPERADMIN', 'Admin', 'ADMIN'].includes(role.name),
        ),
      );
      setCanManageCompanies(hasManagerRole);

      const companiesResponse = hasManagerRole
        ? await api.getAllCompaniesForAdmin()
        : await api.getCompanies();

      setCompanies(companiesResponse.filter((company) => company.status !== 'DELETED'));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar empresas');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) => {
      const name = (company.name || '').toLowerCase();
      const cnpj = cleanCnpj(company.document || '');
      const city = (company.city || '').toLowerCase();
      return name.includes(term) || cnpj.includes(cleanCnpj(term)) || city.includes(term);
    });
  }, [companies, searchTerm]);

  const handleOpenDialog = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      phone: company.phone || '',
      address: company.address || '',
      address_number: company.address_number || '',
      complement: company.complement || '',
      neighborhood: company.neighborhood || '',
      city: company.city || '',
      state: company.state || '',
      postal_code: company.postal_code || '',
      country: company.country || 'BR',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCompany(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageCompanies) {
      setError('Apenas administradores podem editar empresas.');
      return;
    }

    if (!selectedCompany) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await api.updateCompany(String(selectedCompany.id), {
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        address_number: formData.address_number || undefined,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postal_code: formData.postal_code || undefined,
        country: formData.country || undefined,
      });

      setSuccess('Empresa atualizada com sucesso!');
      await fetchData();
      setTimeout(() => handleCloseDialog(), 1200);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar empresa');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Empresas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''} encontrada{filteredCompanies.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, mode: ViewMode | null) => mode && setViewMode(mode)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.75,
                border: '1px solid',
                borderColor: 'divider',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              },
            }}
          >
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {viewMode === 'grid' && (
        <Grid container spacing={2}>
          {filteredCompanies.map((company) => (
            <Grid key={company.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        bgcolor: '#F0F2F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={22} color="#0A1E3D" />
                    </Box>
                    <Chip
                      size="small"
                      label={company.status === 'INACTIVE' ? 'Inativa' : 'Ativa'}
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: company.status === 'INACTIVE' ? '#fee2e2' : '#dcfce7',
                        color: company.status === 'INACTIVE' ? '#991b1b' : '#166534',
                      }}
                    />
                  </Box>

                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: '0.95rem', mb: 0.25 }}>
                    {company.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                    {formatCnpj(company.document)}
                  </Typography>

                  {company.phone && (
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                      <Phone size={14} color="#64748b" />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {formatPhone(company.phone)}
                      </Typography>
                    </Stack>
                  )}

                  {(company.city || company.state) && (
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                      <MapPin size={14} color="#64748b" />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {[company.city, company.state].filter(Boolean).join(' - ')}
                      </Typography>
                    </Stack>
                  )}

                  <Box sx={{ pt: 1.5, mt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Edit size={16} />}
                      onClick={() => handleOpenDialog(company)}
                      disabled={!canManageCompanies}
                      sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                    >
                      Editar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {viewMode === 'list' && (
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
                  <TableCell>EMPRESA</TableCell>
                  <TableCell>CNPJ</TableCell>
                  <TableCell>TELEFONE</TableCell>
                  <TableCell>ENDEREÇO</TableCell>
                  <TableCell>CIDADE/UF</TableCell>
                  <TableCell align="right">AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {company.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {formatCnpj(company.document)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {formatPhone(company.phone)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {company.address
                          ? `${company.address}${company.address_number ? `, ${company.address_number}` : ''}`
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {[company.city, company.state].filter(Boolean).join(' - ') || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar empresa">
                        <IconButton size="small" onClick={() => handleOpenDialog(company)} disabled={!canManageCompanies}>
                          <Edit size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCompanies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma empresa encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dialog de Edi\u00E7\u00E3o */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form noValidate onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontSize: '1.05rem', fontWeight: 700 }}>
            Editar Empresa
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Campos somente leitura */}
              <TextField
                fullWidth
                size="small"
                label="Nome da Empresa"
                value={selectedCompany?.name || ''}
                disabled
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="CNPJ"
                value={formatCnpj(selectedCompany?.document)}
                disabled
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                size="small"
                label="Telefone"
                value={formData.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                  if (digits.length > 7 && digits.length <= 10) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
                  if (digits.length > 10) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                  setFormData((prev) => ({ ...prev, phone: formatted }));
                }}
                placeholder="(99) 99999-9999"
                inputProps={{ maxLength: 15 }}
                disabled={submitting}
              />
              </Box>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1, mb: -1, color: 'text.secondary' }}>
                Endereço
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Logradouro"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  disabled={submitting}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Número"
                  value={formData.address_number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address_number: e.target.value }))}
                  disabled={submitting}
                  sx={{ flex: 0.3 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Complemento"
                  value={formData.complement}
                  onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
                  disabled={submitting}
                  sx={{ flex: 0.3 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="CEP"
                  value={formData.postal_code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postal_code: formatPostalCode(e.target.value) }))}
                  placeholder="00000-000"
                  disabled={submitting}
                  sx={{ flex: 0.5 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Bairro"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                  disabled={submitting}
                  sx={{ flex: 1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  disabled={submitting}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="UF"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                  disabled={submitting}
                  sx={{ flex: 0.3 }}
                />
              </Box>
              {success && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  {success}
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !canManageCompanies}
              sx={{
                bgcolor: 'primary.main',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
              }}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
