'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import { api, Company } from '@/lib/api';
import { getSelectedCompanyId, setSelectedCompanyId } from '@/lib/company-context';

export function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      const user = await api.getCurrentUser();
      const hasSuperAdminRole = (user.companies || []).some((company) =>
        (company.roles || []).some((role) =>
          ['SUPER_ADMIN', 'Super Admin', 'SUPERADMIN', 'SuperAdmin'].includes(role.name),
        ),
      );

      const userCompanies = hasSuperAdminRole
        ? await api.getAllCompaniesForAdmin()
        : user.companies || [];

      setCompanies(userCompanies);
      
      // Salvar no localStorage para fallback
      if (userCompanies.length > 0) {
        localStorage.setItem('companies', JSON.stringify(userCompanies));
      }
      
      const stored = getSelectedCompanyId();
      if (stored) {
        setSelectedId(stored);
      } else if (userCompanies.length > 0) {
        const firstId = (userCompanies[0].id as any).toString();
        setSelectedId(firstId);
        setSelectedCompanyId(firstId);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      
      // Fallback: tentar carregar do localStorage
      const storageCompanies = localStorage.getItem('companies');
      if (storageCompanies) {
        try {
          const parsed = JSON.parse(storageCompanies);
          setCompanies(parsed);
          
          const stored = getSelectedCompanyId();
          if (!stored && parsed.length > 0) {
            const firstId = (parsed[0].id as any).toString();
            setSelectedId(firstId);
            setSelectedCompanyId(firstId);
          } else if (stored) {
            setSelectedId(stored);
          }
        } catch (e) {
          console.error('Error parsing companies from storage:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newId: string) => {
    setSelectedId(newId);
    setSelectedCompanyId(newId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="caption">Carregando...</Typography>
      </Box>
    );
  }

  return (
    <FormControl sx={{ minWidth: 250 }} size="small">
      <InputLabel sx={{ fontSize: '0.875rem' }}>Selecione a Empresa</InputLabel>
      <Select
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
        label="Selecione a Empresa"
        sx={{
          fontSize: '0.875rem',
          bgcolor: 'white',
        }}
      >
        {companies.map((company) => (
          <MenuItem key={(company.id as any).toString()} value={(company.id as any).toString()}>
            {company.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
