'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Collapse,
  InputAdornment,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Check, Plus, Pencil, Trash2, ChevronDown,
  ChevronRight, Search, Languages, Award, Layers, FileText, Briefcase,
  X, Settings2, Mail, Webhook, Eye, EyeOff, Send, Bell, Zap, Landmark,
} from 'lucide-react';
import { api, PositionLevel, Language, Skill, CostCenter, EmployeeTypeConfig, ContractTypeConfig } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info';
}

// ─── Generic CRUD Section ────────────────────────────────────────────
interface CrudSectionProps<T extends { id: string }> {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: T[];
  loading: boolean;
  columns: { key: keyof T; label: string; width?: string }[];
  renderCell?: (item: T, key: keyof T) => React.ReactNode;
  onAdd: (data: Record<string, string>) => Promise<void>;
  onUpdate: (id: string, data: Record<string, string>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  addFields: { key: string; label: string; required?: boolean; placeholder?: string }[];
  searchKey: keyof T;
}

function CrudSection<T extends { id: string }>({
  title, subtitle, icon: Icon, items, loading, columns, renderCell,
  onAdd, onUpdate, onDelete, addFields, searchKey,
}: CrudSectionProps<T>) {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [addMode, setAddMode] = useState(false);
  const [addData, setAddData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item => String(item[searchKey]).toLowerCase().includes(q));
  }, [items, search, searchKey]);

  const handleStartEdit = (item: T) => {
    setEditingId(item.id);
    const data: Record<string, string> = {};
    addFields.forEach(f => { data[f.key] = String((item as any)[f.key] || ''); });
    setEditData(data);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await onUpdate(editingId, editData);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const hasRequired = addFields.filter(f => f.required).every(f => addData[f.key]?.trim());
    if (!hasRequired) return;
    setSaving(true);
    try {
      await onAdd(addData);
      setAddData({});
      setAddMode(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.15s',
        }}
      >
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color="white" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Chip label={items.length} size="small" sx={{ fontWeight: 700, bgcolor: 'action.selected' }} />
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* Toolbar */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, maxWidth: 300 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={() => { setAddMode(true); setAddData({}); }}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
            >
              Adicionar
            </Button>
          </Box>

          {/* Add row */}
          <Collapse in={addMode}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: 1.5, border: '2px solid', borderColor: 'secondary.main', bgcolor: 'rgba(212,168,75,0.04)' }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>Novo Registro</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {addFields.map(f => (
                  <TextField
                    key={f.key}
                    size="small"
                    label={f.label}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={addData[f.key] || ''}
                    onChange={e => setAddData(d => ({ ...d, [f.key]: e.target.value }))}
                    sx={{ minWidth: 160, flex: 1 }}
                  />
                ))}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button variant="contained" size="small" onClick={handleAdd} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => setAddMode(false)} sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                    Cancelar
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Collapse>

          {/* Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {search ? 'Nenhum resultado encontrado' : 'Nenhum registro cadastrado'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map(col => (
                      <TableCell key={String(col.key)} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: col.width }}>
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', width: 100 }}>
                      AÇÕES
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow key={item.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      {columns.map(col => (
                        <TableCell key={String(col.key)}>
                          {editingId === item.id ? (
                            addFields.find(f => f.key === String(col.key)) ? (
                              <TextField
                                size="small"
                                value={editData[String(col.key)] || ''}
                                onChange={e => setEditData(d => ({ ...d, [String(col.key)]: e.target.value }))}
                                sx={{ minWidth: 120 }}
                                variant="outlined"
                              />
                            ) : renderCell ? renderCell(item, col.key) : String(item[col.key] ?? '')
                          ) : renderCell ? renderCell(item, col.key) : (
                            <Typography variant="body2">{String(item[col.key] ?? '—')}</Typography>
                          )}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        {editingId === item.id ? (
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Salvar">
                              <IconButton size="small" color="primary" onClick={handleSaveEdit} disabled={saving}>
                                <Check size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancelar">
                              <IconButton size="small" onClick={() => setEditingId(null)}>
                                <X size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => handleStartEdit(item)}>
                                <Pencil size={15} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                                <Trash2 size={15} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Collapse>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting} sx={{ textTransform: 'none' }}>
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

// ─── Read-Only Enum Section ──────────────────────────────────────────
function EnumSection({ title, subtitle, icon: Icon, items }: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: { value: string; label: string; description: string }[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 2, overflow: 'hidden' }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.15s',
        }}
      >
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.main', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color="white" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600} noWrap>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Chip label={items.length} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5, py: 0.5 }}>
            Estes valores são definidos pelo sistema e não podem ser alterados.
          </Alert>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {items.map(item => (
              <Paper
                key={item.value}
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 1.5, flex: '1 1 220px', maxWidth: 320 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                  <Chip label={item.value} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>
                <Typography variant="caption" color="text.secondary">{item.description}</Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}

// ═════════════════════════════════════════════════════════════════════
// ─── Main Page ───────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  // Data states for system config
  const [positionLevels, setPositionLevels] = useState<PositionLevel[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeTypeConfig[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractTypeConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  const showSnack = useCallback((message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Load system configuration data
  const loadConfigData = useCallback(async () => {
    setConfigLoading(true);
    try {
      const [pl, lang, sk, cc, et, ct] = await Promise.all([
        api.getPositionLevels().catch(() => []),
        api.getLanguages().catch(() => []),
        api.getSkills().catch(() => []),
        api.getCostCenters().catch(() => []),
        api.getEmployeeTypeConfigs().catch(() => []),
        api.getContractTypeConfigs().catch(() => []),
      ]);
      setPositionLevels(pl);
      setLanguages(lang);
      setSkills(sk);
      setCostCenters(cc);
      setEmployeeTypes(et);
      setContractTypes(ct);
    } catch {
      showSnack('Erro ao carregar configurações', 'error');
    } finally {
      setConfigLoading(false);
    }
  }, [showSnack]);

  useEffect(() => {
    loadConfigData();
  }, [loadConfigData]);

  // ─── CRUD handlers ─────────────────────────────────────────────────

  // Position Levels
  const handleAddPositionLevel = useCallback(async (data: Record<string, string>) => {
    const normalizedName = (data.name || '').trim().toLowerCase();
    if (!normalizedName) {
      showSnack('Informe o nome do nível de cargo', 'error');
      return;
    }

    const alreadyExists = positionLevels.some(
      (level) => level.name.trim().toLowerCase() === normalizedName,
    );
    if (alreadyExists) {
      showSnack('Já existe um nível de cargo com este nome', 'error');
      return;
    }

    try {
      const created = await api.createPositionLevel({
        name: data.name.trim(),
      });
      setPositionLevels(prev => [...prev, created]);
      showSnack('Nível de cargo criado com sucesso!');
    } catch {
      showSnack('Erro ao criar nível de cargo', 'error');
    }
  }, [positionLevels, showSnack]);

  const handleUpdatePositionLevel = useCallback(async (id: string, data: Record<string, string>) => {
    const normalizedName = (data.name || '').trim().toLowerCase();
    if (!normalizedName) {
      showSnack('Informe o nome do nível de cargo', 'error');
      return;
    }

    const alreadyExists = positionLevels.some(
      (level) => level.id !== id && level.name.trim().toLowerCase() === normalizedName,
    );
    if (alreadyExists) {
      showSnack('Já existe um nível de cargo com este nome', 'error');
      return;
    }

    try {
      const updated = await api.updatePositionLevel(id, {
        name: data.name?.trim() || undefined,
      });
      setPositionLevels(prev => prev.map(p => p.id === id ? updated : p));
      showSnack('Nível de cargo atualizado!');
    } catch {
      showSnack('Erro ao atualizar nível de cargo', 'error');
    }
  }, [positionLevels, showSnack]);

  const handleDeletePositionLevel = useCallback(async (id: string) => {
    try {
      await api.deletePositionLevel(id);
      setPositionLevels(prev => prev.filter(p => p.id !== id));
      showSnack('Nível de cargo excluído!');
    } catch {
      showSnack('Erro ao excluir nível de cargo', 'error');
    }
  }, [showSnack]);

  // Languages
  const handleAddLanguage = useCallback(async (data: Record<string, string>) => {
    try {
      const created = await api.createLanguage({
        name: data.name,
      });
      setLanguages(prev => [...prev, created]);
      showSnack('Idioma criado com sucesso!');
    } catch {
      showSnack('Erro ao criar idioma', 'error');
    }
  }, [showSnack]);

  const handleUpdateLanguage = useCallback(async (id: string, data: Record<string, string>) => {
    try {
      const updated = await api.updateLanguage(id, {
        name: data.name || undefined,
      });
      setLanguages(prev => prev.map(l => l.id === id ? updated : l));
      showSnack('Idioma atualizado!');
    } catch {
      showSnack('Erro ao atualizar idioma', 'error');
    }
  }, [showSnack]);

  const handleDeleteLanguage = useCallback(async (id: string) => {
    try {
      await api.deleteLanguage(id);
      setLanguages(prev => prev.filter(l => l.id !== id));
      showSnack('Idioma excluído!');
    } catch {
      showSnack('Erro ao excluir idioma', 'error');
    }
  }, [showSnack]);

  // Skills
  const handleAddSkill = useCallback(async (data: Record<string, string>) => {
    try {
      const created = await api.createSkill({
        name: data.name,
        category: data.category || undefined,
      });
      setSkills(prev => [...prev, created]);
      showSnack('Habilidade criada com sucesso!');
    } catch {
      showSnack('Erro ao criar habilidade', 'error');
    }
  }, [showSnack]);

  const handleUpdateSkill = useCallback(async (id: string, data: Record<string, string>) => {
    try {
      const updated = await api.updateSkill(id, {
        name: data.name || undefined,
        category: data.category || undefined,
      });
      setSkills(prev => prev.map(s => s.id === id ? updated : s));
      showSnack('Habilidade atualizada!');
    } catch {
      showSnack('Erro ao atualizar habilidade', 'error');
    }
  }, [showSnack]);

  const handleDeleteSkill = useCallback(async (id: string) => {
    try {
      await api.deleteSkill(id);
      setSkills(prev => prev.filter(s => s.id !== id));
      showSnack('Habilidade excluída!');
    } catch {
      showSnack('Erro ao excluir habilidade', 'error');
    }
  }, [showSnack]);

  // Cost Centers
  const handleAddCostCenter = useCallback(async (data: Record<string, string>) => {
    try {
      const created = await api.createCostCenter({
        name: data.name,
        code: data.code || undefined,
        description: data.description || undefined,
      });
      setCostCenters(prev => [...prev, created]);
      showSnack('Centro de custo criado com sucesso!');
    } catch {
      showSnack('Erro ao criar centro de custo', 'error');
    }
  }, [showSnack]);

  const handleUpdateCostCenter = useCallback(async (id: string, data: Record<string, string>) => {
    try {
      const updated = await api.updateCostCenter(id, {
        name: data.name || undefined,
        code: data.code || undefined,
        description: data.description || undefined,
      });
      setCostCenters(prev => prev.map(c => c.id === id ? updated : c));
      showSnack('Centro de custo atualizado!');
    } catch {
      showSnack('Erro ao atualizar centro de custo', 'error');
    }
  }, [showSnack]);

  const handleDeleteCostCenter = useCallback(async (id: string) => {
    try {
      await api.deleteCostCenter(id);
      setCostCenters(prev => prev.filter(c => c.id !== id));
      showSnack('Centro de custo excluído!');
    } catch {
      showSnack('Erro ao excluir centro de custo', 'error');
    }
  }, [showSnack]);

  // ─── Tab state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);

  // Employee Types
  const handleAddEmployeeType = useCallback(async (data: Record<string, string>) => {
    try {
      const created = await api.createEmployeeTypeConfig({
        value: data.value || data.label.trim().toUpperCase().replace(/\s+/g, '_'),
        label: data.label,
        description: data.description || undefined,
      });
      setEmployeeTypes(prev => [...prev, created]);
      showSnack('Tipo de colaborador criado com sucesso!');
    } catch {
      showSnack('Erro ao criar tipo de colaborador', 'error');
    }
  }, [showSnack]);

  const handleUpdateEmployeeType = useCallback(async (id: string, data: Record<string, string>) => {
    try {
      const updated = await api.updateEmployeeTypeConfig(id, {
        value: data.value || undefined,
        label: data.label || undefined,
        description: data.description || undefined,
      });
      setEmployeeTypes(prev => prev.map(e => e.id === id ? updated : e));
      showSnack('Tipo de colaborador atualizado!');
    } catch {
      showSnack('Erro ao atualizar tipo de colaborador', 'error');
    }
  }, [showSnack]);

  const handleDeleteEmployeeType = useCallback(async (id: string) => {
    try {
      await api.deleteEmployeeTypeConfig(id);
      setEmployeeTypes(prev => prev.filter(e => e.id !== id));
      showSnack('Tipo de colaborador excluído!');
    } catch {
      showSnack('Erro ao excluir tipo de colaborador', 'error');
    }
  }, [showSnack]);

  // Contract Types
  const handleAddContractType = useCallback(async (data: Record<string, string>) => {
    try {
      const created = await api.createContractTypeConfig({
        value: data.value || data.label.trim().toUpperCase().replace(/\s+/g, '_'),
        label: data.label,
        description: data.description || undefined,
      });
      setContractTypes(prev => [...prev, created]);
      showSnack('Tipo de contrato criado com sucesso!');
    } catch {
      showSnack('Erro ao criar tipo de contrato', 'error');
    }
  }, [showSnack]);

  const handleUpdateContractType = useCallback(async (id: string, data: Record<string, string>) => {
    try {
      const updated = await api.updateContractTypeConfig(id, {
        value: data.value || undefined,
        label: data.label || undefined,
        description: data.description || undefined,
      });
      setContractTypes(prev => prev.map(c => c.id === id ? updated : c));
      showSnack('Tipo de contrato atualizado!');
    } catch {
      showSnack('Erro ao atualizar tipo de contrato', 'error');
    }
  }, [showSnack]);

  const handleDeleteContractType = useCallback(async (id: string) => {
    try {
      await api.deleteContractTypeConfig(id);
      setContractTypes(prev => prev.filter(c => c.id !== id));
      showSnack('Tipo de contrato excluído!');
    } catch {
      showSnack('Erro ao excluir tipo de contrato', 'error');
    }
  }, [showSnack]);

  // ─── Email config state (UI only) ─────────────────────────────────
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: '587',
    encryption: 'TLS',
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // ─── Webhook config state (UI only) ───────────────────────────────
  interface WebhookConfig {
    id: string;
    url: string;
    secret: string;
    active: boolean;
    events: string[];
  }
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [webhookDialog, setWebhookDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [webhookForm, setWebhookForm] = useState({ url: '', secret: '', active: true, events: [] as string[] });

  const WEBHOOK_EVENTS = [
    { value: 'employee.created', label: 'Colaborador criado', group: 'Colaboradores' },
    { value: 'employee.updated', label: 'Colaborador atualizado', group: 'Colaboradores' },
    { value: 'employee.deleted', label: 'Colaborador excluído', group: 'Colaboradores' },
    { value: 'employee.status_changed', label: 'Status do colaborador alterado', group: 'Colaboradores' },
    { value: 'contract.created', label: 'Contrato criado', group: 'Contratos' },
    { value: 'contract.updated', label: 'Contrato atualizado', group: 'Contratos' },
    { value: 'contract.terminated', label: 'Contrato encerrado', group: 'Contratos' },
    { value: 'department.changed', label: 'Departamento alterado', group: 'Organização' },
    { value: 'position.changed', label: 'Cargo alterado', group: 'Organização' },
    { value: 'document.uploaded', label: 'Documento enviado', group: 'Documentos' },
    { value: 'document.expired', label: 'Documento expirado', group: 'Documentos' },
  ];

  const handleTestEmail = () => {
    setTestingEmail(true);
    setTimeout(() => {
      setTestingEmail(false);
      showSnack('Funcionalidade será implementada no backend.', 'info');
    }, 1500);
  };

  const handleSaveEmail = () => {
    setSavingEmail(true);
    setTimeout(() => {
      setSavingEmail(false);
      showSnack('Funcionalidade será implementada no backend.', 'info');
    }, 1000);
  };

  const handleSaveWebhook = () => {
    if (!webhookForm.url.trim()) return;
    if (editingWebhook) {
      setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? { ...w, ...webhookForm } : w));
      showSnack('Webhook atualizado!');
    } else {
      const newWh: WebhookConfig = { id: crypto.randomUUID(), ...webhookForm };
      setWebhooks(prev => [...prev, newWh]);
      showSnack('Webhook criado com sucesso!');
    }
    setWebhookDialog(false);
    setEditingWebhook(null);
    setWebhookForm({ url: '', secret: '', active: true, events: [] });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    showSnack('Webhook excluído!');
  };

  const handleEditWebhook = (wh: WebhookConfig) => {
    setEditingWebhook(wh);
    setWebhookForm({ url: wh.url, secret: wh.secret, active: wh.active, events: wh.events });
    setWebhookDialog(true);
  };

  const toggleWebhookEvent = (event: string) => {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  // ─── Render ────────────────────────────────────────────────────────

  if (configLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings2 size={18} color="white" />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            Configurações
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Gerencie listas do sistema, servidor de e-mail e integrações via webhook.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 48 },
          }}
        >
          <Tab icon={<Layers size={16} />} iconPosition="start" label="Listas do Sistema" />
          <Tab icon={<Mail size={16} />} iconPosition="start" label="Notificações" />
          <Tab icon={<Webhook size={16} />} iconPosition="start" label="Webhooks" />
        </Tabs>
      </Paper>

      {/* ═══ Tab 0: Listas do Sistema ═══ */}
      {activeTab === 0 && (
        <Box>
          {/* CRUD: Níveis de Cargo */}
          <CrudSection<PositionLevel>
            title="Níveis de Cargo"
            subtitle="Hierarquia de níveis utilizada nos cargos (ex: Júnior, Pleno, Sênior)"
            icon={Layers}
            items={positionLevels}
            loading={configLoading}
            columns={[
              { key: 'name', label: 'Nome', width: '70%' },
            ]}
            renderCell={(item, key) => {
              return <Typography variant="body2" fontWeight={500}>{String(item[key] ?? '—')}</Typography>;
            }}
            searchKey="name"
            addFields={[
              { key: 'name', label: 'Nome', required: true, placeholder: 'Ex: Sênior' },
            ]}
            onAdd={handleAddPositionLevel}
            onUpdate={handleUpdatePositionLevel}
            onDelete={handleDeletePositionLevel}
          />

          {/* CRUD: Idiomas */}
          <CrudSection<Language>
            title="Idiomas"
            subtitle="Idiomas disponíveis para seleção nos perfis de colaboradores"
            icon={Languages}
            items={languages}
            loading={configLoading}
            columns={[
              { key: 'name', label: 'Idioma', width: '80%' },
            ]}
            renderCell={(item, key) => (
              <Typography variant="body2" fontWeight={500}>{String(item[key] ?? '—')}</Typography>
            )}
            searchKey="name"
            addFields={[
              { key: 'name', label: 'Idioma', required: true, placeholder: 'Ex: Inglês' },
            ]}
            onAdd={handleAddLanguage}
            onUpdate={handleUpdateLanguage}
            onDelete={handleDeleteLanguage}
          />

          {/* CRUD: Habilidades */}
          <CrudSection<Skill>
            title="Habilidades"
            subtitle="Competências e habilidades disponíveis para seleção"
            icon={Award}
            items={skills}
            loading={configLoading}
            columns={[
              { key: 'name', label: 'Habilidade', width: '55%' },
              { key: 'category' as keyof Skill, label: 'Categoria', width: '25%' },
            ]}
            renderCell={(item, key) => {
              if (key === ('category' as keyof Skill)) {
                const cat = (item as any).category;
                return cat ? (
                  <Chip label={cat} size="small" color="primary" variant="outlined" sx={{ fontWeight: 500, fontSize: '0.75rem' }} />
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                );
              }
              return <Typography variant="body2" fontWeight={500}>{String(item[key] ?? '—')}</Typography>;
            }}
            searchKey="name"
            addFields={[
              { key: 'name', label: 'Habilidade', required: true, placeholder: 'Ex: React' },
              { key: 'category', label: 'Categoria', placeholder: 'Ex: Frontend' },
            ]}
            onAdd={handleAddSkill}
            onUpdate={handleUpdateSkill}
            onDelete={handleDeleteSkill}
          />

          {/* CRUD: Centros de Custo */}
          <CrudSection<CostCenter>
            title="Centros de Custo"
            subtitle="Centros de custo disponíveis para vincular aos colaboradores"
            icon={Landmark}
            items={costCenters}
            loading={configLoading}
            columns={[
              { key: 'name', label: 'Nome', width: '40%' },
              { key: 'code' as keyof CostCenter, label: 'Código', width: '20%' },
              { key: 'description' as keyof CostCenter, label: 'Descrição', width: '25%' },
            ]}
            renderCell={(item, key) => {
              if (key === ('code' as keyof CostCenter)) {
                const code = (item as any).code;
                return code ? (
                  <Chip label={code} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                );
              }
              if (key === ('description' as keyof CostCenter)) {
                const desc = (item as any).description;
                return desc ? (
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{desc}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                );
              }
              return <Typography variant="body2" fontWeight={500}>{String(item[key] ?? '—')}</Typography>;
            }}
            searchKey="name"
            addFields={[
              { key: 'name', label: 'Nome', required: true, placeholder: 'Ex: Administrativo' },
              { key: 'code', label: 'Código', placeholder: 'Ex: CC-001' },
              { key: 'description', label: 'Descrição', placeholder: 'Descrição opcional' },
            ]}
            onAdd={handleAddCostCenter}
            onUpdate={handleUpdateCostCenter}
            onDelete={handleDeleteCostCenter}
          />

          {/* CRUD: Tipos de Colaborador */}
          <CrudSection<EmployeeTypeConfig>
            title="Tipos de Colaborador"
            subtitle="CLT, PJ, MEI, estagiário — tipos de vínculo"
            icon={Briefcase}
            items={employeeTypes}
            loading={configLoading}
            columns={[
              { key: 'label', label: 'Nome', width: '30%' },
              { key: 'value' as keyof EmployeeTypeConfig, label: 'Código', width: '25%' },
              { key: 'description' as keyof EmployeeTypeConfig, label: 'Descrição', width: '30%' },
            ]}
            renderCell={(item, key) => {
              if (key === ('value' as keyof EmployeeTypeConfig)) {
                return <Chip label={String((item as any).value)} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />;
              }
              if (key === ('description' as keyof EmployeeTypeConfig)) {
                const desc = (item as any).description;
                return desc ? (
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{desc}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                );
              }
              return <Typography variant="body2" fontWeight={500}>{String(item[key] ?? '—')}</Typography>;
            }}
            searchKey="label"
            addFields={[
              { key: 'label', label: 'Nome', required: true, placeholder: 'Ex: Tempo Integral' },
              { key: 'value', label: 'Código', required: true, placeholder: 'Ex: FULL_TIME' },
              { key: 'description', label: 'Descrição', placeholder: 'Descrição opcional' },
            ]}
            onAdd={handleAddEmployeeType}
            onUpdate={handleUpdateEmployeeType}
            onDelete={handleDeleteEmployeeType}
          />

          {/* CRUD: Tipos de Contrato */}
          <CrudSection<ContractTypeConfig>
            title="Tipos de Contrato"
            subtitle="Indeterminado, prazo determinado, temporário, aprendiz"
            icon={FileText}
            items={contractTypes}
            loading={configLoading}
            columns={[
              { key: 'label', label: 'Nome', width: '30%' },
              { key: 'value' as keyof ContractTypeConfig, label: 'Código', width: '25%' },
              { key: 'description' as keyof ContractTypeConfig, label: 'Descrição', width: '30%' },
            ]}
            renderCell={(item, key) => {
              if (key === ('value' as keyof ContractTypeConfig)) {
                return <Chip label={String((item as any).value)} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />;
              }
              if (key === ('description' as keyof ContractTypeConfig)) {
                const desc = (item as any).description;
                return desc ? (
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{desc}</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                );
              }
              return <Typography variant="body2" fontWeight={500}>{String(item[key] ?? '—')}</Typography>;
            }}
            searchKey="label"
            addFields={[
              { key: 'label', label: 'Nome', required: true, placeholder: 'Ex: Indeterminado' },
              { key: 'value', label: 'Código', required: true, placeholder: 'Ex: INDEFINITE' },
              { key: 'description', label: 'Descrição', placeholder: 'Descrição opcional' },
            ]}
            onAdd={handleAddContractType}
            onUpdate={handleUpdateContractType}
            onDelete={handleDeleteContractType}
          />
        </Box>
      )}

      {/* ═══ Tab 1: Notificações — Servidor de E-mail ═══ */}
      {activeTab === 1 && (
        <Box>
          <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3 }}>
            {/* Section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={18} color="white" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Servidor de E-mail (SMTP)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Configure o servidor SMTP que será utilizado para envio de notificações do sistema.
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5, py: 0.5 }}>
              As notificações por e-mail serão utilizadas para alertas de vencimento de documentos, lembretes de avaliação, comunicados internos e mais.
            </Alert>

            {/* SMTP Connection */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bell size={15} /> Conexão SMTP
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 3fr' }, gap: 2, mb: 3 }}>
              <TextField
                size="small"
                label="Host SMTP"
                placeholder="smtp.gmail.com"
                value={emailConfig.smtpHost}
                onChange={e => setEmailConfig(c => ({ ...c, smtpHost: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="Porta"
                placeholder="587"
                value={emailConfig.smtpPort}
                onChange={e => setEmailConfig(c => ({ ...c, smtpPort: e.target.value }))}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Criptografia</InputLabel>
                <Select
                  value={emailConfig.encryption}
                  label="Criptografia"
                  onChange={e => setEmailConfig(c => ({ ...c, encryption: e.target.value }))}
                >
                  <MenuItem value="TLS">TLS (Recomendado)</MenuItem>
                  <MenuItem value="SSL">SSL</MenuItem>
                  <MenuItem value="NONE">Nenhuma</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Authentication */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Zap size={15} /> Autenticação
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 2fr 3fr' }, gap: 2, mb: 3 }}>
              <TextField
                size="small"
                label="Usuário / E-mail"
                placeholder="noreply@suaempresa.com"
                value={emailConfig.username}
                onChange={e => setEmailConfig(c => ({ ...c, username: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={emailConfig.password}
                onChange={e => setEmailConfig(c => ({ ...c, password: e.target.value }))}
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            {/* Sender Info */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Send size={15} /> Remetente
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField
                size="small"
                label="Nome do Remetente"
                placeholder="RH - Sua Empresa"
                value={emailConfig.fromName}
                onChange={e => setEmailConfig(c => ({ ...c, fromName: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="E-mail do Remetente"
                placeholder="rh@suaempresa.com"
                value={emailConfig.fromEmail}
                onChange={e => setEmailConfig(c => ({ ...c, fromEmail: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="Responder Para (Reply-To)"
                placeholder="contato@suaempresa.com"
                value={emailConfig.replyTo}
                onChange={e => setEmailConfig(c => ({ ...c, replyTo: e.target.value }))}
                fullWidth
              />
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={testingEmail ? <CircularProgress size={14} /> : <Send size={15} />}
                onClick={handleTestEmail}
                disabled={testingEmail || !emailConfig.smtpHost || !emailConfig.username}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {testingEmail ? 'Testando...' : 'Testar Conexão'}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={savingEmail ? <CircularProgress size={14} color="inherit" /> : <Check size={15} />}
                onClick={handleSaveEmail}
                disabled={savingEmail}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {savingEmail ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ═══ Tab 2: Webhooks ═══ */}
      {activeTab === 2 && (
        <Box>
          <Paper sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 3 }}>
            {/* Section header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Webhook size={18} color="white" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Webhooks</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configure endpoints que serão notificados automaticamente quando eventos ocorrerem no sistema.
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={16} />}
                onClick={() => {
                  setEditingWebhook(null);
                  setWebhookForm({ url: '', secret: '', active: true, events: [] });
                  setWebhookDialog(true);
                }}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', flexShrink: 0 }}
              >
                Novo Webhook
              </Button>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5, py: 0.5 }}>
              Webhooks enviam uma requisição HTTP POST para a URL configurada sempre que um evento selecionado ocorrer. Utilize para integrar com sistemas externos.
            </Alert>

            {/* Webhook list */}
            {webhooks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Webhook size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  Nenhum webhook configurado.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Clique em &quot;Novo Webhook&quot; para começar.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {webhooks.map(wh => (
                  <Paper
                    key={wh.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={wh.active ? 'Ativo' : 'Inativo'}
                          size="small"
                          color={wh.active ? 'success' : 'default'}
                          sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                        />
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {wh.url}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                        {wh.events.map(ev => (
                          <Chip
                            key={ev}
                            label={WEBHOOK_EVENTS.find(e => e.value === ev)?.label || ev}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        ))}
                        {wh.events.length === 0 && (
                          <Typography variant="caption" color="text.secondary">Nenhum evento selecionado</Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditWebhook(wh)}>
                          <Pencil size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDeleteWebhook(wh.id)}>
                          <Trash2 size={15} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>

          {/* Webhook Add/Edit Dialog */}
          <Dialog open={webhookDialog} onClose={() => setWebhookDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
              {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  size="small"
                  label="URL do Webhook"
                  placeholder="https://api.example.com/webhook"
                  value={webhookForm.url}
                  onChange={e => setWebhookForm(f => ({ ...f, url: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  size="small"
                  label="Secret / Token (opcional)"
                  placeholder="whsec_xxxxx..."
                  value={webhookForm.secret}
                  onChange={e => setWebhookForm(f => ({ ...f, secret: e.target.value }))}
                  fullWidth
                  helperText="Será enviado no header X-Webhook-Secret para verificação."
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={webhookForm.active}
                      onChange={e => setWebhookForm(f => ({ ...f, active: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" fontWeight={500}>Ativo</Typography>}
                />

                <Divider />

                <Typography variant="subtitle2" fontWeight={700}>Eventos</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                  Selecione os eventos que dispararão este webhook.
                </Typography>

                {/* Group events */}
                {['Colaboradores', 'Contratos', 'Organização', 'Documentos'].map(group => (
                  <Box key={group}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1 }}>
                      {group}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {WEBHOOK_EVENTS.filter(e => e.group === group).map(ev => (
                        <Chip
                          key={ev.value}
                          label={ev.label}
                          size="small"
                          variant={webhookForm.events.includes(ev.value) ? 'filled' : 'outlined'}
                          color={webhookForm.events.includes(ev.value) ? 'primary' : 'default'}
                          onClick={() => toggleWebhookEvent(ev.value)}
                          sx={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setWebhookDialog(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleSaveWebhook}
                disabled={!webhookForm.url.trim()}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {editingWebhook ? 'Salvar Alterações' : 'Criar Webhook'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
