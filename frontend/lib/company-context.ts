// Utilitário para gerenciar empresa selecionada
const SELECTED_COMPANY_KEY = 'selected_company_id';

export function setSelectedCompanyId(companyId: string | null) {
  if (typeof window !== 'undefined') {
    if (companyId) {
      localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
    } else {
      localStorage.removeItem(SELECTED_COMPANY_KEY);
    }
  }
}

export function getSelectedCompanyId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SELECTED_COMPANY_KEY);
  }
  return null;
}

export function useSelectedCompanyId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SELECTED_COMPANY_KEY);
  }
  return null;
}
