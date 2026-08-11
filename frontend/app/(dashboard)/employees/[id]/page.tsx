'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Employee } from '@/lib/api';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  Edit,
  FileText,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  AlertCircle,
  UserMinus,
  User,
} from 'lucide-react';

/* ---- helpers ---- */

function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
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

function getStatusLabel(status?: Employee['status']) {
  if (status === 'ACTIVE') return 'Ativo';
  if (status === 'ON_LEAVE') return 'Afastado';
  if (status === 'INACTIVE') return 'Inativo';
  if (status === 'TERMINATED') return 'Desligado';
  return status || '-';
}

function getStatusStyle(status?: Employee['status']) {
  if (status === 'ACTIVE') return { bgcolor: '#dcfce7', color: '#166534' };
  if (status === 'ON_LEAVE') return { bgcolor: '#fef9c3', color: '#854d0e' };
  if (status === 'INACTIVE') return { bgcolor: '#e2e8f0', color: '#334155' };
  return { bgcolor: '#fee2e2', color: '#991b1b' };
}

function getEmployeeTypeLabel(type?: string) {
  if (type === 'FULL_TIME') return 'Tempo Integral';
  if (type === 'PART_TIME') return 'Meio Período';
  if (type === 'CONTRACTOR') return 'Prestador (PJ)';
  if (type === 'INTERN') return 'Estagiário';
  return type || '-';
}

function getGenderLabel(g?: string) {
  if (g === 'MALE') return 'Masculino';
  if (g === 'FEMALE') return 'Feminino';
  if (g === 'OTHER') return 'Outro';
  return g || '-';
}

function getMaritalStatusLabel(s?: string | null) {
  if (!s) return '-';
  const map: Record<string, string> = {
    SOLTEIRO: 'Solteiro(a)',
    CASADO: 'Casado(a)',
    DIVORCIADO: 'Divorciado(a)',
    VIUVO: 'Viúvo(a)',
    UNIAO_ESTAVEL: 'União Estável',
    SEPARADO: 'Separado(a)',
  };
  return map[s] || s;
}

function getEthnicityLabel(e?: string | null) {
  if (!e) return '-';
  const map: Record<string, string> = {
    BRANCA: 'Branca',
    PRETA: 'Preta',
    PARDA: 'Parda',
    AMARELA: 'Amarela',
    INDIGENA: 'Indígena',
    NAO_DECLARADA: 'Não declarada',
  };
  return map[e] || e;
}

function getEducationLevelLabel(l?: string | null) {
  if (!l) return '-';
  const map: Record<string, string> = {
    FUNDAMENTAL_INCOMPLETO: 'Fundamental Incompleto',
    FUNDAMENTAL_COMPLETO: 'Fundamental Completo',
    MEDIO_INCOMPLETO: 'Médio Incompleto',
    MEDIO_COMPLETO: 'Médio Completo',
    SUPERIOR_INCOMPLETO: 'Superior Incompleto',
    SUPERIOR_COMPLETO: 'Superior Completo',
    POS_GRADUACAO: 'Pós-Graduação',
    MESTRADO: 'Mestrado',
    DOUTORADO: 'Doutorado',
    PHD: 'PhD',
  };
  return map[l] || l;
}

function getLanguageProficiencyLabel(p?: string | null) {
  if (!p) return '-';
  const map: Record<string, string> = {
    BASICO: 'Básico',
    INTERMEDIARIO: 'Intermediário',
    AVANCADO: 'Avançado',
    FLUENTE: 'Fluente',
    NATIVO: 'Nativo',
  };
  return map[p] || p;
}

function calculateTenure(hireDate?: string | null) {
  if (!hireDate) return '-';
  const hire = new Date(hireDate);
  const today = new Date();
  let totalMonths = (today.getFullYear() - hire.getFullYear()) * 12 + (today.getMonth() - hire.getMonth());
  if (today.getDate() < hire.getDate()) totalMonths--;
  if (totalMonths < 0) totalMonths = 0;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years >= 1) {
    return months > 0 ? `${years} ano${years > 1 ? 's' : ''} e ${months} ${months > 1 ? 'meses' : 'mês'}` : `${years} ano${years > 1 ? 's' : ''}`;
  }
  return `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`;
}

