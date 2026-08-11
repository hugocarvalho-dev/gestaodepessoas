'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Box, Typography, IconButton } from '@mui/material';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { setSelectedCompanyId } from '@/lib/company-context';
import { LumeLogo } from '@/components/brand/LumeLogo';

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
      const response = await api.login(email, password);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      if (response.companies && response.companies.length > 0) {
        const selectedCompany = response.companies[0];
        localStorage.setItem('current_company', JSON.stringify(selectedCompany));
        localStorage.setItem('companies', JSON.stringify(response.companies));
        setSelectedCompanyId((selectedCompany.id as any).toString());
      }
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
          <Box sx={{ mb: 3.5 }}>
            <LumeLogo variant="full" size="md" />
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
            Bem-vindo de volta
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 3 }}>
            Acesse sua conta para gerenciar pessoas e organizações.
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
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </Box>

              {/* Password */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography component="label" sx={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                    Senha
                  </Typography>
                  <Typography
                    component="button"
                    sx={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#D4A84B',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      '&:hover': { color: '#C49A3A' },
                    }}
                  >
                    Esqueceu a senha?
                  </Typography>
                </Box>
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

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 2 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
            <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>ou</Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
          </Box>

          {/* Google Button */}
          <button
            type="button"
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 10,
              border: '1px solid rgba(10,30,61,0.12)',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'; }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continuar com Google
          </button>

          {/* Footer */}
          <Typography sx={{ textAlign: 'center', mt: 3, fontSize: 12, color: '#9CA3AF' }}>
            Ainda não tem conta?{' '}
            <Typography
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#D4A84B',
                cursor: 'pointer',
                '&:hover': { color: '#C49A3A' },
              }}
            >
              Solicitar acesso
            </Typography>
          </Typography>
        </Box>
      </Box>

      {/* Right — Image */}
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
          }}
        >
          <Image
            src="/login-bg.png"
            alt="Equipe colaborando"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          {/* Gradient overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(10,30,61,0.3) 0%, rgba(10,30,61,0.7) 100%)',
            }}
          />
          {/* Bottom card */}
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
              <LumeLogo variant="full" size="sm" darkBg />
              <Typography
                sx={{
                  mt: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#FFFFFF',
                  lineHeight: 1.6,
                }}
              >
                &ldquo;Clareza para gerir pessoas e organizações&rdquo;
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                SaaS estratégico para gestão de pessoas
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
