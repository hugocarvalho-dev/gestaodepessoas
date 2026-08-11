'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, IconButton } from '@mui/material';
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Informe seu e-mail');
      return;
    }
    if (!password) {
      setError('Informe sua senha');
      return;
    }

    setLoading(true);

    try {
      await adminApi.login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(10,30,61,0.12)',
    backgroundColor: '#ffffff',
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#D4A84B';
    e.target.style.boxShadow = '0 0 0 3px rgba(212,168,75,0.15)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(10,30,61,0.12)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Left — Form */}
      <Box
        sx={{
          width: { xs: '100%', lg: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 3, md: 4 },
          bgcolor: '#ffffff',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 380,
            animation: 'fadeInUp 0.5s ease-out',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(20px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width={40} height={40} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="80" height="80" rx="18" fill="#0A1E3D" />
              <rect x="20" y="20" width="28" height="28" rx="4" fill="#1A3A5C" />
              <rect x="32" y="32" width="28" height="28" rx="4" fill="url(#lume-login-grad)" />
              <rect x="32" y="32" width="16" height="16" rx="3" fill="#FFFFFF" opacity="0.2" />
              <rect x="22" y="22" width="8" height="8" rx="2" fill="#D4A84B" opacity="0.6" />
              <defs>
                <linearGradient id="lume-login-grad" x1="32" y1="32" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#E8C468" />
                  <stop offset="1" stopColor="#D4A84B" />
                </linearGradient>
              </defs>
            </svg>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#0A1E3D',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2,
                }}
              >
                Lume
              </Typography>
              <Typography
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 8.64,
                  fontWeight: 400,
                  color: '#C0C5CC',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                }}
              >
                Painel Administrativo
              </Typography>
            </Box>
          </Box>

          {/* Heading */}
          <Typography
            sx={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#0A1E3D',
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            Painel Admin
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 3 }}>
            Acesse o painel de gerenciamento multi-tenant.
          </Typography>

          {/* Error */}
          {error && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                bgcolor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
              }}
            >
              <Typography sx={{ color: '#dc2626', fontSize: 13 }}>{error}</Typography>
            </Box>
          )}

          {/* Form */}
          <form noValidate onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Email */}
              <Box>
                <Typography
                  component="label"
                  sx={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', mb: 0.5 }}
                >
                  E-mail
                </Typography>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gestao.com"
                  required
                  disabled={loading}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </Box>

              {/* Password */}
              <Box>
                <Typography component="label" sx={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', mb: 0.5 }}>
                  Senha
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    style={{ ...inputStyle, paddingRight: 42 }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9CA3AF',
                      '&:hover': { color: '#6B7280' },
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </IconButton>
                </Box>
              </Box>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 10,
                  backgroundColor: '#0A1E3D',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(10,30,61,0.2)',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1A3A5C';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#0A1E3D';
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </Box>
          </form>
        </Box>
      </Box>

      {/* Right — Decorative Panel */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: '50%',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            m: 1.5,
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0A1E3D 0%, #1A3A5C 50%, #0A1E3D 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(212,168,75,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(212,168,75,0.1) 0%, transparent 50%)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 24,
              left: 24,
              right: 24,
            }}
          >
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                borderRadius: '14px',
                p: 2.5,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Shield size={18} color="#D4A84B" />
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                  Painel Administrativo
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.6,
                }}
              >
                &ldquo;Gerenciamento centralizado de clientes, planos e licenças&rdquo;
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Lume — Sistema Multi-Tenant
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
