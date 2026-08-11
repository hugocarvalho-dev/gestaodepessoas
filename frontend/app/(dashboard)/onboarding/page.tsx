'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Copy, CheckCircle2, XCircle, SendHorizonal, Link2, Trash2, Plus } from 'lucide-react';
import { api, EmployeeTypeConfig, OnboardingPlan, OnboardingPlanField, OnboardingRequest } from '@/lib/api';
import { getTenantSlug } from '@/lib/tenant';

const FIELD_LABELS: Record<string, string> = {
  legal_name: 'Nome completo',
  preferred_name: 'Nome social',
  government_id: 'CPF',
  email: 'E-mail corporativo',
  personal_email: 'E-mail pessoal',
  phone: 'Telefone',
  date_of_birth: 'Data de nascimento',
  gender: 'Gênero',
  hire_date: 'Data de admissão',
  employee_type: 'Tipo de vínculo',
  department: 'Departamento',
  position: 'Cargo',
  contract_type: 'Tipo de contrato',
  work_hours: 'Carga horária',
  salary: 'Salário',
  cost_center: 'Centro de custo',
  address: 'Endereço',
  address_number: 'Número',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
  postal_code: 'CEP',
};

const PRESETS: Record<string, string[]> = {
  FULL_TIME: ['legal_name', 'government_id', 'email', 'phone', 'hire_date', 'employee_type', 'contract_type', 'salary'],
  PART_TIME: ['legal_name', 'government_id', 'email', 'phone', 'hire_date', 'employee_type', 'contract_type', 'work_hours'],
  CONTRACTOR: ['legal_name', 'government_id', 'email', 'phone', 'hire_date', 'employee_type', 'contract_type'],
  INTERN: ['legal_name', 'government_id', 'email', 'phone', 'date_of_birth', 'hire_date', 'employee_type'],
  APPRENTICE: ['legal_name', 'government_id', 'email', 'phone', 'date_of_birth', 'hire_date', 'employee_type'],
  TEMPORARY: ['legal_name', 'government_id', 'email', 'phone', 'hire_date', 'employee_type', 'contract_type'],
};

const DEFAULT_PLAN_FIELD_KEYS = ['legal_name', 'government_id', 'email', 'hire_date', 'employee_type'];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando preenchimento',
  SUBMITTED: 'Enviado para RH',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  EXPIRED: 'Expirado',
};

type PlanDraft = {
  id?: string;
  name: string;
  description: string;
  is_active: boolean;
  fields: OnboardingPlanField[];
};

const buildInitialPlanFields = (): OnboardingPlanField[] =>
  Object.entries(FIELD_LABELS).map(([key, label]) => ({
    key,
    label,
    enabled: DEFAULT_PLAN_FIELD_KEYS.includes(key),
    required: DEFAULT_PLAN_FIELD_KEYS.includes(key),
  }));

