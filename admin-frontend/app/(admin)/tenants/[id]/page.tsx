'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from '@mui/material';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Pause,
  Power,
  Plus,
  Building2,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Building,
  Hash,
} from 'lucide-react';
import { adminApi, Tenant, Payment, AdminNote, AddCompanyData, AddCompanyResult, Plan } from '@/lib/admin-api';

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  TRIAL: { bg: '#fef3c7', text: '#d97706', label: 'Em Trial' },
  ACTIVE: { bg: '#dcfce7', text: '#16a34a', label: 'Ativo' },
  SUSPENDED: { bg: '#fee2e2', text: '#dc2626', label: 'Suspenso' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280', label: 'Cancelado' },
  INACTIVE: { bg: '#f3f4f6', text: '#9ca3af', label: 'Inativo' },
};

const planLabels: Record<string, string> = {
  STARTER: 'Starter', PROFESSIONAL: 'Profissional', ENTERPRISE: 'Empresarial', CUSTOM: 'Personalizado',
};

const paymentStatusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#d97706' },
  PAID: { bg: '#dcfce7', text: '#16a34a' },
  FAILED: { bg: '#fee2e2', text: '#dc2626' },
  REFUNDED: { bg: '#e0e7ff', text: '#4f46e5' },
  CANCELLED: { bg: '#f3f4f6', text: '#6b7280' },
};

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyResult, setCompanyResult] = useState<AddCompanyResult | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showAssignPlan, setShowAssignPlan] = useState(false);

  const load = async () => {
    try {
      const [data, plansData] = await Promise.all([
        adminApi.getTenant(id),
        adminApi.getPlans(true),
      ]);
      setTenant(data);
      setPlans(plansData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Alterar status para ${newStatus}?`)) return;
    try {
      await adminApi.updateTenantStatus(id, newStatus);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await adminApi.addTenantNote(id, noteText);
      setNoteText('');
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkPaid = async (paymentId: string) => {
    try {
      await adminApi.markPaymentPaid(paymentId);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tenant) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        Tenant não encontrado
      </Alert>
    );
  }

  const sc = statusColors[tenant.status] || statusColors.INACTIVE;
  const sub = tenant.subscription;

  const address = [tenant.address, tenant.address_number, tenant.complement, tenant.neighborhood].filter(Boolean).join(', ');
  const cityState = [tenant.city, tenant.state].filter(Boolean).join(' - ');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => router.push('/tenants')}
            size="small"
            sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.1rem', fontWeight: 700 }}>
            {tenant.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" fontWeight={700}>
                {tenant.name}
              </Typography>
              <Chip label={sc.label} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600, bgcolor: sc.bg, color: sc.text }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
              {tenant.slug} {tenant.trade_name ? `· ${tenant.trade_name}` : ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {tenant.status !== 'ACTIVE' && (
            <Button variant="outlined" size="small" startIcon={<CheckCircle size={14} />}
              onClick={() => handleStatusChange('ACTIVE')}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#16a34a', color: '#16a34a', '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' } }}>
              Ativar
            </Button>
          )}
          {tenant.status !== 'SUSPENDED' && tenant.status !== 'CANCELLED' && (
            <Button variant="outlined" size="small" startIcon={<Pause size={14} />}
              onClick={() => handleStatusChange('SUSPENDED')}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#d97706', color: '#d97706', '&:hover': { bgcolor: '#fffbeb', borderColor: '#d97706' } }}>
              Suspender
            </Button>
          )}
          {tenant.status !== 'CANCELLED' && (
            <Button variant="outlined" size="small" startIcon={<XCircle size={14} />}
              onClick={() => handleStatusChange('CANCELLED')}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#dc2626', color: '#dc2626', '&:hover': { bgcolor: '#fef2f2', borderColor: '#dc2626' } }}>
              Cancelar
            </Button>
          )}
          {tenant.status !== 'INACTIVE' && (
            <Button variant="outlined" size="small" startIcon={<Power size={14} />}
              onClick={() => handleStatusChange('INACTIVE')}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', borderColor: '#6b7280', color: '#6b7280', '&:hover': { bgcolor: '#f9fafb', borderColor: '#6b7280' } }}>
              Desativar
            </Button>
          )}
        </Box>
      </Box>

      {/* Info Cards Row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Client Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, fontSize: '0.82rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dados do Cliente
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {tenant.document && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Hash size={14} color="#94a3b8" />
                  <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{tenant.document}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mail size={14} color="#94a3b8" />
                <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{tenant.email}</Typography>
              </Box>
              {tenant.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone size={14} color="#94a3b8" />
                  <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{tenant.phone}</Typography>
                </Box>
              )}
              {(address || cityState) && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <MapPin size={14} color="#94a3b8" style={{ marginTop: 2 }} />
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                    {address}{address && cityState ? ' — ' : ''}{cityState}
                    {tenant.postal_code ? ` · ${tenant.postal_code}` : ''}
                  </Typography>
                </Box>
              )}
              {tenant.database_name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Building2 size={14} color="#94a3b8" />
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', color: 'text.secondary', fontFamily: 'monospace' }}>{tenant.database_name}</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Subscription / Plan */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.82rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Plano & Assinatura
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CreditCard size={14} />}
                onClick={() => setShowAssignPlan(true)}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', py: 0.25, borderColor: '#D4A84B', color: '#D4A84B', '&:hover': { bgcolor: '#fffdf5', borderColor: '#D4A84B' } }}
              >
                Atribuir Plano
              </Button>
            </Box>
            {sub ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CreditCard size={14} color="#D4A84B" />
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                    {sub.plan}
                  </Typography>
                  <Chip label={sub.status} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, bgcolor: sub.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7', color: sub.status === 'ACTIVE' ? '#16a34a' : '#d97706' }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  R$ {Number(sub.price_monthly).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês · {sub.billing_cycle}
                </Typography>
                {sub.current_period_end && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Próx. vencimento: {new Date(sub.current_period_end).toLocaleDateString('pt-BR')}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                Nenhum plano atribuído
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Dates */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, fontSize: '0.82rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Datas
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <InfoRow icon={<Calendar size={14} color="#94a3b8" />} label="Criado em" value={new Date(tenant.created_at).toLocaleDateString('pt-BR')} />
              {tenant.activated_at && <InfoRow icon={<CheckCircle size={14} color="#16a34a" />} label="Ativado em" value={new Date(tenant.activated_at).toLocaleDateString('pt-BR')} />}
              {tenant.trial_ends_at && <InfoRow icon={<Calendar size={14} color="#d97706" />} label="Trial até" value={new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR')} />}
              {tenant.suspended_at && <InfoRow icon={<Pause size={14} color="#dc2626" />} label="Suspenso em" value={new Date(tenant.suspended_at).toLocaleDateString('pt-BR')} />}
              {tenant.cancelled_at && <InfoRow icon={<XCircle size={14} color="#6b7280" />} label="Cancelado em" value={new Date(tenant.cancelled_at).toLocaleDateString('pt-BR')} />}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Companies & Payments */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Companies */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 2 }}>
            {companyResult && (
              <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2, fontSize: '0.8rem' }} onClose={() => setCompanyResult(null)}>
                {companyResult.message}
                {companyResult.isNewUser && (
                  <><br /><strong>Login:</strong> {companyResult.adminEmail} | <strong>Senha:</strong> {companyResult.defaultPassword}</>
                )}
              </Alert>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.82rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Empresas ({tenant.companies?.length || 0})
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={14} />}
                onClick={() => setShowAddCompany(true)}
                sx={{ bgcolor: 'primary.main', textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', boxShadow: 'none', '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' } }}
              >
                Adicionar
              </Button>
            </Box>
            {!tenant.companies?.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>Nenhuma empresa cadastrada</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>NOME</TableCell>
                      <TableCell>CNPJ</TableCell>
                      <TableCell>MATRIZ</TableCell>
                      <TableCell>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenant.companies.map((c) => (
                      <TableRow key={c.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell sx={{ py: 1, fontSize: '0.8rem' }}>{c.company_name}</TableCell>
                        <TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#64748b' }}>{c.company_document || '—'}</TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Chip label={c.is_headquarters ? 'Sim' : 'Não'} size="small"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: c.is_headquarters ? '#dcfce7' : '#f3f4f6', color: c.is_headquarters ? '#16a34a' : '#6b7280' }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#64748b' }}>{c.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Payments */}
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, fontSize: '0.82rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pagamentos Recentes
            </Typography>
            {!tenant.payments?.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>Nenhum pagamento</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>DESCRIÇÃO</TableCell>
                      <TableCell>VALOR</TableCell>
                      <TableCell>VENCIMENTO</TableCell>
                      <TableCell>STATUS</TableCell>
                      <TableCell>AÇÃO</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenant.payments.map((p) => {
                      const ps = paymentStatusColors[p.status] || paymentStatusColors.PENDING;
                      return (
                        <TableRow key={p.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ py: 1, fontSize: '0.8rem' }}>{p.description || '—'}</TableCell>
                          <TableCell sx={{ py: 1, fontSize: '0.8rem' }}>
                            R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell sx={{ py: 1, fontSize: '0.8rem', color: '#64748b' }}>
                            {p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : '—'}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip label={p.status} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: ps.bg, color: ps.text }} />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {p.status === 'PENDING' && (
                              <Button size="small" onClick={() => handleMarkPaid(p.id)}
                                sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, color: '#16a34a', p: 0, minWidth: 'auto', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                                Marcar Pago
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Notes */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, fontSize: '0.82rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                placeholder="Adicionar nota..."
                size="small"
                fullWidth
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                InputProps={{ sx: { fontSize: '0.8rem' } }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleAddNote}
                sx={{ minWidth: 40, bgcolor: 'primary.main', boxShadow: 'none', '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' } }}
              >
                <Plus size={16} />
              </Button>
            </Box>
            {!tenant.admin_notes?.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Nenhuma nota</Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {tenant.admin_notes.map((note) => (
                  <Box key={note.id} sx={{ py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{note.content}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                      {note.author} — {new Date(note.created_at).toLocaleString('pt-BR')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Company Modal */}
      {showAddCompany && tenant && (
        <AddCompanyModal
          tenantId={tenant.id}
          tenantEmail={tenant.email}
          onClose={() => setShowAddCompany(false)}
          onCreated={(result) => { setShowAddCompany(false); setCompanyResult(result); load(); }}
        />
      )}

      {/* Assign Plan Modal */}
      {showAssignPlan && tenant && (
        <AssignPlanModal
          tenant={tenant}
          plans={plans}
          onClose={() => setShowAssignPlan(false)}
          onAssigned={() => { setShowAssignPlan(false); load(); }}
        />
      )}
    </Box>
  );
}

// ─── Add Company Modal ───

function AddCompanyModal({
  tenantId,
  tenantEmail,
  onClose,
  onCreated,
}: {
  tenantId: string;
  tenantEmail: string;
  onClose: () => void;
  onCreated: (result: AddCompanyResult) => void;
}) {
  const [form, setForm] = useState<AddCompanyData>({
    name: '',
    document: '',
    admin_email: tenantEmail,
    phone: '',
    address: '',
    address_number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'BR',
    is_headquarters: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await adminApi.addCompanyToTenant(tenantId, form);
      onCreated(result);
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar empresa');
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
      PaperProps={{ sx: { borderRadius: 3, border: '1px solid #e2e8f0' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Building2 size={20} />
        Adicionar Empresa
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" id="add-company-form" onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Nome da Empresa *"
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
                label="CNPJ"
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
                label="E-mail Admin *"
                size="small"
                fullWidth
                type="email"
                value={form.admin_email}
                onChange={(e) => setField('admin_email', e.target.value)}
                placeholder="admin@empresa.com"
                required
                helperText="Usuário admin que terá acesso a esta empresa"
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
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={form.is_headquarters || false}
                    onChange={(e) => setField('is_headquarters', e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.85rem' }}>
                    Esta é a empresa matriz
                  </Typography>
                }
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
                placeholder="Sala 1"
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
          form="add-company-form"
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: '#0A1E3D',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#132d54', boxShadow: 'none' },
            '&:disabled': { bgcolor: '#0A1E3D80' },
          }}
        >
          {loading ? 'Criando...' : 'Adicionar Empresa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Helper Components ───

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', minWidth: 90 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{value}</Typography>
    </Box>
  );
}

// ─── Assign Plan Modal ───

function AssignPlanModal({
  tenant,
  plans,
  onClose,
  onAssigned,
}: {
  tenant: Tenant;
  plans: Plan[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [trialEndDate, setTrialEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const isTrial = selectedPlan?.is_trial ?? false;

  const handleAssign = async () => {
    if (!selectedPlan) return;
    if (isTrial && !trialEndDate) {
      setError('Informe a data de vigência do trial');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await adminApi.updateTenant(tenant.id, {
        max_employees: selectedPlan.max_employees,
        max_users: selectedPlan.max_users,
        ...(isTrial ? { trial_ends_at: new Date(trialEndDate).toISOString(), status: 'TRIAL' as any } : {}),
      } as any);

      const sub = tenant.subscription;
      if (sub) {
        await adminApi.updateSubscription(tenant.id, {
          plan: selectedPlan.name.toUpperCase() as any,
          price_monthly: Number(selectedPlan.price_monthly),
        });
      }
      onAssigned();
    } catch (err: any) {
      setError(err.message || 'Erro ao atribuir plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, border: '1px solid #e2e8f0' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CreditCard size={20} />
        Atribuir Plano
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
          Selecione um plano para <strong>{tenant.name}</strong>
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = tenant.subscription?.plan?.toUpperCase() === plan.name.toUpperCase();
            return (
              <Box
                key={plan.id}
                onClick={() => !isCurrent && setSelectedPlanId(plan.id)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: isSelected ? '2px solid #D4A84B' : isCurrent ? '2px solid #e2e8f0' : '1px solid #e2e8f0',
                  bgcolor: isSelected ? '#fffdf5' : isCurrent ? '#f8fafc' : '#fff',
                  cursor: isCurrent ? 'default' : 'pointer',
                  opacity: isCurrent ? 0.6 : 1,
                  transition: 'all 0.15s',
                  '&:hover': isCurrent ? {} : { borderColor: '#D4A84B', bgcolor: '#fffdf5' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCard size={16} color={isSelected ? '#D4A84B' : '#94a3b8'} />
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                      {plan.name}
                    </Typography>
                    {plan.is_trial && <Chip label="Trial" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#fef3c7', color: '#d97706' }} />}
                  </Box>
                  {isCurrent && <Chip label="Atual" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: '#e2e8f0', color: '#64748b' }} />}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                  {plan.max_employees} colab. · {plan.max_users} usr. · {plan.max_companies} emp. · R$ {Number(plan.price_monthly).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                </Typography>
              </Box>
            );
          })}
        </Box>

        {isTrial && selectedPlanId && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1, fontSize: '0.82rem' }}>
              Até qual data o trial ficará vigente?
            </Typography>
            <TextField
              type="date"
              size="small"
              fullWidth
              value={trialEndDate}
              onChange={(e) => setTrialEndDate(e.target.value)}
              InputProps={{ sx: { fontSize: '0.875rem' } }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={loading || !selectedPlanId}
          sx={{
            bgcolor: '#D4A84B',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#B8923D', boxShadow: 'none' },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Atribuir Plano'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
