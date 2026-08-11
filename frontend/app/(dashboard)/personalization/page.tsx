'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Palette, Check, Save, Sun, Moon } from 'lucide-react';
import { api, CustomColors } from '@/lib/api';
import { useTheme, buildBrand } from '@/components/providers/ThemeProvider';

// ─── Temas pré-definidos ─────────────────────────────────────────────
const PRESET_THEMES: { name: string; description: string; colors: CustomColors; preview: [string, string] }[] = [
  {
    name: 'Lume Padrão',
    description: 'Azul marinho e dourado — a identidade Lume',
    colors: {},
    preview: ['#0A1E3D', '#D4A84B'],
  },
  {
    name: 'Grafite',
    description: 'Tons neutros de cinza com destaque sóbrio',
    colors: { primary: '#37474F', accent: '#78909C', background: '#F5F6F7', surfaceAlt: '#ECEFF1', muted: '#CFD8DC' },
    preview: ['#37474F', '#78909C'],
  },
  {
    name: 'Oceano',
    description: 'Azul profundo com toque de água-marinha',
    colors: { primary: '#1A3A5C', accent: '#5B9BAD', background: '#F5F7FA', surfaceAlt: '#E8EFF5', muted: '#D6E0EA' },
    preview: ['#1A3A5C', '#5B9BAD'],
  },
  {
    name: 'Ardósia',
    description: 'Cinza escuro elegante com bronze suave',
    colors: { primary: '#2F3E46', accent: '#A68B6B', background: '#F7F7F6', surfaceAlt: '#EDECE9', muted: '#DDD9D4' },
    preview: ['#2F3E46', '#A68B6B'],
  },
  {
    name: 'Bosque',
    description: 'Verde escuro refinado com terra quente',
    colors: { primary: '#2D4739', accent: '#8B9D77', background: '#F6F7F5', surfaceAlt: '#E9EDE7', muted: '#D6DFCE' },
    preview: ['#2D4739', '#8B9D77'],
  },
  {
    name: 'Noturno',
    description: 'Carvão intenso com detalhes em aço',
    colors: { primary: '#1E272E', accent: '#607D8B', background: '#F4F5F6', surfaceAlt: '#EAECEE', muted: '#D1D5D9' },
    preview: ['#1E272E', '#607D8B'],
  },
];