const makeEmptyPlanDraft = (): PlanDraft => ({
  name: '',
  description: '',
  is_active: true,
  fields: buildInitialPlanFields(),
});

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [plans, setPlans] = useState<OnboardingPlan[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeConfig[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: string; name: string }>>([]);
  const [managers, setManagers] = useState<Array<{ id: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDeleteConfirmOpen, setPlanDeleteConfirmOpen] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(makeEmptyPlanDraft());

  const [form, setForm] = useState({
    invite_email: '',
    personal_email: '',
    invite_name: '',
    hire_date: '',
    employee_type_value: '',
    onboarding_plan_id: '',
    expires_in_days: 7,
    department_id: '',
    position_id: '',
    manager_employee_id: '',
  });

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.id === form.onboarding_plan_id);
  }, [plans, form.onboarding_plan_id]);

  const selectedRequiredFields = useMemo(() => {
    if (selectedPlan?.fields?.length) {
      const selectedFromPlan = selectedPlan.fields
        .filter((field) => field.enabled && field.required)
        .map((field) => field.key);

      return selectedFromPlan.length ? selectedFromPlan : DEFAULT_PLAN_FIELD_KEYS;
    }

    if (!form.employee_type_value) return ['legal_name', 'government_id', 'email', 'hire_date', 'employee_type'];
    return PRESETS[form.employee_type_value] || ['legal_name', 'government_id', 'email', 'hire_date', 'employee_type'];
  }, [form.employee_type_value, selectedPlan]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [onboardingList, typeConfigs, departmentResp, positionResp, employeesResp, plansResponse] = await Promise.allSettled([
        api.getOnboardingRequests(),
        api.getEmployeeTypeConfigs(),
        api.getDepartments(),
        api.getPositions(),
        api.getEmployees(),
        api.getOnboardingPlans(),
      ]);

      if (onboardingList.status === 'fulfilled') {
        setRequests(onboardingList.value);
      }

      if (typeConfigs.status === 'fulfilled') {
        setEmployeeTypes(typeConfigs.value);
      }

      if (plansResponse.status === 'fulfilled') {
        const loadedPlans = plansResponse.value || [];
        setPlans(loadedPlans);
        if (!selectedPlanId && loadedPlans.length > 0) {
          setSelectedPlanId(loadedPlans[0].id);
        }
      }

      const departmentList = departmentResp.status === 'fulfilled'
        ? departmentResp.value
        : [];
      const positionList = positionResp.status === 'fulfilled'
        ? positionResp.value
        : [];
      const employeesList = employeesResp.status === 'fulfilled'
        ? employeesResp.value
        : [];

      setDepartments(
        departmentList
          .map((d: any) => ({ id: String(d.id), name: String(d.name || '') }))
          .filter((d: { id: string; name: string }) => !!d.id && !!d.name),
      );
      setPositions(
        positionList
          .map((p: any) => ({ id: String(p.id), name: String(p.name || p.title || '') }))
          .filter((p: { id: string; name: string }) => !!p.id && !!p.name),
      );
      setManagers(
        employeesList
          .map((emp: any) => ({
            id: String(emp.id),
            label: String(emp?.person?.legal_name || emp?.person?.preferred_name || emp.employee_number || 'Gestor'),
          }))
          .filter((m: { id: string; label: string }) => !!m.id && !!m.label),
      );

    } catch (e: any) {
      setError(e.message || 'Erro ao carregar onboarding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetCreateForm = () => {
    setForm({
      invite_email: '',
      personal_email: '',
      invite_name: '',
      hire_date: '',
      employee_type_value: '',
      onboarding_plan_id: '',
      expires_in_days: 7,
      department_id: '',
      position_id: '',
      manager_employee_id: '',
    });
  };

  const createInvite = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setGeneratedLink(null);

      if (!form.invite_name.trim()) {
        setError('Informe o nome completo do colaborador.');
        return;
      }

      if (!form.personal_email || !form.hire_date) {
        setError('Informe e-mail pessoal e data de admissão.');
        return;
      }

      if (!form.onboarding_plan_id) {
        setError('Selecione o plano de onboarding que será usado no processo.');
        return;
      }

      if (!form.department_id || !form.position_id || !form.manager_employee_id) {
        setError('Selecione departamento, cargo e gestor para criar o processo.');
        return;
      }

      const created = await api.createOnboardingRequest({
        invite_email: form.invite_email,
        personal_email: form.personal_email,
        invite_name: form.invite_name.trim(),
        hire_date: form.hire_date,
        onboarding_plan_id: form.onboarding_plan_id,
        employee_type_value: form.employee_type_value || undefined,
        expires_in_days: Number(form.expires_in_days),
        required_fields: selectedRequiredFields,
        department_id: form.department_id,
        position_id: form.position_id,
        manager_employee_id: form.manager_employee_id,
      });

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const tenant = getTenantSlug();
      const tenantQuery = tenant ? `?tenant=${encodeURIComponent(tenant)}` : '';
      const link = `${baseUrl}${created.invite_path}${tenantQuery}`;
      setGeneratedLink(link);
      setSuccess('Processo de onboarding criado com sucesso.');
      resetCreateForm();
      setCreateModalOpen(false);
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao criar processo');
    } finally {
      setSaving(false);
    }
  };

  const openPlansDialog = () => {
    setPlanDialogOpen(true);
    setPlanError(null);
    setPlanSuccess(null);
    if (plans.length > 0) {
      const first = plans[0];
      setSelectedPlanId(first.id);
      setPlanDraft({
        id: first.id,
        name: first.name,
        description: first.description || '',
        is_active: first.is_active,
        fields: first.fields || buildInitialPlanFields(),
      });
      return;
    }
    setSelectedPlanId(null);
    setPlanDraft(makeEmptyPlanDraft());
  };

  const selectExistingPlan = (plan: OnboardingPlan) => {
    setPlanError(null);
    setPlanSuccess(null);
    setSelectedPlanId(plan.id);
    setPlanDraft({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      is_active: plan.is_active,
      fields: plan.fields || buildInitialPlanFields(),
    });
  };

  const newPlan = () => {
    setPlanError(null);
    setPlanSuccess(null);
    setSelectedPlanId(null);
    setPlanDraft(makeEmptyPlanDraft());
  };

  const savePlan = async () => {
    try {
      setSavingPlan(true);
      setPlanError(null);
      setPlanSuccess(null);

      if (!planDraft.name.trim()) {
        setPlanError('Informe o nome do plano de onboarding.');
        return;
      }

      if (planDraft.id) {
        const updated = await api.updateOnboardingPlan(planDraft.id, {
          name: planDraft.name.trim(),
          description: planDraft.description.trim() || undefined,
          fields: planDraft.fields,
          is_active: planDraft.is_active,
        });
        setPlanSuccess('Plano atualizado com sucesso.');
        setPlans((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setPlanDraft({
          id: updated.id,
          name: updated.name,
          description: updated.description || '',
          is_active: updated.is_active,
          fields: updated.fields || buildInitialPlanFields(),
        });
        return;
      }

      const created = await api.createOnboardingPlan({
        name: planDraft.name.trim(),
        description: planDraft.description.trim() || undefined,
        fields: planDraft.fields,
        is_active: planDraft.is_active,
      });

      setPlanSuccess('Plano criado com sucesso.');
      setPlans((prev) => [created, ...prev]);
      setSelectedPlanId(created.id);
      setPlanDraft({
        id: created.id,
        name: created.name,
        description: created.description || '',
        is_active: created.is_active,
        fields: created.fields || buildInitialPlanFields(),
      });
    } catch (e: any) {
      setPlanError(e.message || 'Erro ao salvar plano de onboarding');
    } finally {
      setSavingPlan(false);
    }
  };

  const deleteCurrentPlan = async () => {
    if (!planDraft.id) return;

    try {
      setSavingPlan(true);
      setPlanError(null);
      setPlanSuccess(null);
      await api.deleteOnboardingPlan(planDraft.id);

      const updatedPlans = plans.filter((item) => item.id !== planDraft.id);
      setPlans(updatedPlans);
      setPlanSuccess('Plano removido com sucesso.');
      setPlanDeleteConfirmOpen(false);

      if (updatedPlans.length > 0) {
        const first = updatedPlans[0];
        setSelectedPlanId(first.id);
        setPlanDraft({
          id: first.id,
          name: first.name,
          description: first.description || '',
          is_active: first.is_active,
          fields: first.fields || buildInitialPlanFields(),
        });
      } else {
        setSelectedPlanId(null);
        setPlanDraft(makeEmptyPlanDraft());
      }
    } catch (e: any) {
      setPlanError(e.message || 'Erro ao excluir plano de onboarding');
    } finally {
      setSavingPlan(false);
    }
  };

  const togglePlanField = (key: string, type: 'enabled' | 'required') => {
    setPlanDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => {
        if (field.key !== key) return field;
        const nextValue = !field[type];

        if (type === 'enabled') {
          return {
            ...field,
            enabled: nextValue,
            required: nextValue ? field.required : false,
          };
        }

        return {
          ...field,
          required: nextValue,
          enabled: nextValue ? true : field.enabled,
        };
      }),
    }));
  };

  const approve = async (id: string) => {
    try {
      setError(null);
      await api.approveOnboardingRequest(id);
      setSuccess('Onboarding aprovado e colaborador criado.');
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao aprovar onboarding');
    }
  };

  const reject = async (id: string) => {
    try {
      setError(null);
      await api.rejectOnboardingRequest(id, 'Reprovado pelo RH');
      setSuccess('Onboarding rejeitado.');
      await loadData();
    } catch (e: any) {
      setError(e.message || 'Erro ao rejeitar onboarding');
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setSuccess('Link copiado para a área de transferência.');
  };

  const isInviteValid = (req: OnboardingRequest) => {
    const activeStatus = req.status === 'PENDING' || req.status === 'SUBMITTED';
    return activeStatus && new Date(req.token_expires_at).getTime() > Date.now();
  };

  const viewLinkAgain = async (req: OnboardingRequest) => {
    try {
      setError(null);
      const result = await api.getOnboardingInviteLink(req.id);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const tenant = getTenantSlug();
      const tenantQuery = tenant ? `?tenant=${encodeURIComponent(tenant)}` : '';
      const link = `${baseUrl}${result.invite_path}${tenantQuery}`;
      setGeneratedLink(link);
      setSuccess('Link recuperado com sucesso.');
    } catch (e: any) {
      setError(e.message || 'Não foi possível recuperar o link.');
    }
  };

  const cancelInvite = async (id: string) => {
    try {
      setError(null);
      await api.cancelOnboardingRequest(id);
      setRequests((prev) => prev.filter((request) => request.id !== id));
      setSuccess('Processo removido da lista com sucesso.');
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir processo');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Onboarding</Typography>
        <Typography variant="body2" color="text.secondary">
          Gestão de processos de admissão com formulários configuráveis por plano.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>Novo processo de admissão</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={openPlansDialog}
            >
              Gerenciar planos de onboarding
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Plus size={14} />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={() => setCreateModalOpen(true)}
            >
              Criar processo
            </Button>
          </Stack>
        </Box>

        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Novo processo de onboarding</DialogTitle>
          <DialogContent>
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <TextField
                  label="Nome completo"
                  size="small"
                  value={form.invite_name}
                  onChange={(e) => setForm((f) => ({ ...f, invite_name: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="E-mail de acesso ao link"
                  size="small"
                  value={form.invite_email}
                  onChange={(e) => setForm((f) => ({ ...f, invite_email: e.target.value }))}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <TextField
                  label="E-mail pessoal"
                  size="small"
                  type="email"
                  value={form.personal_email}
                  onChange={(e) => setForm((f) => ({ ...f, personal_email: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Data de admissão"
                  size="small"
                  type="date"
                  value={form.hire_date}
                  onChange={(e) => setForm((f) => ({ ...f, hire_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <TextField
                  select
                  size="small"
                  label="Plano de onboarding"
                  value={form.onboarding_plan_id}
                  onChange={(e) => setForm((f) => ({ ...f, onboarding_plan_id: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {plans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Tipo de vínculo"
                  value={form.employee_type_value}
                  onChange={(e) => setForm((f) => ({ ...f, employee_type_value: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Padrão</MenuItem>
                  {employeeTypes.map((et) => (
                    <MenuItem key={et.id} value={et.value}>{et.label}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              {plans.length === 0 && (
                <Alert
                  severity="warning"
                  action={
                    <Button color="inherit" size="small" onClick={openPlansDialog} sx={{ textTransform: 'none' }}>
                      Criar plano
                    </Button>
                  }
                >
                  Não existe plano de onboarding cadastrado. Crie um plano para continuar.
                </Alert>
              )}

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <TextField
                  select
                  size="small"
                  label="Departamento"
                  value={form.department_id}
                  onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Cargo"
                  value={form.position_id}
                  onChange={(e) => setForm((f) => ({ ...f, position_id: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {positions.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                <TextField
                  select
                  size="small"
                  label="Gestor"
                  value={form.manager_employee_id}
                  onChange={(e) => setForm((f) => ({ ...f, manager_employee_id: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="">Selecione</MenuItem>
                  {managers.map((m) => (
                    <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="number"
                  size="small"
                  label="Dias de validade"
                  value={form.expires_in_days}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expires_in_days: Math.max(1, Math.min(60, Number(e.target.value) || 7)),
                    }))
                  }
                  fullWidth
                />
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary">Campos obrigatórios no formulário</Typography>
                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                  {selectedRequiredFields.map((field) => (
                    <Chip key={field} label={FIELD_LABELS[field] || field} size="small" />
                  ))}
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateModalOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
            <Button
              variant="contained"
              startIcon={<SendHorizonal size={14} />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              disabled={
                saving
                || !form.invite_email
                || !form.personal_email
                || !form.invite_name
                || !form.hire_date
                || !form.onboarding_plan_id
                || !form.department_id
                || !form.position_id
                || !form.manager_employee_id
              }
              onClick={createInvite}
            >
              {saving ? 'Criando...' : 'Criar processo'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Planos de onboarding</DialogTitle>
          <DialogContent dividers>
            {planError && <Alert severity="error" sx={{ mb: 1.5 }}>{planError}</Alert>}
            {planSuccess && <Alert severity="success" sx={{ mb: 1.5 }}>{planSuccess}</Alert>}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Paper sx={{ width: { xs: '100%', md: 320 }, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Plus size={14} />}
                    sx={{ textTransform: 'none' }}
                    onClick={newPlan}
                  >
                    Criar novo plano
                  </Button>
                </Box>
                <List dense>
                  {plans.length === 0 && (
                    <Box sx={{ p: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Nenhum plano criado.</Typography>
                    </Box>
                  )}
                  {plans.map((plan) => (
                    <ListItemButton
                      key={plan.id}
                      selected={selectedPlanId === plan.id}
                      onClick={() => selectExistingPlan(plan)}
                    >
                      <ListItemText
                        primary={plan.name}
                        secondary={plan.is_active ? 'Plano ativo' : 'Plano inativo'}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>

              <Box sx={{ flex: 1 }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                    <TextField
                      size="small"
                      label="Nome do plano"
                      value={planDraft.name}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, name: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Descrição"
                      value={planDraft.description}
                      onChange={(e) => setPlanDraft((prev) => ({ ...prev, description: e.target.value }))}
                      fullWidth
                    />
                  </Stack>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={planDraft.is_active}
                        onChange={(e) => setPlanDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
                      />
                    }
                    label="Plano ativo para uso"
                  />

                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Campos do plano</Typography>
                    <Stack spacing={0.8}>
                      {planDraft.fields.map((field) => (
                        <Paper
                          key={field.key}
                          sx={{
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>{field.label}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Switch
                              size="small"
                              checked={field.enabled}
                              onChange={() => togglePlanField(field.key, 'enabled')}
                              color="success"
                            />
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={field.required}
                                  onChange={() => togglePlanField(field.key, 'required')}
                                  disabled={!field.enabled}
                                />
                              }
                              label={<Typography variant="caption">Obrigatório</Typography>}
                            />
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlanDialogOpen(false)} sx={{ textTransform: 'none' }}>Fechar</Button>
            <Button
              color="error"
              onClick={() => setPlanDeleteConfirmOpen(true)}
              sx={{ textTransform: 'none' }}
              disabled={savingPlan || !planDraft.id}
            >
              Excluir plano
            </Button>
            <Button
              variant="contained"
              onClick={savePlan}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              disabled={savingPlan}
            >
              {savingPlan ? 'Salvando...' : 'Salvar plano'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={planDeleteConfirmOpen} onClose={() => setPlanDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Excluir plano</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Tem certeza que deseja excluir este plano de onboarding?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlanDeleteConfirmOpen(false)} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={deleteCurrentPlan} sx={{ textTransform: 'none' }}>
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        {generatedLink && (
          <Paper sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary">Link ativo:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all', mt: 0.5 }}>{generatedLink}</Typography>
            <Button size="small" startIcon={<Copy size={14} />} sx={{ mt: 1, textTransform: 'none' }} onClick={copyLink}>
              Copiar link
            </Button>
          </Paper>
        )}
      </Paper>

      <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Box sx={{ p: 2.5, pb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>Processos de onboarding</Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2.5 }}>
          {requests.length === 0 && (
            <Typography variant="body2" color="text.secondary">Nenhum onboarding criado ainda.</Typography>
          )}

          <Stack spacing={1.5}>
            {requests.map((req) => (
              <Paper key={req.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography fontWeight={600}>{req.invite_name || req.invite_email}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {req.invite_email} • Expira em {new Date(req.token_expires_at).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={STATUS_LABELS[req.status] || req.status}
                    color={
                      req.status === 'APPROVED'
                        ? 'success'
                        : req.status === 'REJECTED'
                          ? 'error'
                          : req.status === 'SUBMITTED'
                            ? 'warning'
                            : req.status === 'EXPIRED'
                              ? 'error'
                            : 'default'
                    }
                  />
                </Box>

                {req.status === 'SUBMITTED' && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button size="small" variant="contained" startIcon={<CheckCircle2 size={14} />} onClick={() => approve(req.id)}>
                      Aprovar
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<XCircle size={14} />} onClick={() => reject(req.id)}>
                      Rejeitar
                    </Button>
                  </Stack>
                )}

                <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Link2 size={14} />}
                    disabled={!isInviteValid(req)}
                    onClick={() => viewLinkAgain(req)}
                    sx={{ textTransform: 'none' }}
                  >
                    Ver link
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<Trash2 size={14} />}
                    disabled={req.status === 'APPROVED'}
                    onClick={() => cancelInvite(req.id)}
                    sx={{ textTransform: 'none' }}
                  >
                    Excluir processo
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