function getContractTypeLabel(t?: string | null) {
  if (t === 'INDEFINITE') return 'Indeterminado';
  if (t === 'FIXED_TERM') return 'Prazo Determinado';
  if (t === 'APPRENTICE') return 'Aprendiz';
  if (t === 'TEMPORARY') return 'Temporário';
  return t || '-';
}

function getPaymentCategoryLabel(p?: string | null) {
  if (p === 'MONTHLY') return 'Mensal';
  if (p === 'HOURLY') return 'Por Hora';
  if (p === 'COMMISSION') return 'Comissão';
  return p || '-';
}

function fmtDate(d?: string | null) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return d;
  }
}

function fmtCurrency(amount?: number | string | null, currency?: string) {
  if (amount == null || amount === '') return '-';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '-';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: currency || 'BRL' });
}

/* ---- small contact row component ---- */
function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: '#F0F2F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color="#0A1E3D" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );
}

/* ---- data field component ---- */
function DataField({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

/* ---- section header ---- */
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: '#F0F2F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} color="#0A1E3D" />
      </Box>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
    </Box>
  );
}

/* ============================================================ */

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getEmployee(id);
        setEmployee(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar colaborador');
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleTermination = () => {
    // Funcionalidade de desligamento será implementada futuramente
  };

  /* derived data */
  const person = employee?.person;
  const contact = person?.personal_contact?.[0];
  const emergencyList = person?.emergency_contact || [];
  const family = person?.family_info;
  const department = employee?.employee_department?.[0]?.department?.name || '-';
  const position = employee?.employee_position?.[0]?.position?.name || '-';
  const contract = employee?.contract?.[0];
  const salary = contract?.salary?.[0];

  const employeeName = useMemo(() => person?.legal_name || 'Colaborador', [person]);

  /* ---- loading / error ---- */
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !employee) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Colaborador não encontrado'}
        </Alert>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => router.push('/employees')} sx={{ textTransform: 'none' }}>
          Voltar para lista
        </Button>
      </Box>
    );
  }

  /* ---- page ---- */
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => router.push('/employees')}
            sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#f8fafc' } }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Detalhes do Colaborador
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Edit size={18} />}
            onClick={() => router.push(`/employees/edit/${id}`)}
            sx={{
              bgcolor: 'primary.main',
              textTransform: 'none',
              px: 2.5,
              py: 1,
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
            }}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            startIcon={<UserMinus size={16} />}
            onClick={handleTermination}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderColor: '#f59e0b',
              color: '#f59e0b',
              '&:hover': { borderColor: '#d97706', color: '#d97706', bgcolor: '#fffbeb' },
            }}
          >
            Desligar
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ======= LEFT SIDEBAR CARD ======= */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
              textAlign: 'center',
            }}
          >
            <Avatar
              src={resolveImageUrl(person?.photo_url)}
              alt={employeeName}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                border: '4px solid #f1f5f9',
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
                fontWeight: 700,
              }}
            >
              {employeeName.charAt(0).toUpperCase()}
            </Avatar>

            <Typography variant="h5" fontWeight={700} gutterBottom>
              {employeeName}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {position}
            </Typography>
            <Chip
              label={getStatusLabel(employee.status)}
              sx={{ fontWeight: 600, mb: 3, ...getStatusStyle(employee.status) }}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'left' }}>
              <ContactRow icon={Mail} label="E-mail corporativo" value={contact?.email} />
              <ContactRow icon={Phone} label="Telefone pessoal" value={formatPhone(contact?.phone)} />
              <ContactRow icon={Building} label="Departamento" value={department} />
              <ContactRow
                icon={MapPin}
                label="Endereço"
                value={
                  contact?.address
                    ? `${contact.address}${contact.address_number ? ', ' + contact.address_number : ''}${contact.city ? ' - ' + contact.city : ''}${contact.state ? '/' + contact.state : ''}`
                    : undefined
                }
              />
              <ContactRow icon={Calendar} label="Admissão" value={fmtDate(employee.hire_date)} />
              <ContactRow icon={Calendar} label="Tempo de Empresa" value={calculateTenure(employee.hire_date)} />
            </Box>
          </Paper>
        </Grid>

        {/* ======= RIGHT CONTENT CARDS ======= */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>

            {/* ── Dados Pessoais ── */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <SectionHeader icon={User} title="Dados Pessoais" />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DataField label="Nome Completo" value={person?.legal_name} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <DataField label="CPF" value={person?.government_id} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DataField
                      label="Data de Nascimento"
                      value={
                        person?.date_of_birth
                          ? `${fmtDate(person.date_of_birth)} (${(() => {
                              const birth = new Date(person.date_of_birth!);
                              const today = new Date();
                              let age = today.getFullYear() - birth.getFullYear();
                              const m = today.getMonth() - birth.getMonth();
                              if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                              return `${age} anos`;
                            })()})`
                          : '-'
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <DataField label="Gênero" value={getGenderLabel(person?.gender ?? undefined)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <DataField label="Etnia" value={getEthnicityLabel((person as any)?.ethnicity)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Nacionalidade" value={person?.nationality} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <DataField label="Estado Civil" value={getMaritalStatusLabel(person?.marital_status)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DataField label="Nome da Mãe" value={(person as any)?.mother_name} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="PIS" value={(person as any)?.pis} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <DataField label="Escolaridade" value={getEducationLevelLabel((person as any)?.education_level)} />
                  </Grid>
                </Grid>

                {/* RG */}
                {(person?.passport || person?.rg_issuer || person?.rg_state || person?.rg_issue_date) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#475569' }}>RG</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <DataField label="Número do RG" value={person?.passport} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <DataField label="Órgão Emissor" value={person?.rg_issuer} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <DataField label="UF" value={person?.rg_state} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <DataField label="Data de Emissão" value={fmtDate(person?.rg_issue_date)} />
                      </Grid>
                    </Grid>
                  </>
                )}

                {/* CNH */}
                {(person?.ssn || person?.cnh_category || person?.cnh_issuer || person?.cnh_state) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#475569' }}>CNH</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <DataField label="Número da CNH" value={person?.ssn} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <DataField label="Categoria" value={person?.cnh_category} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <DataField label="Data Emissão" value={fmtDate(person?.cnh_issue_date)} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <DataField label="Data Validade" value={fmtDate(person?.cnh_expiry_date)} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <DataField label="Órgão Emissor" value={person?.cnh_issuer} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <DataField label="UF" value={person?.cnh_state} />
                      </Grid>
                    </Grid>
                  </>
                )}
              </Paper>
            </Grid>

            {/* ── Informações de Contato ── */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <SectionHeader icon={Phone} title="Informações de Contato" />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DataField label="E-mail Corporativo" value={contact?.email} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DataField label="E-mail Pessoal" value={contact?.personal_email} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DataField label="Telefone Pessoal" value={formatPhone(contact?.phone)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DataField label="Telefone Corporativo" value={formatPhone(contact?.corporate_phone)} />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#475569' }}>Endereço</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <DataField label="Logradouro" value={contact?.address} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <DataField label="Número" value={contact?.address_number} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Complemento" value={(contact as any)?.address_complement} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Bairro" value={(contact as any)?.neighborhood} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <DataField label="CEP" value={contact?.postal_code} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 1 }}>
                    <DataField label="UF" value={contact?.state} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <DataField label="País" value={contact?.country} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DataField label="Cidade" value={contact?.city} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* ── Contato de Emergência ── */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <SectionHeader icon={AlertCircle} title="Contato de Emergência" />
                {emergencyList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nenhum contato de emergência cadastrado.</Typography>
                ) : (
                  emergencyList.map((ec: any, idx: number) => (
                    <Box key={ec.id || idx}>
                      {idx > 0 && <Divider sx={{ my: 2 }} />}
                      {emergencyList.length > 1 && (
                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                          Contato {idx + 1}
                        </Typography>
                      )}
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <DataField label="Nome Completo" value={ec.name} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <DataField label="Parentesco" value={ec.relationship} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <DataField label="Telefone" value={formatPhone(ec.phone)} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2.5 }}>
                          <DataField label="Tel. Secundário" value={formatPhone(ec.phone_secondary)} />
                        </Grid>
                      </Grid>
                    </Box>
                  ))
                )}
              </Paper>
            </Grid>

            {/* ── Dados Profissionais ── */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <SectionHeader icon={Briefcase} title="Dados Profissionais" />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Matrícula" value={employee.employee_number} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Data de Admissão" value={fmtDate(employee.hire_date)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Tempo de Empresa" value={calculateTenure(employee.hire_date)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <DataField label="Cargo" value={position} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <DataField label="Departamento" value={department} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Tipo de Vínculo" value={getEmployeeTypeLabel(employee.employee_type)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Status" value={getStatusLabel(employee.status)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Desligamento" value={fmtDate(employee.termination_date)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Motivo Desligamento" value={employee.termination_reason} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* ── Idiomas & Habilidades ── */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <SectionHeader icon={Briefcase} title="Idiomas & Habilidades" />

                {/* Idiomas */}
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#475569' }}>Idiomas</Typography>
                {((employee as any)?.employee_language || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Nenhum idioma cadastrado.</Typography>
                ) : (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {((employee as any).employee_language || []).map((el: any, idx: number) => (
                      <Grid key={el.id || idx} size={{ xs: 12, sm: 4 }}>
                        <DataField
                          label={el.language?.name || `Idioma ${idx + 1}`}
                          value={getLanguageProficiencyLabel(el.proficiency_level)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Habilidades */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#475569' }}>Habilidades</Typography>
                {((employee as any)?.employee_skill || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nenhuma habilidade cadastrada.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {((employee as any).employee_skill || []).map((es: any, idx: number) => (
                      <Grid key={es.id || idx} size={{ xs: 12, sm: 4 }}>
                        <DataField
                          label={es.skill?.name || `Habilidade ${idx + 1}`}
                          value={`Nível ${es.proficiency_level || '-'}/5`}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>

            {/* ── Contrato & Salário ── */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <SectionHeader icon={FileText} title="Financeiro" />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Centro de Custo" value={(employee as any)?.cost_center?.name} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Tipo de Contrato" value={getContractTypeLabel(contract?.contract_type)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Início Contrato" value={fmtDate(contract?.start_date)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Fim Contrato" value={fmtDate(contract?.end_date)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Horas Semanais" value={contract?.work_hours ? `${contract.work_hours}h` : '-'} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField label="Salário" value={fmtCurrency(salary?.amount, salary?.currency ?? undefined)} />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* ── Informações Familiares ── */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <SectionHeader icon={Heart} title="Informações Familiares" />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <DataField label="Nome do Cônjuge" value={family?.spouse_name} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DataField label="Nascimento Cônjuge" value={fmtDate(family?.spouse_birthday)} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <DataField
                      label="Dependentes"
                      value={family?.number_of_dependents != null ? String(family.number_of_dependents) : '-'}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* ── Saúde e Restrições ── */}
            {((person as any)?.has_food_intolerance || (person as any)?.has_medication_allergy) && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <SectionHeader icon={Heart} title="Saúde e Restrições" />
                  <Grid container spacing={2}>
                    {(person as any)?.has_food_intolerance && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DataField label="Intolerância/Restrição Alimentar" value={(person as any)?.food_intolerance || 'Sim'} />
                      </Grid>
                    )}
                    {(person as any)?.has_medication_allergy && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DataField label="Alergia a Medicamentos" value={(person as any)?.medication_allergy || 'Sim'} />
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* ── Observação ── */}
            {(employee as any)?.observation && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <SectionHeader icon={MessageSquare} title="Observação" />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {(employee as any).observation}
                  </Typography>
                </Paper>
              </Grid>
            )}

          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