// ─── Preview Card ────────────────────────────────────────────────────
function ThemePreview({ colors }: { colors: CustomColors | null }) {
  const b = buildBrand(colors);
  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        width: '100%',
        height: 140,
        display: 'flex',
      }}
    >
      {/* Sidebar preview */}
      <Box sx={{ width: 60, bgcolor: b.primary, p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.15)', mx: 'auto' }} />
        <Box sx={{ width: '80%', height: 6, borderRadius: 1, bgcolor: `${b.accent}60`, mx: 'auto', mt: 1 }} />
        <Box sx={{ width: '60%', height: 6, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.15)', mx: 'auto' }} />
        <Box sx={{ width: '70%', height: 6, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.15)', mx: 'auto' }} />
      </Box>
      {/* Content area preview */}
      <Box sx={{ flex: 1, bgcolor: b.background, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ width: 60, height: 8, borderRadius: 1, bgcolor: b.primary }} />
          <Box sx={{ ml: 'auto', width: 40, height: 16, borderRadius: 1, bgcolor: b.accent, opacity: 0.85 }} />
        </Box>
        <Box sx={{ flex: 1, bgcolor: b.surface, borderRadius: 1, border: '1px solid', borderColor: b.muted, p: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ flex: 1, height: 6, borderRadius: 0.5, bgcolor: b.surfaceAlt }} />
            ))}
          </Box>
          <Divider sx={{ my: 0.75 }} />
          {[1, 2].map(i => (
            <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: b.primary, opacity: 0.2, flexShrink: 0 }} />
              <Box sx={{ flex: 1, height: 6, borderRadius: 0.5, bgcolor: b.muted }} />
              <Box sx={{ width: 30, height: 12, borderRadius: 0.5, bgcolor: b.surfaceAlt }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { mode, setMode, customColors, setCustomColors } = useTheme();
  const [draft, setDraft] = useState<CustomColors>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSettings();
        const colors = (settings.customColors as CustomColors) || {};
        setDraft(colors);
        setCustomColors(Object.keys(colors).length > 0 ? colors : null);
      } catch {
        // If not authenticated, just use local
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reference to what's currently saved/applied
  const [savedColors, setSavedColors] = useState<CustomColors>({});

  // Sync savedColors when customColors loads from backend
  useEffect(() => {
    setSavedColors(customColors || {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presets only update the draft — preview only, no global change
  const applyPreset = useCallback((colors: CustomColors) => {
    setDraft(colors);
  }, []);

  const handleToggleMode = useCallback(async (newMode: 'light' | 'dark') => {
    setMode(newMode);
    try {
      await api.updateSettings({ theme: newMode });
    } catch {
      setMode(mode);
      setSnackbar({ open: true, message: 'Erro ao salvar preferência', severity: 'error' });
    }
  }, [mode, setMode]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const cleaned = Object.keys(draft).length > 0 ? draft : null;
      setCustomColors(cleaned);
      setSavedColors(draft);
      await api.updateSettings({ customColors: cleaned });
      setSnackbar({ open: true, message: 'Tema salvo com sucesso!', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erro ao salvar tema', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }, [draft, setCustomColors]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(savedColors);

  if (loading) {
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
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Personalização
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ajuste a aparência do sistema ao seu gosto
        </Typography>
      </Box>

      {/* Dark / Light mode */}
      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {mode === 'dark' ? <Moon size={18} color="white" /> : <Sun size={18} color="white" />}
          </Box>
          <Typography variant="h6" fontWeight={600}>
            Modo de Exibição
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Alterne entre o modo claro e escuro para maior conforto visual
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {[
            { key: 'light' as const, label: 'Claro', icon: Sun, desc: 'Fundo branco, ideal para ambientes claros' },
            { key: 'dark' as const, label: 'Escuro', icon: Moon, desc: 'Fundo escuro, reduz cansaço ocular' },
          ].map((opt) => {
            const isActive = mode === opt.key;
            return (
              <Box
                key={opt.key}
                onClick={() => handleToggleMode(opt.key)}
                sx={{
                  flex: 1,
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: isActive ? 'secondary.main' : 'divider',
                  p: 2,
                  transition: 'all 0.2s',
                  position: 'relative',
                  bgcolor: isActive ? 'rgba(212,168,75,0.06)' : 'transparent',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <opt.icon size={20} />
                  <Typography variant="body2" fontWeight={600}>{opt.label}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {opt.desc}
                </Typography>
                {isActive && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Check size={14} color="#D4A84B" />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left column — Presets */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette size={18} color="white" />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                Temas Pré-definidos
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Selecione um tema e visualize antes de salvar
            </Typography>
            <Grid container spacing={1.5}>
              {PRESET_THEMES.map((preset) => {
                const isSelected =
                  (Object.keys(draft).length === 0 && Object.keys(preset.colors).length === 0) ||
                  JSON.stringify(draft) === JSON.stringify(preset.colors);
                return (
                  <Grid size={{ xs: 6, sm: 4 }} key={preset.name}>
                    <Box
                      onClick={() => applyPreset(preset.colors)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: isSelected ? 'secondary.main' : 'divider',
                        p: 1.5,
                        transition: 'all 0.2s',
                        position: 'relative',
                        bgcolor: isSelected ? 'rgba(212,168,75,0.06)' : 'transparent',
                        '&:hover': {
                          borderColor: 'secondary.main',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: preset.preview[0] }} />
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: preset.preview[1] }} />
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        {preset.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
                        {preset.description}
                      </Typography>
                      {isSelected && (
                        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                          <Check size={14} color="#D4A84B" />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {hasChanges && (
              <Alert severity="info" sx={{ mt: 2.5, borderRadius: 1.5, py: 0.5 }}>
                Pré-visualização ativa. Clique em <strong>Salvar Tema</strong> para aplicar ao sistema.
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Right column — Live Preview */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none', position: 'sticky', top: 24 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Pré-visualização
            </Typography>
            <ThemePreview colors={Object.keys(draft).length > 0 ? draft : null} />

            {hasChanges && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setDraft(savedColors)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Descartar alterações
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save size={14} />}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Salvar Tema
                </Button>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.8rem' }}>
              {hasChanges
                ? 'Você está vendo uma pré-visualização. Salve para aplicar as cores ao sistema.'
                : 'As cores atuais estão aplicadas em todo o sistema — painel lateral, botões, cabeçalhos de tabela e demais componentes.'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

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
