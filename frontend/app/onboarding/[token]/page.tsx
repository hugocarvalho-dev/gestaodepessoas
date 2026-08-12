'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Divider,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CheckCircle2,
  FileText,
  Globe,
  Heart,
  Landmark,
  MapPin,
  Minus,
  Plus,
  ShieldAlert,
  Trash2,
  User,
  ClipboardList,
} from 'lucide-react';
import { getTenantSlug } from '@/lib/tenant';
import { LumeLogo } from '@/components/brand/LumeLogo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const FIELD_CONFIG: Record<string, { label: string; type?: string; options?: string[]; required?: boolean }> = {
  legal_name: { label: 'Nome completo' },
  government_id: { label: 'CPF' },
  pis: { label: 'PIS' },
  passport: { label: 'RG' },
  rg_issuer: { label: 'Órgão emissor' },
  rg_issue_date: { label: 'Data de expedição', type: 'date' },
  rg_state: {
    label: 'UF (RG)',
    options: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],
  },
  email: { label: 'E-mail corporativo', type: 'email' },
  personal_email: { label: 'Email pessoal', type: 'email' },
  phone: { label: 'Telefone pessoal' },
  corporate_phone: { label: 'Telefone corporativo' },
  date_of_birth: { label: 'Data de nascimento', type: 'date' },
  gender: { label: 'Gênero', options: ['MALE', 'FEMALE', 'OTHER'] },
  ethnicity: { label: 'Etnia', options: ['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADA'] },
  nationality: { label: 'Nacionalidade' },
  mother_name: { label: 'Nome da mãe' },
  father_name: { label: 'Nome do pai' },
  hire_date: { label: 'Data de admissão', type: 'date' },
  employee_type: { label: 'Tipo de vínculo' },
  marital_status: {
    label: 'Estado civil',
    options: ['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'UNIAO_ESTAVEL', 'VIUVO'],
  },
  ssn: { label: 'Número da CNH' },
  cnh_category: { label: 'Cat.', options: ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'] },
  cnh_issue_date: { label: 'Data emissão', type: 'date' },
  cnh_expiry_date: { label: 'Data validade', type: 'date' },
  cnh_issuer: { label: 'Órgão emissor' },
  cnh_state: {
    label: 'UF (CNH)',
    options: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'],
  },
  spouse_name: { label: 'Nome do cônjuge' },
  number_of_dependents: { label: 'Dependentes', type: 'number' },
  contract_type: { label: 'Tipo de contrato' },
  work_hours: { label: 'Carga horária' },
  salary: { label: 'Salário', type: 'number' },
  cost_center: { label: 'Centro de custo' },
  bank_name: { label: 'Banco' },
  bank_agency: { label: 'Agência' },
  bank_account: { label: 'Conta' },
  pix_key: { label: 'Chave PIX' },
  address: { label: 'Logradouro' },
  address_number: { label: 'Número' },
  address_complement: { label: 'Complemento' },
  neighborhood: { label: 'Bairro' },
  city: { label: 'Cidade' },
  state: { label: 'Estado' },
  postal_code: { label: 'CEP' },
  country: { label: 'País' },
  food_intolerance: { label: 'Restrição alimentar' },
  medication_allergy: { label: 'Alergia a medicamento' },
  observation: { label: 'Observações' },
  education_level: {
    label: 'Escolaridade',
    options: [
      'FUNDAMENTAL_INCOMPLETO',
      'FUNDAMENTAL_COMPLETO',
      'MEDIO_INCOMPLETO',
      'MEDIO_COMPLETO',
      'SUPERIOR_INCOMPLETO',
      'SUPERIOR_COMPLETO',
      'POS_GRADUACAO',
      'MESTRADO',
      'DOUTORADO',
      'PHD',
    ],
  },
};

const STEP_LABELS = [
  'Dados Pessoais',
  'Informações de Contato',
  'Família',
  'Idiomas',
  'Dados Bancários',
  'Saúde e Restrições',
  'Documentos',
  'Informações Adicionais',
  'Revisão & Envio',
];

const STEP_HELPERS = [
  'Confirme identidade e informações de admissão.',
  'Preencha contatos pessoais, endereço e emergência.',
  'Informações familiares para documentação interna.',
  'Informe os idiomas do colaborador.',
  'Conta bancária para folha e reembolsos.',
  'Informe alergias e restrições de saúde.',
  'Documentos comprobatórios do cadastro.',
  'Detalhes finais para análise do RH.',
  'Revisão final e aceite de tratamento de dados.',
];

const STEP_ICONS = [
  User,
  MapPin,
  Heart,
  Globe,
  Landmark,
  ShieldAlert,
  FileText,
  ClipboardList,
  CheckCircle2,
];

const TOTAL_STEPS = STEP_LABELS.length;
const REVIEW_STEP = TOTAL_STEPS - 1;

interface LanguageOption {
  id: string;
  name: string;
}

type ListApiResponse<T> = T[] | { data?: T[] } | null | undefined;

function listFromResponse<T>(response: ListApiResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

interface LanguageEntry {
  languageId: string;
  proficiencyLevel: string;
}

const EMPTY_LANGUAGE: LanguageEntry = { languageId: '', proficiencyLevel: '' };

const STORAGE_VERSION = 1;

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCPF(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getDraftStorageKey(token: string, tenant: string | null) {
  return `onboarding:draft:v${STORAGE_VERSION}:${tenant || 'global'}:${token}`;
}

export default function PublicOnboardingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const tenantFromQuery = searchParams.get('tenant') || getTenantSlug();
  const storageKey = useMemo(() => getDraftStorageKey(token, tenantFromQuery), [tenantFromQuery, token]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formMeta, setFormMeta] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errorType, setErrorType] = useState<'expired' | 'not_found' | 'cancelled' | 'generic' | null>(null);
  const [step, setStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ name: string; relationship: string; phone: string }>>([{ name: '', relationship: '', phone: '' }]);
  const [educationItems, setEducationItems] = useState<Array<{ education_level: string; institution: string; field_of_study: string }>>([{ education_level: '', institution: '', field_of_study: '' }]);
  const [experienceItems, setExperienceItems] = useState<string[]>(['']);
  const [documents, setDocuments] = useState<string[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([{ ...EMPTY_LANGUAGE }]);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydratedDraft, setHydratedDraft] = useState(false);

  const requiredFields = useMemo(() => {
    return Array.isArray(formMeta?.required_fields) ? formMeta.required_fields : [];
  }, [formMeta]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const tenant = tenantFromQuery;
        const tenantQuery = tenant ? `?tenant=${encodeURIComponent(tenant)}` : '';
        const response = await fetch(`${API_BASE_URL}/onboarding/public/${token}${tenantQuery}`, {
          headers: tenant ? { 'x-tenant-slug': tenant } : undefined,
        });
        const data = await response.json();
        if (!response.ok) {
          const message = data?.message || 'Não foi possível carregar o formulário';
          const normalized = String(message).toLowerCase();
          if (normalized.includes('expirou')) setErrorType('expired');
          else if (normalized.includes('não encontrado')) setErrorType('not_found');
          else if (normalized.includes('cancelado')) setErrorType('cancelled');
          else setErrorType('generic');
          throw new Error(message);
        }

        setFormMeta(data);
        // A API sempre devolve submitted_data como objeto (com os campos
        // definidos pelo RH), entao os valores vindos do convite entram como
        // base e sao complementados por ele — nunca como alternativa.
        const submitted = (data.submitted_data || {}) as Record<string, any>;
        const isBlank = (value: any) => value === undefined || value === null || String(value).trim() === '';
        const baseFormData: Record<string, any> = {
          legal_name: data.invite_name || '',
          email: data.invite_email || '',
          employee_type: data.employee_type_value || '',
          country: 'Brasil',
        };

        for (const [key, value] of Object.entries(submitted)) {
          if (!isBlank(value) || isBlank(baseFormData[key])) baseFormData[key] = value;
        }

        setFormData(baseFormData);
        setErrorType(null);

        try {
          const draftRaw = localStorage.getItem(storageKey);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (draft?.version === STORAGE_VERSION) {
              const draftData = (draft.formData || {}) as Record<string, any>;
              const restored: Record<string, any> = { ...baseFormData };
              for (const [key, value] of Object.entries(draftData)) {
                if (!isBlank(value) || isBlank(restored[key])) restored[key] = value;
              }
              setFormData(restored);
              setEmergencyContacts(draft.emergencyContacts?.length ? draft.emergencyContacts : [{ name: '', relationship: '', phone: '' }]);
              setEducationItems(
                draft.educationItems?.length
                  ? draft.educationItems
                  : [{ education_level: '', institution: '', field_of_study: '' }],
              );
              setExperienceItems(draft.experienceItems?.length ? draft.experienceItems : ['']);
              setDocuments(Array.isArray(draft.documents) ? draft.documents : []);
              setLanguages(draft.languages?.length ? draft.languages : [{ ...EMPTY_LANGUAGE }]);
              setLgpdAccepted(!!draft.lgpdAccepted);
              setStep(Number.isInteger(draft.step) ? Math.max(0, Math.min(REVIEW_STEP, draft.step)) : 0);
              setSavedAt(typeof draft.savedAt === 'string' ? draft.savedAt : null);
            }
          }
        } catch {
          // Ignore corrupted local draft.
        }

        try {
          const catalogHeaders = tenant ? { 'x-tenant-slug': tenant } : undefined;
          const langRes = await fetch(`${API_BASE_URL}/onboarding/public/${token}/languages${tenantQuery}`, {
            headers: catalogHeaders,
          });

          if (langRes.ok) {
            const langData = await langRes.json();
            const parsed = listFromResponse<LanguageOption>(langData);
            setAvailableLanguages(parsed);
          }
        } catch {
          // Ignore catalog loading failures.
        }

        setHydratedDraft(true);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar formulário');
      } finally {
        setLoading(false);
      }
    };

    if (token) load();
  }, [token, searchParams, storageKey, tenantFromQuery]);

  useEffect(() => {
    if (!hydratedDraft || !formMeta || !!success) return;

    const timeout = setTimeout(() => {
      try {
        const savedAtIso = new Date().toISOString();
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            version: STORAGE_VERSION,
            step,
            formData,
            emergencyContacts,
            educationItems,
            experienceItems,
            documents,
            languages,
            lgpdAccepted,
            savedAt: savedAtIso,
          }),
        );
        setSavedAt(savedAtIso);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [hydratedDraft, formMeta, success, storageKey, step, formData, emergencyContacts, educationItems, experienceItems, documents, languages, lgpdAccepted]);

  const setLanguageField = (index: number, field: keyof LanguageEntry, value: string) => {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLanguage = () => {
    setLanguages((prev) => [...prev, { ...EMPTY_LANGUAGE }]);
  };

  const removeLanguage = (index: number) => {
    setLanguages((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const validateStep = (targetStep: number) => {
    const errors: Record<string, string> = {};

    if (targetStep === 0) {
      if (!formData.legal_name || String(formData.legal_name).trim().split(/\s+/).length < 2) {
        errors.legal_name = 'Informe nome completo (nome e sobrenome).';
      }
      if (onlyDigits(String(formData.government_id || '')).length !== 11) {
        errors.government_id = 'CPF deve conter 11 dígitos.';
      }
      if (!formData.date_of_birth) errors.date_of_birth = 'Data de nascimento é obrigatória.';
      if (!formData.gender) errors.gender = 'Gênero é obrigatório.';
      if (!formData.nationality) errors.nationality = 'Nacionalidade é obrigatória.';
      if (!formData.employee_type && !formMeta?.employee_type_value) errors.employee_type = 'Tipo de vínculo é obrigatório.';
    }

    if (targetStep === 1) {
      if (!formData.personal_email || !String(formData.personal_email).includes('@')) errors.personal_email = 'Email pessoal válido é obrigatório.';
      if (!formData.phone) errors.phone = 'Telefone pessoal é obrigatório.';
      if (!formData.postal_code) errors.postal_code = 'CEP é obrigatório.';
      if (!formData.address) errors.address = 'Rua/Endereço é obrigatório.';
      if (!formData.address_number) errors.address_number = 'Número é obrigatório.';
      if (!formData.neighborhood) errors.neighborhood = 'Bairro é obrigatório.';
      if (!formData.city) errors.city = 'Cidade é obrigatória.';
      const validEmergency = emergencyContacts.some((c) => c.name.trim() && c.phone.trim());
      if (!validEmergency) errors.emergency = 'Informe pelo menos 1 contato de emergência.';
      if (!formData.state) errors.state = 'Estado é obrigatório.';
    }

    if (targetStep === 3) {
      const validLanguage = languages.some((l) => l.languageId && l.proficiencyLevel);
      if (!validLanguage) errors.languages = 'Informe pelo menos 1 idioma com fluência.';
    }

    if (targetStep === 7) {
      if (!formData.hire_date) errors.hire_date = 'Data de admissão é obrigatória.';
    }

    if (targetStep === REVIEW_STEP && !lgpdAccepted) {
      errors.lgpd = 'Você precisa aceitar os termos LGPD para enviar.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, REVIEW_STEP));
  };

  const handleBack = () => {
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const autoFillAddressByCep = async (cep: string) => {
    const clean = onlyDigits(cep);
    if (clean.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await response.json();
      if (data?.erro) return;
      setFormData((prev) => ({
        ...prev,
        address: data.logradouro || prev.address || '',
        neighborhood: data.bairro || prev.neighborhood || '',
        city: data.localidade || prev.city || '',
        state: data.uf || prev.state || '',
      }));
    } catch {
      // ignore network failures for CEP autofill
    }
  };

  const submit = async () => {
    try {
      if (!validateStep(REVIEW_STEP)) return;
      setSaving(true);
      setError(null);

      const payload = {
        ...formData,
        government_id: onlyDigits(String(formData.government_id || '')),
        phone: onlyDigits(String(formData.phone || '')),
        corporate_phone: onlyDigits(String(formData.corporate_phone || '')),
        emergency_contacts: emergencyContacts.filter((c) => c.name.trim() || c.phone.trim()),
        uploaded_documents: documents,
        languages: languages
          .filter((l) => l.languageId && l.proficiencyLevel)
          .map((l) => ({ language_id: l.languageId, proficiency_level: l.proficiencyLevel })),
        has_food_intolerance: !!formData.has_food_intolerance,
        has_medication_allergy: !!formData.has_medication_allergy,
        food_intolerance: formData.has_food_intolerance ? formData.food_intolerance || '' : '',
        medication_allergy: formData.has_medication_allergy ? formData.medication_allergy || '' : '',
        employee_type: formMeta?.employee_type_value || formData.employee_type || '',
      };

      const tenant = searchParams.get('tenant') || getTenantSlug();
      const tenantQuery = tenant ? `?tenant=${encodeURIComponent(tenant)}` : '';
      const response = await fetch(`${API_BASE_URL}/onboarding/public/${token}/submit${tenantQuery}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenant ? { 'x-tenant-slug': tenant } : {}),
        },
        body: JSON.stringify({ data: payload }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(data?.message) ? data.message.join(', ') : data?.message || 'Erro ao enviar formulário');
      }

      setSuccess('Formulário enviado com sucesso! O RH irá analisar seus dados.');
      localStorage.removeItem(storageKey);
      setSaveStatus('idle');
      setSavedAt(null);
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar formulário');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderStepTag = () => (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.65,
        mt: 2,
      }}
    >
      {STEP_LABELS.map((label, index) => {
        const Icon = STEP_ICONS[index];
        const active = index === step;
        const completed = index < step;
        return (
          <Chip
            key={label}
            onClick={() => {
              setFieldErrors({});
              setStep(index);
            }}
            icon={<Icon size={14} />}
            clickable
            size="small"
            label={`${index + 1}. ${label}`}
            variant={active ? 'filled' : 'outlined'}
            color={active ? 'primary' : completed ? 'success' : 'default'}
            sx={{
              borderRadius: 1.5,
              minHeight: 30,
              fontWeight: 600,
              fontSize: '0.7rem',
              '& .MuiChip-label': { px: 0.85 },
              borderColor: completed && !active ? 'success.main' : undefined,
              backgroundColor: active ? 'primary.main' : completed ? 'rgba(34,197,94,0.08)' : 'transparent',
            }}
          />
        );
      })}
    </Box>
  );

  const renderDraftStatus = () => {
    if (saveStatus === 'error') {
      return <Typography variant="caption" color="error.main">Nao foi possivel salvar rascunho local.</Typography>;
    }
    if (saveStatus === 'saved' && savedAt) {
      return (
        <Typography variant="caption" color="text.secondary">
          Rascunho salvo automaticamente em {new Date(savedAt).toLocaleTimeString('pt-BR')}.
        </Typography>
      );
    }
    return <Typography variant="caption" color="text.secondary">Salvamento automatico ativo no navegador.</Typography>;
  };

  const fieldSx = {
    '& .MuiInputBase-root': {
      borderRadius: 1.5,
    },
    '& .MuiInputBase-input': {
      py: 0.9,
      fontSize: '0.88rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.86rem',
    },
  };

  const educationLevelLabel = (value: string) => {
    const map: Record<string, string> = {
      FUNDAMENTAL_INCOMPLETO: 'Fundamental Incompleto',
      FUNDAMENTAL_COMPLETO: 'Fundamental Completo',
      MEDIO_INCOMPLETO: 'Médio Incompleto',
      MEDIO_COMPLETO: 'Médio Completo',
      SUPERIOR_INCOMPLETO: 'Superior Incompleto',
      SUPERIOR_COMPLETO: 'Superior Completo',
      POS_GRADUACAO: 'Pós-graduação',
      MESTRADO: 'Mestrado',
      DOUTORADO: 'Doutorado',
      PHD: 'PhD',
    };
    return map[value] || value;
  };

  const optionLabel = (field: string, value: string) => {
    if (field === 'education_level') return educationLevelLabel(value);

    if (field === 'gender') {
      const map: Record<string, string> = {
        MALE: 'Masculino',
        FEMALE: 'Feminino',
        OTHER: 'Outro',
      };
      return map[value] || value;
    }

    if (field === 'ethnicity') {
      const map: Record<string, string> = {
        BRANCA: 'Branca',
        PRETA: 'Preta',
        PARDA: 'Parda',
        AMARELA: 'Amarela',
        INDIGENA: 'Indígena',
        NAO_DECLARADA: 'Não declarada',
      };
      return map[value] || value;
    }

    if (field === 'marital_status') {
      const map: Record<string, string> = {
        SOLTEIRO: 'Solteiro(a)',
        CASADO: 'Casado(a)',
        DIVORCIADO: 'Divorciado(a)',
        UNIAO_ESTAVEL: 'União Estável',
        VIUVO: 'Viúvo(a)',
      };
      return map[value] || value;
    }

    return value;
  };

  const renderTextField = (field: string, extra?: Partial<React.ComponentProps<typeof TextField>>) => {
    const cfg = FIELD_CONFIG[field] || { label: field };
    const value = formData[field] || '';
    const hasError = !!fieldErrors[field];

    if (cfg.options?.length) {
      return (
        <TextField
          key={field}
          select
          size="small"
          fullWidth
          label={cfg.label}
          value={value}
          error={hasError}
          helperText={fieldErrors[field]}
          onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
          sx={fieldSx}
          {...extra}
        >
          <MenuItem value="">Selecione</MenuItem>
          {cfg.options.map((option) => (
            <MenuItem key={option} value={option}>{optionLabel(field, option)}</MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        key={field}
        size="small"
        fullWidth
        label={cfg.label}
        type={cfg.type || 'text'}
        value={value}
        error={hasError}
        helperText={fieldErrors[field]}
        onChange={(e) => {
          const raw = e.target.value;
          if (field === 'government_id') {
            setFormData((prev) => ({ ...prev, government_id: onlyDigits(raw).slice(0, 11) }));
            return;
          }
          if (field === 'phone' || field === 'corporate_phone') {
            setFormData((prev) => ({ ...prev, [field]: onlyDigits(raw).slice(0, 11) }));
            return;
          }
          if (field === 'postal_code') {
            const digits = onlyDigits(raw).slice(0, 8);
            setFormData((prev) => ({ ...prev, postal_code: digits }));
            if (digits.length === 8) autoFillAddressByCep(digits);
            return;
          }
          setFormData((prev) => ({ ...prev, [field]: raw }));
        }}
        InputLabelProps={cfg.type === 'date' ? { shrink: true } : undefined}
        sx={fieldSx}
        {...extra}
      />
    );
  };

  const progress = Math.round(((step + 1) / TOTAL_STEPS) * 100);

  const stepContent = () => {
    if (step === 0) {
      return (
        <Stack spacing={1.5}>
          <Paper sx={{ p: 1.35, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
              Identificação
            </Typography>
            <Grid container columnSpacing={1} rowSpacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>{renderTextField('legal_name', { value: formData.legal_name || '', onChange: (e) => setFormData((p) => ({ ...p, legal_name: e.target.value })) })}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('government_id', { value: formatCPF(formData.government_id || '') })}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('date_of_birth')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('gender')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('ethnicity')}</Grid>

              <Grid size={{ xs: 12, md: 2.9 }}>{renderTextField('mother_name')}</Grid>
              <Grid size={{ xs: 12, md: 2.9 }}>{renderTextField('father_name')}</Grid>
              <Grid size={{ xs: 12, md: 2.2 }}>{renderTextField('education_level')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('marital_status')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('nationality')}</Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
              Documento de Identidade (RG) e PIS
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 3 }}>{renderTextField('pis')}</Grid>
              <Grid size={{ xs: 12, md: 3 }}>{renderTextField('passport')}</Grid>
              <Grid size={{ xs: 12, md: 3 }}>{renderTextField('rg_issuer')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('rg_issue_date')}</Grid>
              <Grid size={{ xs: 12, md: 1 }}>{renderTextField('rg_state')}</Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
              Carteira Nacional de Habilitação (CNH)
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 4 }}>{renderTextField('ssn')}</Grid>
              <Grid size={{ xs: 12, md: 1 }}>{renderTextField('cnh_category')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('cnh_issue_date')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('cnh_expiry_date')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('cnh_issuer')}</Grid>
              <Grid size={{ xs: 12, md: 1 }}>{renderTextField('cnh_state')}</Grid>
            </Grid>
          </Paper>
        </Stack>
      );
    }

    if (step === 1) {
      return (
        <Stack spacing={1.1}>
          <Paper sx={{ p: 1.1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
              Contatos pessoais
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 3 }}>{renderTextField('personal_email')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('phone', { value: formatPhone(formData.phone || '') })}</Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 1.1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
              Endereço
            </Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 1.2 }}>{renderTextField('postal_code')}</Grid>
              <Grid size={{ xs: 12, md: 3 }}>{renderTextField('address')}</Grid>
              <Grid size={{ xs: 12, md: 1 }}>{renderTextField('address_number')}</Grid>
              <Grid size={{ xs: 12, md: 1.5 }}>{renderTextField('address_complement')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('neighborhood')}</Grid>
              <Grid size={{ xs: 12, md: 2 }}>{renderTextField('city')}</Grid>
              <Grid size={{ xs: 12, md: 1 }}>{renderTextField('state')}</Grid>
            </Grid>
          </Paper>
          <Paper sx={{ p: 1.1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, boxShadow: 'none' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 700 }}>
              Contatos de Emergência
            </Typography>
            {!!fieldErrors.emergency && <Alert severity="warning">{fieldErrors.emergency}</Alert>}
            {emergencyContacts.map((contact, index) => (
              <Grid key={index} container columnSpacing={1} rowSpacing={1} sx={{ mt: index === 0 ? 0.5 : 1.25 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField size="small" fullWidth label="Nome" value={contact.name} onChange={(e) => setEmergencyContacts((prev) => prev.map((c, i) => i === index ? { ...c, name: e.target.value } : c))} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField size="small" fullWidth label="Parentesco" value={contact.relationship} onChange={(e) => setEmergencyContacts((prev) => prev.map((c, i) => i === index ? { ...c, relationship: e.target.value } : c))} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField size="small" fullWidth label="Telefone" value={formatPhone(contact.phone)} onChange={(e) => setEmergencyContacts((prev) => prev.map((c, i) => i === index ? { ...c, phone: onlyDigits(e.target.value).slice(0, 11) } : c))} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField size="small" fullWidth label="Tel. Secundário" value={formatPhone(contact.phone)} onChange={(e) => setEmergencyContacts((prev) => prev.map((c, i) => i === index ? { ...c, phone: onlyDigits(e.target.value).slice(0, 11) } : c))} sx={fieldSx} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack direction="row" spacing={0.75} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Plus size={14} />}
                      onClick={() => setEmergencyContacts((prev) => [...prev, { name: '', relationship: '', phone: '' }])}
                      sx={{ textTransform: 'none', minWidth: 96 }}
                    >
                      Adicionar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Minus size={14} />}
                      onClick={() => setEmergencyContacts((prev) => prev.length > 1 ? prev.slice(0, -1) : prev)}
                      disabled={emergencyContacts.length <= 1}
                      sx={{ textTransform: 'none', minWidth: 96 }}
                    >
                      Remover
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            ))}
          </Paper>
        </Stack>        
      );
    }

    if (step === 2) {
      return (
        <Grid container spacing={1.1}>
          <Grid size={{ xs: 12, md: 6 }}>
            {renderTextField('number_of_dependents')}
          </Grid>
          {['CASADO', 'UNIAO_ESTAVEL'].includes(formData.marital_status || '') && (
            <Grid size={{ xs: 12, md: 6 }}>
              {renderTextField('spouse_name')}
            </Grid>
          )}
        </Grid>
      );
    }

    if (step === 3) {
      return (
        <Stack spacing={1.25}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Idiomas *</Typography>
            <Button size="small" startIcon={<Plus size={16} />} onClick={addLanguage} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Adicionar idioma
            </Button>
          </Box>
          {availableLanguages.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Nenhum idioma cadastrado nas configurações. Cadastre idiomas em Configurações &gt; Listas do Sistema.
            </Typography>
          )}
          {!!fieldErrors.languages && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>{fieldErrors.languages}</Typography>
          )}
          {languages.map((lang, idx) => (
            <Box key={idx} sx={{ mb: idx < languages.length - 1 ? 2 : 0 }}>
              {languages.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Idioma {idx + 1}</Typography>
                  <IconButton size="small" onClick={() => removeLanguage(idx)} sx={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </IconButton>
                </Box>
              )}
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth select size="small" label="Idioma" value={lang.languageId} onChange={(e) => setLanguageField(idx, 'languageId', e.target.value)}>
                    <MenuItem value="">Selecione</MenuItem>
                    {availableLanguages.map((al) => (
                      <MenuItem key={al.id} value={al.id}>{al.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField fullWidth select size="small" label="Fluência" value={lang.proficiencyLevel} onChange={(e) => setLanguageField(idx, 'proficiencyLevel', e.target.value)}>
                    <MenuItem value="">Selecione</MenuItem>
                    <MenuItem value="BASICO">Básico</MenuItem>
                    <MenuItem value="INTERMEDIARIO">Intermediário</MenuItem>
                    <MenuItem value="AVANCADO">Avançado</MenuItem>
                    <MenuItem value="FLUENTE">Fluente</MenuItem>
                    <MenuItem value="NATIVO">Nativo</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              {idx < languages.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}

        </Stack>
      );
    }

    if (step === 4) {
      return (
        <Stack spacing={1.25}>
          <Grid container spacing={1.25}>
            <Grid size={{ xs: 12, md: 6 }}>{renderTextField('bank_name')}</Grid>
            <Grid size={{ xs: 12, md: 3 }}>{renderTextField('bank_agency')}</Grid>
            <Grid size={{ xs: 12, md: 3 }}>{renderTextField('bank_account')}</Grid>
            <Grid size={{ xs: 12, md: 6 }}>{renderTextField('pix_key')}</Grid>
          </Grid>
        </Stack>
      );
    }

    if (step === 5) {
      return (
        <Stack spacing={0.8}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!formData.has_food_intolerance}
                onChange={(e) => setFormData((p) => ({ ...p, has_food_intolerance: e.target.checked, food_intolerance: e.target.checked ? p.food_intolerance : '' }))}
              />
            }
            label="Possui restrição/intolerância alimentar"
          />
          {!!formData.has_food_intolerance && renderTextField('food_intolerance')}

          <FormControlLabel
            control={
              <Checkbox
                checked={!!formData.has_medication_allergy}
                onChange={(e) => setFormData((p) => ({ ...p, has_medication_allergy: e.target.checked, medication_allergy: e.target.checked ? p.medication_allergy : '' }))}
              />
            }
            label="Possui alergia a medicamentos"
          />
          {!!formData.has_medication_allergy && renderTextField('medication_allergy')}
        </Stack>
      );
    }

    if (step === 6) {
      return (
        <Stack spacing={1.25}>
          <Button component="label" variant="outlined" sx={{ textTransform: 'none' }} fullWidth>
            Upload RG/CPF/Comprovantes
            <input
              hidden
              multiple
              type="file"
              onChange={(e) => {
                const files = Array.from(e.target.files || []).map((f) => f.name);
                setDocuments((prev) => Array.from(new Set([...prev, ...files])));
              }}
            />
          </Button>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {documents.map((doc) => (
              <Chip key={doc} label={doc} onDelete={() => setDocuments((prev) => prev.filter((d) => d !== doc))} size="small" />
            ))}
          </Box>
        </Stack>
      );
    }

    if (step === 7) {
      return (
        <Stack spacing={1.25}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>{renderTextField('hire_date')}</Grid>
          </Grid>
          <TextField
            size="small"
            label="Observações adicionais"
            value={formData.observation || ''}
            multiline
            minRows={3}
            onChange={(e) => setFormData((p) => ({ ...p, observation: e.target.value }))}
            sx={fieldSx}
            fullWidth
          />
        </Stack>
      );
    }

    return (
      <Stack spacing={1.25}>
        {!!fieldErrors.lgpd && <Alert severity="warning">{fieldErrors.lgpd}</Alert>}
        <Typography variant="subtitle2" fontWeight={700}>Revise os principais dados</Typography>
        <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Typography variant="body2"><strong>Nome:</strong> {formData.legal_name || '-'}</Typography>
          <Typography variant="body2"><strong>CPF:</strong> {formatCPF(formData.government_id || '') || '-'}</Typography>
          <Typography variant="body2"><strong>E-mail:</strong> {formData.email || '-'}</Typography>
          <Typography variant="body2"><strong>Telefone:</strong> {formatPhone(formData.phone || '') || '-'}</Typography>
          <Typography variant="body2"><strong>Admissão:</strong> {formData.hire_date || '-'}</Typography>
          <Typography variant="body2"><strong>Tipo:</strong> {formMeta?.employee_type_value || formData.employee_type || '-'}</Typography>
        </Paper>

        <FormControlLabel
          control={<Checkbox checked={lgpdAccepted} onChange={(e) => setLgpdAccepted(e.target.checked)} />}
          label="Li e aceito os termos de tratamento de dados (LGPD)."
        />
      </Stack>
    );
  };

  if (error && !formMeta) {
    const title =
      errorType === 'expired'
        ? 'Processo expirado'
        : errorType === 'not_found'
          ? 'Processo não encontrado'
          : errorType === 'cancelled'
            ? 'Processo cancelado'
            : 'Formulário indisponível';

    const helper =
      errorType === 'expired'
        ? 'Este link passou da validade. Solicite um novo processo ao RH.'
        : errorType === 'not_found'
          ? 'O link informado não existe ou foi removido.'
          : errorType === 'cancelled'
            ? 'Este processo foi cancelado pelo RH e não pode mais ser usado.'
            : 'Não foi possível carregar o formulário neste momento.';

    return (
      <Box sx={{ maxWidth: 860, mx: 'auto', p: { xs: 1.5, sm: 2.5 } }}>
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <Box sx={{ mb: 2 }}>
            <LumeLogo size={isMobile ? 'md' : 'lg'} />
          </Box>
          <Typography variant="h5" fontWeight={700}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{helper}</Typography>
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        py: { xs: 2, md: 4 },
        px: { xs: 1, sm: 2 },
        background: `linear-gradient(165deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 52%, ${theme.palette.grey[100]} 100%)`,
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 65%, ${theme.palette.secondary.main} 140%)`,
              color: '#fff',
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
              <Stack spacing={1}>
                <LumeLogo size={isMobile ? 'md' : 'lg'} darkBg />
                <Typography variant="h5" fontWeight={700}>Onboarding Digital</Typography>
                <Typography variant="body2" sx={{ opacity: 0.92 }}>
                  Seja bem-vindo(a), {formMeta?.invite_name || 'colaborador(a)'}.
                </Typography>
              </Stack>
              <Stack spacing={0.3} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Link valido ate {new Date(formMeta.token_expires_at).toLocaleDateString('pt-BR')}
                </Typography>
                {formMeta.employee_type_value && (
                  <Chip
                    label={`Tipo: ${formMeta.employee_type_value}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.14)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                )}
              </Stack>
            </Stack>
          </Box>

          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Etapa {step + 1} de {TOTAL_STEPS}: {STEP_LABELS[step]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {STEP_HELPERS[step]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step} etapa(s) concluída(s) de {TOTAL_STEPS}.
              </Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.5, height: 9, borderRadius: 99 }} />
              {renderStepTag()}
              {renderDraftStatus()}
            </Stack>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

            <Paper sx={{ mt: 1.5, p: { xs: 1.25, md: 1.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: 'none' }}>
              {stepContent()}
            </Paper>

            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={step === 0 || saving}
                sx={{ textTransform: 'none', minWidth: 130 }}
                fullWidth={isMobile}
              >
                Voltar
              </Button>

              {step < REVIEW_STEP ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={saving}
                  sx={{ textTransform: 'none', fontWeight: 700, minWidth: 180 }}
                  fullWidth={isMobile}
                >
                  Salvar e continuar
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={submit}
                  disabled={saving || !!success}
                  sx={{ textTransform: 'none', fontWeight: 700, minWidth: 180 }}
                  fullWidth={isMobile}
                >
                  {saving ? 'Enviando...' : 'Enviar para analise'}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
