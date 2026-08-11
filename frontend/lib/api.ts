// Serviço de API para integração com backend NestJS
import { getTenantHeaders } from './tenant';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const ALL_COMPANIES_OPTION_ID = '__all__';

// Tipos
export interface PaginationMeta {
  total: number;
  skip: number;
  take: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  skip?: number;
  take?: number;
}

export interface Employee {
  id: string;
  person_id: string;
  company_id: string;
  employee_number?: string;
  employee_type?: string;
  hire_date: string;
  termination_date?: string | null;
  termination_reason?: string | null;
  observation?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  person?: {
    id?: string;
    legal_name: string;
    preferred_name?: string | null;
    photo_url?: string | null;
    government_id?: string | null;
    passport?: string | null;
    ssn?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    nationality?: string | null;
    marital_status?: string | null;
    rg_issuer?: string | null;
    rg_state?: string | null;
    rg_issue_date?: string | null;
    cnh_category?: string | null;
    cnh_issue_date?: string | null;
    cnh_expiry_date?: string | null;
    cnh_issuer?: string | null;
    cnh_state?: string | null;
    personal_contact?: Array<{
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postal_code?: string | null;
      personal_email?: string | null;
      corporate_phone?: string | null;
      address_number?: string | null;
    }>;
    emergency_contact?: Array<{
      id?: string;
      name?: string | null;
      phone?: string | null;
      relationship?: string | null;
      email?: string | null;
      phone_secondary?: string | null;
    }>;
    family_info?: {
      id?: string;
      marital_status?: string | null;
      spouse_name?: string | null;
      spouse_birthday?: string | null;
      number_of_dependents?: number | null;
    } | null;
  };
  employee_department?: Array<{
    id?: string;
    department_id?: string;
    department?: {
      id: string;
      name: string;
    };
  }>;
  employee_position?: Array<{
    id?: string;
    position_id?: string;
    position?: {
      id: string;
      name: string;
    };
  }>;
  contract?: Array<{
    id: string;
    contract_type?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    work_hours?: string | null;
    payment_category?: string | null;
    salary?: Array<{
      id?: string;
      amount?: number | null;
      currency?: string | null;
      start_date?: string | null;
    }>;
  }>;
  manager_id?: string | null;
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  maritalStatus: string;
  cpf: string;
  rg?: string;
  photo?: string;
  contacts?: PersonalContact[];
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  parent_department_id?: string | null;
  manager_employee_id?: string | null;
  created_at?: string;
  updated_at?: string;
  company?: { name: string };
  employee_department?: Array<{
    id: string;
    employee?: {
      id: string;
      person?: { legal_name?: string };
    };
  }>;
  employee?: Employee;
  department?: { id: string; name: string };
  other_department?: Department[];
}

