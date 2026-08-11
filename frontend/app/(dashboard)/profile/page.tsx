'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Switch,
} from '@mui/material';
import {
  Save,
  Mail,
  Briefcase,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Bell,
} from 'lucide-react';
import { api, UserSettings } from '@/lib/api';
import { useTheme } from '@/components/providers/ThemeProvider';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companies: Array<{
    id: string | number;
    name: string;
    roles?: Array<{ name: string }>;
  }>;
}

export default function ProfilePage() {
  const { setMode } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [originalEmail, setOriginalEmail] = useState('');

  // Settings
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    emailNotifications: true,
    birthdayReminders: true,
    anniversaryReminders: true,
  });

  // Password change
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change confirmation
  const [emailConfirmDialog, setEmailConfirmDialog] = useState(false);
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [showEmailPw, setShowEmailPw] = useState(false);

  // Feedback
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadUser = useCallback(async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data);
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
      });
      setOriginalEmail(data.email || '');

      // Load settings
      if (data.settings) {
        setSettings(data.settings);
        setMode(data.settings.theme);
      }
    } catch {
      setSnackbar({ open: true, message: 'Erro ao carregar perfil', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [setMode]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isEmailChanged = formData.email !== originalEmail;

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setSnackbar({ open: true, message: 'Nome e sobrenome são obrigatórios', severity: 'error' });
      return;
    }

    // If email changed, require password confirmation
    if (isEmailChanged) {
      setEmailConfirmDialog(true);
      return;
    }

    await saveProfile();
  };

  const saveProfile = async (passwordForEmail?: string) => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (formData.firstName !== user?.firstName) payload.firstName = formData.firstName.trim();
      if (formData.lastName !== user?.lastName) payload.lastName = formData.lastName.trim();
      if (isEmailChanged) {
        payload.email = formData.email.trim();
        payload.currentPassword = passwordForEmail || '';
      }

      if (Object.keys(payload).length === 0) {
        setSnackbar({ open: true, message: 'Nenhuma alteração detectada', severity: 'error' });
        setSaving(false);
        return;
      }

      const result = await api.updateProfile(payload);

      // Update token seamlessly
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      // Update local user data
      setUser((prev) => (prev ? { ...prev, ...result.user } : prev));
      setOriginalEmail(result.user.email);
      setFormData((prev) => ({
        ...prev,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
      }));

      setSnackbar({ open: true, message: 'Perfil atualizado com sucesso!', severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Erro ao atualizar perfil';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailConfirm = async () => {
    if (!emailConfirmPassword) {
      setSnackbar({ open: true, message: 'Digite sua senha atual', severity: 'error' });
      return;
    }
    setEmailConfirmDialog(false);
    await saveProfile(emailConfirmPassword);
    setEmailConfirmPassword('');
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      setSnackbar({ open: true, message: 'Digite sua senha atual', severity: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setSnackbar({ open: true, message: 'Nova senha deve ter no mínimo 6 caracteres', severity: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSnackbar({ open: true, message: 'As senhas não coincidem', severity: 'error' });
      return;
    }

    setChangingPassword(true);
    try {
      const result = await api.updateProfile({
        currentPassword,
        newPassword,
      });

      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }

      setPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSnackbar({ open: true, message: 'Senha alterada com sucesso!', severity: 'success' });
    } catch (err: any) {
      const msg = err?.message || 'Erro ao alterar senha';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleName = () => {
    if (!user?.companies?.length) return 'Usuário';
    const roles = user.companies.flatMap((c) => c.roles?.map((r) => r.name) || []);
    if (roles.includes('ADMIN')) return 'Administrador';
    if (roles.includes('RH')) return 'Recursos Humanos';
    if (roles.includes('GESTOR')) return 'Gestor';
    return roles[0] || 'Usuário';
  };

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    try {
      await api.updateSettings({ [key]: value });
    } catch {
      setSettings(settings);
      setSnackbar({ open: true, message: 'Erro ao salvar preferência', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Meu Perfil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie suas informações pessoais e preferências
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Left card — Profile summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
              boxShadow: 'none',
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
                fontSize: '2.2rem',
                fontWeight: 700,
                mx: 'auto',
                mb: 2,
                border: '4px solid #e2e8f0',
              }}
            >
              {(formData.firstName?.charAt(0) || 'U').toUpperCase()}
            </Avatar>

            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.3 }}>
              {formData.firstName} {formData.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
              {getRoleName()}
            </Typography>
            <Chip
              label="Ativo"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: '#dcfce7',
                color: '#166534',
              }}
            />

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Mail size={16} color="#64748b" />
                <Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  {formData.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Shield size={16} color="#64748b" />
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  {getRoleName()}
                </Typography>
              </Box>
              {user?.companies?.map((c) => (
                <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Briefcase size={16} color="#64748b" />
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    {c.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right — Edit form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, fontSize: '1rem' }}>
              Informações Pessoais
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nome"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Sobrenome"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="E-mail"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  size="small"
                  helperText={
                    isEmailChanged
                      ? 'Ao alterar o e-mail, será solicitada sua senha atual para confirmação.'
                      : undefined
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={16} color="#94a3b8" />
                        </InputAdornment>
                      ),
                      endAdornment: isEmailChanged ? (
                        <InputAdornment position="end">
                          <AlertTriangle size={16} color="#f59e0b" />
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={loadUser}
                disabled={saving}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  px: 3,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' },
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: 'primary.main',
                  textTransform: 'none',
                  px: 3,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
                }}
              >
                Salvar Alterações
              </Button>
            </Box>
          </Paper>

          {/* Notifications section */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mt: 2.5,
              boxShadow: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Bell size={20} color="#0A1E3D" />
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>
                Notificações
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
              Configure quais notificações deseja receber
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Notificações por E-mail
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Receba atualizações importantes por e-mail
                  </Typography>
                </Box>
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Aniversários
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lembrete de aniversários de colaboradores
                  </Typography>
                </Box>
                <Switch
                  checked={settings.birthdayReminders}
                  onChange={(e) => handleSettingChange('birthdayReminders', e.target.checked)}
                />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Aniversários de Empresa
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lembrete de aniversários de admissão
                  </Typography>
                </Box>
                <Switch
                  checked={settings.anniversaryReminders}
                  onChange={(e) => handleSettingChange('anniversaryReminders', e.target.checked)}
                />
              </Box>
            </Box>
          </Paper>

          {/* Password section */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mt: 2.5,
              boxShadow: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <KeyRound size={20} color="#0A1E3D" />
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>
                Segurança
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.82rem' }}>
              Altere sua senha para manter sua conta segura
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Button
              variant="outlined"
              startIcon={<KeyRound size={16} />}
              onClick={() => setPasswordDialog(true)}
              sx={{
                textTransform: 'none',
                fontSize: '0.85rem',
                px: 3,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover', borderColor: '#cbd5e1' },
              }}
            >
              Alterar Senha
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Email confirmation dialog */}
      <Dialog open={emailConfirmDialog} onClose={() => setEmailConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
          Confirmar alteração de e-mail
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.82rem' }}>
            Você está alterando seu e-mail de <strong>{originalEmail}</strong> para <strong>{formData.email}</strong>.
            Digite sua senha atual para confirmar.
          </Alert>
          <TextField
            fullWidth
            label="Senha atual"
            type={showEmailPw ? 'text' : 'password'}
            value={emailConfirmPassword}
            onChange={(e) => setEmailConfirmPassword(e.target.value)}
            size="small"
            autoFocus
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowEmailPw(!showEmailPw)}>
                      {showEmailPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setEmailConfirmDialog(false); setEmailConfirmPassword(''); }} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEmailConfirm}
            disabled={!emailConfirmPassword}
            sx={{
              bgcolor: 'primary.main',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password change dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
          Alterar Senha
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            fullWidth
            label="Senha atual"
            type={showCurrentPw ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="Nova senha"
            type={showNewPw ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            size="small"
            helperText="Mínimo 6 caracteres"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowNewPw(!showNewPw)}>
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            fullWidth
            label="Confirmar nova senha"
            type={showConfirmPw ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            size="small"
            error={!!confirmPassword && confirmPassword !== newPassword}
            helperText={confirmPassword && confirmPassword !== newPassword ? 'As senhas não coincidem' : undefined}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setPasswordDialog(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={changingPassword || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            startIcon={changingPassword ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={16} />}
            sx={{
              bgcolor: 'primary.main',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' },
            }}
          >
            Alterar Senha
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
