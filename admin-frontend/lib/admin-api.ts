/**
 * Admin API Service — Gerenciamento de Tenants
 */
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3002/api/admin';

// ===================== TYPES =====================

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  trade_name?: string;
  document?: string;
  email: string;
  phone?: string;
  address?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  logo_url?: string;
  database_name: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'INACTIVE';
  max_employees: number;
  max_users: number;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  suspended_at?: string;
  cancelled_at?: string;
  trial_ends_at?: string;
  subscription?: Subscription;
  companies?: TenantCompany[];
  payments?: Payment[];
  admin_notes?: AdminNote[];
  _count?: { companies: number; payments: number };
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';
  price_monthly: number;
  billing_cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED';
  started_at: string;
  current_period_start?: string;
  current_period_end?: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  payment_method?: string;
  reference?: string;
  description?: string;
  paid_at?: string;
  due_date?: string;
  invoice_url?: string;
  created_at: string;
}

export interface TenantCompany {
  id: string;
  tenant_id: string;
  company_name: string;
  company_document?: string;
  is_headquarters: boolean;
  status: string;
  created_at: string;
}

export interface AddCompanyData {
  name: string;
  document?: string;
  admin_email: string;
  phone?: string;
  address?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_headquarters?: boolean;
}

export interface AddCompanyResult {
  message: string;
  companyId: string;
  userId: string;
  isNewUser: boolean;
  adminEmail: string;
  defaultPassword?: string;
}

export interface AdminNote {
  id: string;
  tenant_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface DashboardOverview {
  tenants: { total: number; active: number; trial: number; suspended: number; cancelled: number };
  recent_tenants: Array<Tenant & { subscription: { plan: string; status: string } }>;
  payments: {
    total_received: number;
    month_received: number;
    pending_amount: number;
    pending_count: number;
    overdue_amount: number;
    overdue_count: number;
  };
  subscriptions: Array<{ plan: string; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  max_employees: number;
  max_users: number;
  max_companies: number;
  price_monthly: number;
  price_yearly: number;
  is_trial: boolean;
  trial_days: number;
  features?: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ===================== API SERVICE =====================

class AdminApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const url = `${ADMIN_API_URL}${endpoint}`;
    const token = this.getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let message = `API Error: ${response.statusText}`;
      try {
        const body = await response.json();
        if (body?.message) {
          message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {}

      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }

      throw new Error(message);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // ─── Auth ───
  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const result = await this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.access_token) {
      localStorage.setItem('admin_token', result.access_token);
    }
    return result;
  }

  async getProfile() {
    return this.fetch('/auth/profile');
  }

  logout() {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  }

  // ─── Dashboard ───
  async getDashboard(): Promise<DashboardOverview> {
    return this.fetch('/dashboard');
  }

  // ─── Tenants ───
  async getTenants(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResponse<Tenant>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    return this.fetch(`/tenants?${query.toString()}`);
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.fetch(`/tenants/${id}`);
  }

  async getTenantStats(): Promise<{ total: number; active: number; trial: number; suspended: number; cancelled: number }> {
    return this.fetch('/tenants/stats');
  }

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    return this.fetch('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    return this.fetch(`/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateTenantStatus(id: string, status: string, reason?: string): Promise<Tenant> {
    return this.fetch(`/tenants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  async addTenantNote(tenantId: string, content: string): Promise<AdminNote> {
    return this.fetch(`/tenants/${tenantId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // ─── Tenant Companies ───
  async addCompanyToTenant(tenantId: string, data: AddCompanyData): Promise<AddCompanyResult> {
    return this.fetch(`/tenants/${tenantId}/companies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ─── Subscriptions ───
  async getSubscription(tenantId: string): Promise<Subscription> {
    return this.fetch(`/tenants/${tenantId}/subscription`);
  }

  async updateSubscription(tenantId: string, data: Partial<Subscription>): Promise<Subscription> {
    return this.fetch(`/tenants/${tenantId}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── Payments ───
  async getPayments(tenantId: string, params?: { page?: number; status?: string }): Promise<PaginatedResponse<Payment>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.status) query.set('status', params.status);
    return this.fetch(`/tenants/${tenantId}/payments?${query.toString()}`);
  }

  async createPayment(tenantId: string, data: { amount: number; payment_method?: string; description?: string; due_date?: string }): Promise<Payment> {
    return this.fetch(`/tenants/${tenantId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markPaymentPaid(paymentId: string): Promise<Payment> {
    return this.fetch(`/payments/${paymentId}/pay`, { method: 'PATCH' });
  }

  async cancelPayment(paymentId: string): Promise<Payment> {
    return this.fetch(`/payments/${paymentId}/cancel`, { method: 'PATCH' });
  }

  async getPaymentsSummary() {
    return this.fetch('/payments/summary');
  }

  // ─── Plans ───
  async getPlans(activeOnly?: boolean): Promise<Plan[]> {
    const query = activeOnly ? '?active_only=true' : '';
    return this.fetch(`/plans${query}`);
  }

  async getPlan(id: string): Promise<Plan> {
    return this.fetch(`/plans/${id}`);
  }

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    return this.fetch('/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
    return this.fetch(`/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePlan(id: string): Promise<{ message: string }> {
    return this.fetch(`/plans/${id}`, { method: 'DELETE' });
  }
}

export const adminApi = new AdminApiService();