export interface PositionLevel {
  id: string;
  company_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Language {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CostCenter {
  id: string;
  company_id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeTypeConfig {
  id: string;
  company_id: string;
  value: string;
  label: string;
  description?: string | null;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ContractTypeConfig {
  id: string;
  company_id: string;
  value: string;
  label: string;
  description?: string | null;
  is_system: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingRequest {
  id: string;
  invite_email: string;
  invite_name?: string | null;
  employee_type_value?: string | null;
  onboarding_plan_id?: string | null;
  token_expires_at: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  public_token?: string | null;
  required_fields?: string[] | null;
  submitted_data?: Record<string, any> | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_employee_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOnboardingRequestPayload {
  invite_email: string;
  invite_name: string;
  employee_type_value?: string;
  expires_in_days?: number;
  required_fields?: string[];
  department_id: string;
  position_id: string;
  manager_employee_id: string;
  onboarding_plan_id: string;
  personal_email: string;
  hire_date: string;
}

export interface OnboardingPlanField {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
}

export interface OnboardingPlan {
  id: string;
  company_id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  fields: OnboardingPlanField[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateOnboardingPlanPayload {
  name: string;
  description?: string;
  fields: OnboardingPlanField[];
  is_active?: boolean;
}

export interface UpdateOnboardingPlanPayload {
  name?: string;
  description?: string;
  fields?: OnboardingPlanField[];
  is_active?: boolean;
}

export interface Position {
  id: string;
  company_id: string;
  name: string;
  position_level_id?: string | null;
  position_level?: PositionLevel | null;
  description?: string | null;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  company?: { name: string };
  employee_position?: Array<{ id: string }>;
  employeeCount?: number;
}

export interface Contract {
  id: string;
  employee_id: string;
  contract_type?: string | null;
  start_date: string;
  end_date?: string | null;
  work_hours?: string | null;
  payment_category?: string | null;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: string;
    employee_number?: string | null;
    company_id?: string;
    person?: {
      legal_name?: string | null;
      photo_url?: string | null;
    } | null;
  };
  salary?: Array<{
    id: string;
    amount?: number | null;
    currency?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  }>;
}

export interface PersonalContact {
  id: string;
  person_id: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_primary: boolean;
}

export interface CreateEmployeePayload {
  person_id: string;
  company_id: string;
  employee_number?: string;
  employee_type?: string;
  hire_date: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  manager_id?: string;
  cost_center_id?: string;
  termination_date?: string;
  termination_reason?: string;
  observation?: string;
}

export interface CreateContractPayload {
  employee_id: string;
  contract_type?: 'INDEFINITE' | 'FIXED_TERM' | 'APPRENTICE' | 'TEMPORARY' | 'EXPERIENCE';
  work_hours?: string;
  payment_category?: 'MONTHLY' | 'HOURLY' | 'COMMISSION';
  start_date: string;
  end_date?: string;
}

export interface CreateEmployeeDepartmentPayload {
  employee_id: string;
  department_id: string;
  start_date: string;
  end_date?: string;
  is_primary?: boolean;
}

export interface CreateEmployeePositionPayload {
  employee_id: string;
  position_id: string;
  start_date: string;
  end_date?: string;
}

export interface CreateEmergencyContactPayload {
  person_id: string;
  name: string;
  relationship?: string;
  phone: string;
  phone_secondary?: string;
  email?: string;
  is_primary?: boolean;
}

export interface CreateFamilyInfoPayload {
  person_id: string;
  marital_status?: string;
  spouse_name?: string;
  spouse_birthday?: string;
  number_of_dependents?: number;
}

export interface CreateSalaryPayload {
  contract_id: string;
  amount: number;
  currency?: string;
  start_date: string;
  end_date?: string;
}

export interface DashboardOverview {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  totalContracts: number;
  hiredThisMonth: number;
  terminatedThisMonth: number;
  birthdaysThisMonth: { id: string; name: string; photo?: string | null; date: string }[];
  headcountEvolution: { month: string; year: number; count: number }[];
  recentHires: { id: string; name: string; photo?: string | null; hireDate: string; department?: string | null; position?: string | null }[];
  contractsExpiringSoon: { id: string; employeeName: string; endDate: string; contractType?: string | null }[];
  departmentDistribution: { name: string; count: number }[];
  employeeTypeDistribution: { type: string; count: number }[];
}

export interface CustomColors {
  primary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  surfaceAlt?: string;
  muted?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  birthdayReminders: boolean;
  anniversaryReminders: boolean;
  customColors?: CustomColors | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  settings?: UserSettings;
  companies: Company[];
}

export interface Company {
  id: number | string;
  name: string;
  logo?: string;
  document?: string;
  phone?: string;
  address?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  status?: string;
  roles?: Array<{
    id: string;
    name: string;
    description?: string;
    permissions?: Array<{
      resource: string;
      action: string;
    }>;
  }>;
}

export interface PersonRecord {
  id: string;
  legal_name: string;
  photo_url?: string;
  date_of_birth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  nationality?: string;
  marital_status?: string;
  government_id?: string;
  passport?: string;
  rg_issuer?: string;
  rg_state?: string;
  rg_issue_date?: string;
  ssn?: string;
  cnh_category?: string;
  cnh_issue_date?: string;
  cnh_expiry_date?: string;
  cnh_issuer?: string;
  cnh_state?: string;
  personal_contact?: Array<{
    email?: string;
    personal_email?: string;
    phone?: string;
    corporate_phone?: string;
    address?: string;
    address_number?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    is_primary?: boolean;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface PersonPayload {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  government_id: string;
  marital_status?: string;
  mother_name?: string;
  ethnicity?: string;
  pis?: string;
  education_level?: string;
  has_food_intolerance?: boolean;
  food_intolerance?: string;
  has_medication_allergy?: boolean;
  medication_allergy?: string;
  rg?: string;
  rg_issuer?: string;
  rg_state?: string;
  rg_issue_date?: string;
  cnh?: string;
  cnh_category?: string;
  cnh_issue_date?: string;
  cnh_expiry_date?: string;
  cnh_issuer?: string;
  cnh_state?: string;
  photo_url?: string | null;
  contact?: {
    email?: string;
    personal_email?: string;
    phone?: string;
    corporate_phone?: string;
    address?: string;
    address_number?: string;
    address_complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
}

// Funções de API
class ApiService {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getSelectedCompanyId(): string | null {
    if (typeof window !== 'undefined') {
      const selectedId = localStorage.getItem('selected_company_id');
      if (selectedId) {
        if (selectedId === ALL_COMPANIES_OPTION_ID) {
          return null;
        }
        return selectedId;
      }
      // Fallback: tenta pegar do current_company se existir
      const currentCompany = localStorage.getItem('current_company');
      if (currentCompany) {
        try {
          const company = JSON.parse(currentCompany);
          return company.id?.toString();
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  private async fetch<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const companyId = this.getSelectedCompanyId();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'x-company-id': companyId }),
        ...getTenantHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let responseMessage = `API Error: ${response.statusText}`;

      try {
        const errorBody = await response.json();
        const message = errorBody?.message;
        if (Array.isArray(message)) {
          responseMessage = message.join(', ');
        } else if (typeof message === 'string' && message.trim().length > 0) {
          responseMessage = message;
        }
      } catch {
        // resposta sem JSON, mantém statusText
      }

      const isLoginRequest = endpoint === '/auth/login';

      if (response.status === 401 && !isLoginRequest) {
        // Token expirado ou inválido em rota autenticada
        if (typeof window !== 'undefined' && token) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }

      throw new Error(responseMessage);
    }

    return response.json();
  }

  private listFromResponse<T>(response: T[] | { data?: T[] } | null | undefined): T[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }

  private async fetchList<T>(endpoint: string, options?: RequestInit): Promise<T[]> {
    const response = await this.fetch<T[] | { data?: T[] }>(endpoint, options);
    return this.listFromResponse<T>(response);
  }

  private query(params?: object): string {
    if (!params) return '';
    const query = new URLSearchParams();
    Object.entries(params as Record<string, string | number | boolean | null | undefined>).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });
    const value = query.toString();
    return value ? `?${value}` : '';
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User; companies: Company[] }> {
    return this.fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { email: string; password: string; username: string }): Promise<User> {
    return this.fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.fetch('/auth/me');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<{ token: string; user: { id: string; email: string; firstName: string; lastName: string } }> {
    return this.fetch('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getSettings(): Promise<UserSettings> {
    return this.fetch('/auth/settings');
  }

  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    return this.fetch('/auth/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Employees
  async getEmployees(params?: PaginationParams): Promise<Employee[]> {
    return this.fetchList<Employee>(`/employees${this.query(params)}`);
  }

  async getEmployee(id: string): Promise<Employee> {
    return this.fetch(`/employees/${id}`);
  }

  async createEmployee(data: CreateEmployeePayload): Promise<Employee> {
    return this.fetch('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: Partial<CreateEmployeePayload>): Promise<Employee> {
    return this.fetch(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    return this.fetch(`/employees/${id}`, { method: 'DELETE' });
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return this.fetchList<Department>('/departments');
  }

  async getDepartment(id: string): Promise<Department> {
    return this.fetch(`/departments/${id}`);
  }

  async getDepartmentEmployees(id: string): Promise<Employee[]> {
    return this.fetchList<Employee>(`/departments/${id}/employees`);
  }

  async createDepartment(data: { name: string; company_id?: string; color?: string; parent_department_id?: string | null; manager_employee_id?: string | null }): Promise<Department> {
    return this.fetch('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: { name?: string; color?: string; parent_department_id?: string | null; manager_employee_id?: string | null }): Promise<Department> {
    return this.fetch(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: string): Promise<void> {
    return this.fetch(`/departments/${id}`, { method: 'DELETE' });
  }

  // Positions
  async getPositions(search?: string): Promise<Position[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.fetchList<Position>(`/positions${params}`);
  }

  async getPosition(id: string): Promise<Position> {
    return this.fetch(`/positions/${id}`);
  }

  async createPosition(data: { name: string; description?: string; position_level_id?: string | null }): Promise<Position> {
    return this.fetch('/positions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePosition(id: string, data: { name?: string; description?: string; position_level_id?: string | null }): Promise<Position> {
    return this.fetch(`/positions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePosition(id: string): Promise<void> {
    return this.fetch(`/positions/${id}`, { method: 'DELETE' });
  }

  // Position Levels
  async getPositionLevels(): Promise<PositionLevel[]> {
    return this.fetchList<PositionLevel>('/position-levels');
  }

  async createPositionLevel(data: { name: string }): Promise<PositionLevel> {
    return this.fetch('/position-levels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePositionLevel(id: string, data: { name?: string }): Promise<PositionLevel> {
    return this.fetch(`/position-levels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePositionLevel(id: string): Promise<void> {
    return this.fetch(`/position-levels/${id}`, { method: 'DELETE' });
  }

  // Languages
  async getLanguages(): Promise<Language[]> {
    return this.fetchList<Language>('/languages');
  }

  async createLanguage(data: { name: string }): Promise<Language> {
    return this.fetch('/languages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLanguage(id: string, data: { name?: string }): Promise<Language> {
    return this.fetch(`/languages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLanguage(id: string): Promise<void> {
    return this.fetch(`/languages/${id}`, { method: 'DELETE' });
  }

  // Skills
  async getSkills(): Promise<Skill[]> {
    return this.fetchList<Skill>('/skills');
  }

  async createSkill(data: { name: string; category?: string }): Promise<Skill> {
    return this.fetch('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSkill(id: string, data: { name?: string; category?: string }): Promise<Skill> {
    return this.fetch(`/skills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSkill(id: string): Promise<void> {
    return this.fetch(`/skills/${id}`, { method: 'DELETE' });
  }

  // Cost Centers
  async getCostCenters(): Promise<CostCenter[]> {
    return this.fetchList<CostCenter>('/cost-centers');
  }

  async createCostCenter(data: { name: string; code?: string; description?: string }): Promise<CostCenter> {
    return this.fetch('/cost-centers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCostCenter(id: string, data: { name?: string; code?: string; description?: string }): Promise<CostCenter> {
    return this.fetch(`/cost-centers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCostCenter(id: string): Promise<void> {
    return this.fetch(`/cost-centers/${id}`, { method: 'DELETE' });
  }

  // Employee Languages
  async createEmployeeLanguage(data: { employee_id: string; language_id: string; proficiency_level?: string }): Promise<any> {
    return this.fetch('/employee-languages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployeeLanguage(id: string, data: { language_id?: string; proficiency_level?: string }): Promise<any> {
    return this.fetch(`/employee-languages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployeeLanguage(id: string): Promise<void> {
    return this.fetch(`/employee-languages/${id}`, { method: 'DELETE' });
  }

  // Employee Skills
  async createEmployeeSkill(data: { employee_id: string; skill_id: string; proficiency_level?: number }): Promise<any> {
    return this.fetch('/employee-skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployeeSkill(id: string, data: { skill_id?: string; proficiency_level?: number }): Promise<any> {
    return this.fetch(`/employee-skills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployeeSkill(id: string): Promise<void> {
    return this.fetch(`/employee-skills/${id}`, { method: 'DELETE' });
  }

  // Contracts
  async getContracts(params?: PaginationParams): Promise<Contract[]> {
    return this.fetchList<Contract>(`/contracts${this.query(params)}`);
  }

  async getContract(id: string): Promise<Contract> {
    return this.fetch(`/contracts/${id}`);
  }

  async createContract(data: CreateContractPayload): Promise<Contract> {
    return this.fetch('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    return this.fetch(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContract(id: string): Promise<void> {
    return this.fetch(`/contracts/${id}`, { method: 'DELETE' });
  }

  async createEmployeeDepartment(data: CreateEmployeeDepartmentPayload): Promise<any> {
    return this.fetch('/employee-departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployeeDepartment(id: string, data: Partial<CreateEmployeeDepartmentPayload>): Promise<any> {
    return this.fetch(`/employee-departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createEmployeePosition(data: CreateEmployeePositionPayload): Promise<any> {
    return this.fetch('/employee-position', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployeePosition(id: string, data: Partial<CreateEmployeePositionPayload>): Promise<any> {
    return this.fetch(`/employee-position/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createEmergencyContact(data: CreateEmergencyContactPayload): Promise<any> {
    return this.fetch('/emergency-contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmergencyContact(id: string, data: Partial<CreateEmergencyContactPayload>): Promise<any> {
    return this.fetch(`/emergency-contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmergencyContact(id: string): Promise<any> {
    return this.fetch(`/emergency-contact/${id}`, {
      method: 'DELETE',
    });
  }

  async createFamilyInfo(data: CreateFamilyInfoPayload): Promise<any> {
    return this.fetch('/family-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFamilyInfo(id: string, data: Partial<CreateFamilyInfoPayload>): Promise<any> {
    return this.fetch(`/family-info/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async createSalary(data: CreateSalaryPayload): Promise<any> {
    return this.fetch('/salaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSalary(id: string, data: Partial<CreateSalaryPayload>): Promise<any> {
    return this.fetch(`/salaries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardOverview(companyId: number): Promise<DashboardOverview> {
    return this.fetch(`/dashboard/company/${companyId}/overview`);
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return this.fetchList<Company>('/companies');
  }

  async getAllCompaniesForAdmin(): Promise<Company[]> {
    return this.fetchList<Company>('/companies?scope=all');
  }

  async getCompany(id: string): Promise<Company> {
    return this.fetch(`/companies/${id}`);
  }

  async createCompany(data: Partial<Company>): Promise<Company> {
    return this.fetch('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    return this.fetch(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id: string): Promise<void> {
    return this.fetch(`/companies/${id}`, { method: 'DELETE' });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.fetchList<User>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.fetch(`/users/${id}`);
  }

  async createUser(data: Partial<User> & { password: string }): Promise<User> {
    return this.fetch('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.fetch(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.fetch(`/users/${id}`, { method: 'DELETE' });
  }

  // Persons
  async getPersons(): Promise<PersonRecord[]> {
    return this.fetchList<PersonRecord>('/persons');
  }

  async getPerson(id: string): Promise<PersonRecord> {
    return this.fetch(`/persons/${id}`);
  }

  async createPerson(data: PersonPayload): Promise<PersonRecord> {
    return this.fetch('/persons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePerson(id: string, data: Partial<PersonPayload>): Promise<PersonRecord> {
    return this.fetch(`/persons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async uploadProfileImage(file: File): Promise<{ path: string; filename: string }> {
    const url = `${API_BASE_URL}/upload/profile`;
    const token = this.getToken();
    const companyId = this.getSelectedCompanyId();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'x-company-id': companyId }),
        ...getTenantHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload da imagem');
    }

    return response.json();
  }

  // Employee Type Configs
  async getEmployeeTypeConfigs(): Promise<EmployeeTypeConfig[]> {
    return this.fetchList<EmployeeTypeConfig>('/employee-type-configs');
  }

  async createEmployeeTypeConfig(data: { value: string; label: string; description?: string }): Promise<EmployeeTypeConfig> {
    return this.fetch('/employee-type-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployeeTypeConfig(id: string, data: { value?: string; label?: string; description?: string }): Promise<EmployeeTypeConfig> {
    return this.fetch(`/employee-type-configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployeeTypeConfig(id: string): Promise<void> {
    return this.fetch(`/employee-type-configs/${id}`, { method: 'DELETE' });
  }

  // Contract Type Configs
  async getContractTypeConfigs(): Promise<ContractTypeConfig[]> {
    return this.fetchList<ContractTypeConfig>('/contract-type-configs');
  }

  async createContractTypeConfig(data: { value: string; label: string; description?: string }): Promise<ContractTypeConfig> {
    return this.fetch('/contract-type-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContractTypeConfig(id: string, data: { value?: string; label?: string; description?: string }): Promise<ContractTypeConfig> {
    return this.fetch(`/contract-type-configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContractTypeConfig(id: string): Promise<void> {
    return this.fetch(`/contract-type-configs/${id}`, { method: 'DELETE' });
  }

  // Onboarding
  async getOnboardingRequests(): Promise<OnboardingRequest[]> {
    return this.fetchList<OnboardingRequest>('/onboarding');
  }

  async getOnboardingPlans(): Promise<OnboardingPlan[]> {
    return this.fetchList<OnboardingPlan>('/onboarding/plans');
  }

  async createOnboardingPlan(data: CreateOnboardingPlanPayload): Promise<OnboardingPlan> {
    return this.fetch('/onboarding/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOnboardingPlan(id: string, data: UpdateOnboardingPlanPayload): Promise<OnboardingPlan> {
    return this.fetch(`/onboarding/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteOnboardingPlan(id: string): Promise<{ deleted: boolean }> {
    return this.fetch(`/onboarding/plans/${id}`, {
      method: 'DELETE',
    });
  }

  async createOnboardingRequest(data: CreateOnboardingRequestPayload): Promise<OnboardingRequest & { token: string; invite_path: string }> {
    return this.fetch('/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveOnboardingRequest(id: string): Promise<{ approved: boolean; employee_id: string }> {
    return this.fetch(`/onboarding/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async rejectOnboardingRequest(id: string, review_notes?: string): Promise<{ rejected: boolean }> {
    return this.fetch(`/onboarding/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ review_notes }),
    });
  }

  async getOnboardingInviteLink(id: string): Promise<{ token: string; invite_path: string; token_expires_at: string }> {
    return this.fetch(`/onboarding/${id}/link`);
  }

  async cancelOnboardingRequest(id: string): Promise<{ deleted: boolean }> {
    return this.fetch(`/onboarding/${id}`, {
      method: 'DELETE',
    });
  }

  // Employee Import/Export
  async downloadEmployeeTemplate(): Promise<Blob> {
    const url = `${API_BASE_URL}/employees/template`;
    const token = this.getToken();
    const companyId = this.getSelectedCompanyId();
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'x-company-id': companyId }),
        ...getTenantHeaders(),
      },
    });
    if (!response.ok) throw new Error('Erro ao baixar template');
    return response.blob();
  }

  async exportEmployees(): Promise<Blob> {
    const url = `${API_BASE_URL}/employees/export`;
    const token = this.getToken();
    const companyId = this.getSelectedCompanyId();
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'x-company-id': companyId }),
        ...getTenantHeaders(),
      },
    });
    if (!response.ok) throw new Error('Erro ao exportar colaboradores');
    return response.blob();
  }

  async validateEmployeeImport(file: File): Promise<any> {
    const url = `${API_BASE_URL}/employees/import/validate`;
    const token = this.getToken();
    const companyId = this.getSelectedCompanyId();
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'x-company-id': companyId }),
        ...getTenantHeaders(),
      },
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message || 'Erro ao validar arquivo');
    }
    return response.json();
  }

  async importEmployees(file: File): Promise<any> {
    const url = `${API_BASE_URL}/employees/import`;
    const token = this.getToken();
    const companyId = this.getSelectedCompanyId();
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'x-company-id': companyId }),
        ...getTenantHeaders(),
      },
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.message || 'Erro ao importar colaboradores');
    }
    return response.json();
  }
}

export const api = new ApiService();
