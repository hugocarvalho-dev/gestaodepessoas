'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook que monitora mudanças da empresa selecionada no localStorage
 * Sincroniza em tempo real entre abas/páginas usando eventos storage
 */
export function useCompanyContext() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega valor inicial do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('selected_company_id');
      setSelectedCompanyId(stored && stored !== '__all__' ? stored : null);
    } catch (e) {
      console.error('Error reading company from localStorage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincroniza com outras abas/janelas quando localStorage muda
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selected_company_id') {
        setSelectedCompanyId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateCompanyId = useCallback((companyId: string | null) => {
    if (companyId) {
      localStorage.setItem('selected_company_id', companyId);
      setSelectedCompanyId(companyId);
    } else {
      localStorage.removeItem('selected_company_id');
      setSelectedCompanyId(null);
    }
  }, []);

  return {
    selectedCompanyId,
    isLoading,
    updateCompanyId,
  };
}
