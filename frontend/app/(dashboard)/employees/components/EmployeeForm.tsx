'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanyContext } from '@/lib/hooks/useCompanyContext';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { AlertCircle, ArrowLeft, Briefcase, Camera, DollarSign, FileText, Globe, Heart, Phone, Plus, Save, Trash2, User, MessageSquare, User2, UserCircle } from 'lucide-react';
import { api, Company, Language, Skill, CostCenter, EmployeeTypeConfig, ContractTypeConfig } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';

type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
type Gender = '' | 'MALE' | 'FEMALE' | 'OTHER';
type Ethnicity = '' | 'BRANCA' | 'PRETA' | 'PARDA' | 'AMARELA' | 'INDIGENA' | 'NAO_DECLARADA';
type EducationLevel = '' | 'FUNDAMENTAL_INCOMPLETO' | 'FUNDAMENTAL_COMPLETO' | 'MEDIO_INCOMPLETO' | 'MEDIO_COMPLETO' | 'SUPERIOR_INCOMPLETO' | 'SUPERIOR_COMPLETO' | 'POS_GRADUACAO' | 'MESTRADO' | 'DOUTORADO' | 'PHD';

interface FormData {
  fullName: string;
  gender: Gender;
  ethnicity: Ethnicity;
  nationality: string;
  governmentId: string;
  dateOfBirth: string;
  maritalStatus: string;
  motherName: string;
  pis: string;
  educationLevel: EducationLevel;
  rg: string;
  rgIssuer: string;
  rgState: string;
  rgIssueDate: string;
  cnh: string;
  cnhCategory: string;
  cnhIssueDate: string;
  cnhExpiryDate: string;
  cnhIssuer: string;
  cnhState: string;
  photoUrl: string;
  email: string;
  personalEmail: string;
  phone: string;
  corporatePhone: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  companyId: string;
  employeeNumber: string;
  employeeType: string;
  hireDate: string;
  status: EmployeeStatus;
  managerId: string;
  costCenterId: string;
  terminationDate: string;
  terminationReason: string;
  departmentId: string;
  positionId: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string;
  workHours: string;
  salaryAmount: string;
  spouseName: string;
  spouseBirthday: string;
  numberOfDependents: string;
  hasFoodIntolerance: boolean;
  foodIntolerance: string;
  hasMedicationAllergy: boolean;
  medicationAllergy: string;
  observation: string;
}

interface EmployeeFormProps {
  employeeId?: string;
  isEditing?: boolean;
}

const INITIAL_FORM: FormData = {
  fullName: '',
  gender: '',
  ethnicity: '',
  nationality: 'Brasileira',
  governmentId: '',
  dateOfBirth: '',
  maritalStatus: '',
  motherName: '',
  pis: '',
  educationLevel: '',
  rg: '',
  rgIssuer: '',
  rgState: '',
  rgIssueDate: '',
  cnh: '',
  cnhCategory: '',
  cnhIssueDate: '',
  cnhExpiryDate: '',
  cnhIssuer: '',
  cnhState: '',
  photoUrl: '',
  email: '',
  personalEmail: '',
  phone: '',
  corporatePhone: '',
  address: '',
  addressNumber: '',
  addressComplement: '',
  neighborhood: '',
  city: '',
  state: '',
  country: 'Brasil',
  postalCode: '',
  companyId: '',
  employeeNumber: '',
  employeeType: 'FULL_TIME',
  hireDate: new Date().toISOString().split('T')[0],
  status: 'ACTIVE',
  managerId: '',
  costCenterId: '',
  terminationDate: '',
  terminationReason: '',
  departmentId: '',
  positionId: '',
  contractType: '',
  contractStartDate: '',
  contractEndDate: '',
  workHours: '40',
  salaryAmount: '',
  spouseName: '',
  spouseBirthday: '',
  numberOfDependents: '0',
  hasFoodIntolerance: false,
  foodIntolerance: '',
  hasMedicationAllergy: false,
  medicationAllergy: '',
  observation: '',
};

interface EmergencyContactEntry {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  phoneSecondary: string;
}

const EMPTY_EMERGENCY: EmergencyContactEntry = { name: '', relationship: '', phone: '', phoneSecondary: '' };

interface LanguageEntry {
  id?: string;
  languageId: string;
  proficiencyLevel: string;
}

interface SkillEntry {
  id?: string;
  skillId: string;
  proficiencyLevel: number;
}

const EMPTY_LANGUAGE: LanguageEntry = { languageId: '', proficiencyLevel: '' };
const EMPTY_SKILL: SkillEntry = { skillId: '', proficiencyLevel: 3 };

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const onlyDigits = (value: string) => value.replace(/\D/g, '');

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatSalary(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const cents = digits.padStart(3, '0');
  const intPart = cents.slice(0, -2).replace(/^0+/, '') || '0';
  const decPart = cents.slice(-2);
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$${formatted},${decPart}`;
}

function SectionHeader({ icon: Icon, title, action }: { icon: React.ComponentType<{ size: number; color: string }>; title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color="#0A1E3D" />
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{title}</Typography>
      {action}
    </Box>
  );
}

export default function EmployeeForm({ employeeId, isEditing = false }: EmployeeFormProps) {
  const navigate = useRouter();
  const { selectedCompanyId } = useCompanyContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('dados-pessoais');
  const [photoPreview, setPhotoPreview] = useState('');

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactEntry[]>([{ ...EMPTY_EMERGENCY }]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([{ ...EMPTY_LANGUAGE }]);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; parent_department_id?: string | null; other_department?: any[] }>>([]);
  const [positions, setPositions] = useState<Array<{ id: string; name: string; levelName?: string }>>();
  const [managers, setManagers] = useState<Array<{ id: string; label: string }>>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableCostCenters, setAvailableCostCenters] = useState<CostCenter[]>([]);
  const [availableEmployeeTypes, setAvailableEmployeeTypes] = useState<EmployeeTypeConfig[]>([]);
  const [availableContractTypes, setAvailableContractTypes] = useState<ContractTypeConfig[]>([]);
  const [employeeSnapshot, setEmployeeSnapshot] = useState<any>(null);

  const dadosPessoaisRef = useRef<HTMLDivElement>(null);
  const contatoRef = useRef<HTMLDivElement>(null);
  const profissionalRef = useRef<HTMLDivElement>(null);
  const contratoRef = useRef<HTMLDivElement>(null);
  const idiomasRef = useRef<HTMLDivElement>(null);
  const emergenciaRef = useRef<HTMLDivElement>(null);
  const familiaRef = useRef<HTMLDivElement>(null);
  const observacaoRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(
    () => [
      { id: 'dados-pessoais', label: 'Dados Pessoais', icon: User, ref: dadosPessoaisRef },
      { id: 'contato', label: 'Contato', icon: Phone, ref: contatoRef },
      { id: 'emergencia', label: 'Emergência', icon: AlertCircle, ref: emergenciaRef },
      { id: 'profissional', label: 'Profissional', icon: Briefcase, ref: profissionalRef },
      { id: 'idiomas', label: 'Idiomas & Habilidades', icon: Globe, ref: idiomasRef },
      { id: 'contrato', label: 'Financeiro', icon: DollarSign, ref: contratoRef },
      { id: 'familia', label: 'Família', icon: Heart, ref: familiaRef },
      { id: 'observacao', label: 'Observação', icon: MessageSquare, ref: observacaoRef },
    ],
    [],
  );

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    const yOffset = -160;
    const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  /* Build flat hierarchical department options with indentation */
  const departmentOptions = useMemo(() => {
    const result: Array<{ id: string; name: string; depth: number }> = [];
    const deptMap = new Map<string, typeof departments[0]>();
    departments.forEach((d) => deptMap.set(d.id, d));

    const roots = departments.filter((d) => !d.parent_department_id);

    const flatten = (dept: typeof departments[0], depth: number) => {
      result.push({ id: dept.id, name: dept.name, depth });
      const children = dept.other_department || departments.filter((d) => d.parent_department_id === dept.id);
      children.forEach((child: any) => {
        const fullChild = deptMap.get(child.id) || child;
        flatten(fullChild, depth + 1);
      });
    };

    roots.forEach((root) => flatten(root, 0));

    // If tree structure is not available but we have parent_department_id, build from flat list
    if (result.length === 0 && departments.length > 0) {
      departments.forEach((d) => result.push({ id: d.id, name: d.name, depth: 0 }));
    }

    return result;
  }, [departments]);

  /* All positions available */
  const filteredPositions = useMemo(() => {
    return positions || [];
  }, [positions]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key);
  };

  const setEmergencyField = (index: number, field: keyof EmergencyContactEntry, value: string) => {
    setEmergencyContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addEmergencyContact = () => {
    setEmergencyContacts((prev) => [...prev, { ...EMPTY_EMERGENCY }]);
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const setLanguageField = (index: number, field: keyof LanguageEntry, value: string) => {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLanguage = () => {
    setLanguages((prev) => [...prev, { ...EMPTY_LANGUAGE }]);
  };

  const removeLanguage = (index: number) => {
    setLanguages((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const setSkillField = (index: number, field: keyof SkillEntry, value: string | number) => {
    setSkills((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSkill = () => {
    setSkills((prev) => [...prev, { ...EMPTY_SKILL }]);
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const backendBase = apiBase.replace(/\/api$/, '');

    // /uploads/profiles/file.jpg → /api/upload/profiles/file.jpg
    if (url.startsWith('/uploads/')) {
      const subPath = url.replace('/uploads/', '');
      return `${backendBase}/api/upload/${subPath}`;
    }

    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const localPreview = URL.createObjectURL(file);
      setPhotoPreview(localPreview);

      const response = await api.uploadProfileImage(file);
      setField('photoUrl', response.path);
      setPhotoPreview(resolveImageUrl(response.path));
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar foto');
    }
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setField('photoUrl', '');
  };

  useEffect(() => {
    if (!photoPreview || !photoPreview.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [companiesResp, departmentsResp, positionsResp, employeesResp, langResp, skillResp, ccResp, empTypesResp, ctrTypesResp] = await Promise.all([
          api.getCompanies(),
          api.getDepartments(),
          api.getPositions(),
          api.getEmployees(),
          api.getLanguages().catch(() => []),
          api.getSkills().catch(() => []),
          api.getCostCenters().catch(() => []),
          api.getEmployeeTypeConfigs().catch(() => []),
          api.getContractTypeConfigs().catch(() => []),
        ]);

        setCompanies(companiesResp);
        setDepartments(departmentsResp);
        setAvailableLanguages(langResp);
        setAvailableSkills(skillResp);
        setAvailableCostCenters(ccResp);
        setAvailableEmployeeTypes(empTypesResp);
        setAvailableContractTypes(ctrTypesResp);
        setPositions(
          positionsResp.map((position: any) => ({
            id: String(position.id),
            name: position.name || position.title,
            levelName: position.position_level?.name || '',
          })),
        );
        setManagers(
          employeesResp.map((employee: any) => ({
            id: String(employee.id),
            label: employee.person?.legal_name || employee.person?.preferred_name || employee.employee_number || 'Gestor',
          })),
        );

        if (!isEditing) {
          setFormData((prev) => ({
            ...prev,
            companyId: selectedCompanyId || prev.companyId || String(companiesResp?.[0]?.id || ''),
          }));
        }

        if (isEditing && employeeId) {
          const employee = await api.getEmployee(employeeId);
          setEmployeeSnapshot(employee as any);

          const person = (employee as any).person;
          const personalContact = person?.personal_contact?.[0];
          const emergencyList = person?.emergency_contact || [];
          const family = person?.family_info;
          const contract = (employee as any).contract?.[0];
          const salary = contract?.salary?.[0];
          const dept = (employee as any).employee_department?.[0];
          const pos = (employee as any).employee_position?.[0];

          setFormData((prev) => ({
            ...prev,
            fullName: person?.legal_name || '',
            gender: (person?.gender as Gender) || '',
            ethnicity: (person?.ethnicity as Ethnicity) || '',
            nationality: person?.nationality || 'Brasileira',
            governmentId: person?.government_id || '',
            dateOfBirth: person?.date_of_birth?.split('T')[0] || '',
            maritalStatus: person?.marital_status || '',
            motherName: person?.mother_name || '',
            pis: person?.pis || '',
            educationLevel: (person?.education_level as EducationLevel) || '',
            rg: person?.passport || '',
            rgIssuer: person?.rg_issuer || '',
            rgState: person?.rg_state || '',
            rgIssueDate: person?.rg_issue_date?.split('T')[0] || '',
            cnh: person?.ssn || '',
            cnhCategory: person?.cnh_category || '',
            cnhIssueDate: person?.cnh_issue_date?.split('T')[0] || '',
            cnhExpiryDate: person?.cnh_expiry_date?.split('T')[0] || '',
            cnhIssuer: person?.cnh_issuer || '',
            cnhState: person?.cnh_state || '',
            photoUrl: person?.photo_url || '',
            email: personalContact?.email || '',
            personalEmail: personalContact?.personal_email || '',
            phone: personalContact?.phone || '',
            corporatePhone: personalContact?.corporate_phone || '',
            address: personalContact?.address || '',
            addressNumber: personalContact?.address_number || '',
            addressComplement: personalContact?.address_complement || '',
            neighborhood: personalContact?.neighborhood || '',
            city: personalContact?.city || '',
            state: personalContact?.state || '',
            country: personalContact?.country || 'Brasil',
            postalCode: personalContact?.postal_code || '',
            companyId: String((employee as any).company_id || selectedCompanyId || ''),
            employeeNumber: (employee as any).employee_number || '',
            employeeType: (employee as any).employee_type || 'FULL_TIME',
            hireDate: (employee as any).hire_date?.split('T')[0] || prev.hireDate,
            status: (employee as any).status || 'ACTIVE',
            managerId: (employee as any).manager_id || '',
            costCenterId: (employee as any).cost_center_id || '',
            terminationDate: (employee as any).termination_date?.split('T')[0] || '',
            terminationReason: (employee as any).termination_reason || '',
            departmentId: dept?.department_id || '',
            positionId: pos?.position_id || '',
            contractType: contract?.contract_type || '',
            contractStartDate: contract?.start_date?.split('T')[0] || '',
            contractEndDate: contract?.end_date?.split('T')[0] || '',
            workHours: contract?.work_hours || '40',
            salaryAmount: salary?.amount ? formatSalary(String(Math.round(Number(salary.amount) * 100))) : '',
            spouseName: family?.spouse_name || '',
            spouseBirthday: family?.spouse_birthday?.split('T')[0] || '',
            numberOfDependents:
              family?.number_of_dependents !== undefined && family?.number_of_dependents !== null
                ? String(family.number_of_dependents)
                : '0',
            hasFoodIntolerance: person?.has_food_intolerance || false,
            foodIntolerance: person?.food_intolerance || '',
            hasMedicationAllergy: person?.has_medication_allergy || false,
            medicationAllergy: person?.medication_allergy || '',
            observation: (employee as any).observation || '',
          }));

          if (emergencyList.length > 0) {
            setEmergencyContacts(emergencyList.map((ec: any) => ({
              id: ec.id,
              name: ec.name || '',
              relationship: ec.relationship || '',
              phone: ec.phone || '',
              phoneSecondary: ec.phone_secondary || '',
            })));
          }

          // Load languages
          const langList = (employee as any).employee_language || [];
          if (langList.length > 0) {
            setLanguages(langList.map((el: any) => ({
              id: el.id,
              languageId: el.language_id || el.language?.id || '',
              proficiencyLevel: el.proficiency_level || '',
            })));
          }

          // Load skills
          const skillList = (employee as any).employee_skill || [];
          if (skillList.length > 0) {
            setSkills(skillList.map((es: any) => ({
              id: es.id,
              skillId: es.skill_id || es.skill?.id || '',
              proficiencyLevel: es.proficiency_level || 3,
            })));
          }

          setPhotoPreview(resolveImageUrl(person?.photo_url || ''));
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do formulário');
      } finally {
        setLoading(false);
      }
    };

    loadBaseData();
  }, [employeeId, isEditing, selectedCompanyId]);

  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-120px 0px -60% 0px',
        threshold: 0.1,
      },
    );

    sections.forEach((section) => {
      if (section.ref.current) observer.observe(section.ref.current);
    });

    return () => observer.disconnect();
  }, [sections, loading]);

  const persistExtraRelations = async (personId: string, employeeIdToUse: string) => {
    if (formData.departmentId) {
      if (employeeSnapshot?.employee_department?.[0]?.id) {
        await api.updateEmployeeDepartment(employeeSnapshot.employee_department[0].id, {
          department_id: formData.departmentId,
          start_date: formData.hireDate,
        });
      } else {
        await api.createEmployeeDepartment({
          employee_id: employeeIdToUse,
          department_id: formData.departmentId,
          start_date: formData.hireDate,
          is_primary: true,
        });
      }
    }

    if (formData.positionId) {
      if (employeeSnapshot?.employee_position?.[0]?.id) {
        await api.updateEmployeePosition(employeeSnapshot.employee_position[0].id, {
          position_id: formData.positionId,
          start_date: formData.hireDate,
        });
      } else {
        await api.createEmployeePosition({
          employee_id: employeeIdToUse,
          position_id: formData.positionId,
          start_date: formData.hireDate,
        });
      }
    }

    const hasEmergency = emergencyContacts.some((ec) => ec.name.trim() && ec.phone.trim());
    if (hasEmergency) {
      const existingIds = (employeeSnapshot?.person?.emergency_contact || []).map((ec: any) => ec.id);
      const keptIds = new Set<string>();

      for (let i = 0; i < emergencyContacts.length; i++) {
        const ec = emergencyContacts[i];
        if (!ec.name.trim() || !ec.phone.trim()) continue;

        const payload = {
          person_id: personId,
          name: ec.name.trim(),
          phone: ec.phone.trim(),
          phone_secondary: ec.phoneSecondary.trim() || undefined,
          relationship: ec.relationship.trim() || undefined,
          is_primary: i === 0,
        };

        if (ec.id) {
          await api.updateEmergencyContact(ec.id, payload);
          keptIds.add(ec.id);
        } else {
          await api.createEmergencyContact(payload);
        }
      }

      for (const oldId of existingIds) {
        if (!keptIds.has(oldId)) {
          try { await api.deleteEmergencyContact(oldId); } catch { /* ignore */ }
        }
      }
    }

    const hasFamilyInfo =
      formData.maritalStatus.trim() || formData.spouseName.trim() || formData.spouseBirthday || formData.numberOfDependents;
    if (hasFamilyInfo) {
      const payload = {
        person_id: personId,
        marital_status: formData.maritalStatus.trim() || undefined,
        spouse_name: formData.spouseName.trim() || undefined,
        spouse_birthday: formData.spouseBirthday || undefined,
        number_of_dependents: Number(formData.numberOfDependents || 0),
      };

      if (employeeSnapshot?.person?.family_info?.id) {
        await api.updateFamilyInfo(employeeSnapshot.person.family_info.id, payload);
      } else {
        await api.createFamilyInfo(payload);
      }
    }

    const hasContract = formData.contractType || formData.contractStartDate || formData.contractEndDate;
    if (hasContract) {
      let contractId = employeeSnapshot?.contract?.[0]?.id as string | undefined;

      const contractPayload = {
        employee_id: employeeIdToUse,
        contract_type: formData.contractType || undefined,
        work_hours: formData.workHours || undefined,
        start_date: formData.contractStartDate || formData.hireDate,
        end_date: formData.contractEndDate || undefined,
      };

      if (contractId) {
        await api.updateContract(contractId as any, contractPayload as any);
      } else {
        const createdContract = await api.createContract(contractPayload as any);
        contractId = createdContract?.id;
      }

      const hasSalary = !!(contractId && formData.salaryAmount);
      if (hasSalary) {
        const salaryPayload = {
          contract_id: contractId!,
          amount: Number(formData.salaryAmount.replace(/[^\d]/g, '')) / 100,
          currency: 'BRL',
          start_date: formData.contractStartDate || formData.hireDate,
        };

        if (employeeSnapshot?.contract?.[0]?.salary?.[0]?.id) {
          await api.updateSalary(employeeSnapshot.contract[0].salary[0].id, salaryPayload);
        } else {
          await api.createSalary(salaryPayload);
        }
      }
    }

    // ─── Persist Languages ─────────────────────────────────────────
    const existingLangIds = (employeeSnapshot?.employee_language || []).map((el: any) => el.id);
    const keptLangIds = new Set<string>();

    for (const lang of languages) {
      if (!lang.languageId || !lang.proficiencyLevel) continue;

      if (lang.id) {
        await api.updateEmployeeLanguage(lang.id, {
          language_id: lang.languageId,
          proficiency_level: lang.proficiencyLevel,
        });
        keptLangIds.add(lang.id);
      } else {
        await api.createEmployeeLanguage({
          employee_id: employeeIdToUse,
          language_id: lang.languageId,
          proficiency_level: lang.proficiencyLevel,
        });
      }
    }

    for (const oldId of existingLangIds) {
      if (!keptLangIds.has(oldId)) {
        try { await api.deleteEmployeeLanguage(oldId); } catch { /* ignore */ }
      }
    }

    // ─── Persist Skills ────────────────────────────────────────────
    const existingSkillIds = (employeeSnapshot?.employee_skill || []).map((es: any) => es.id);
    const keptSkillIds = new Set<string>();

    for (const skill of skills) {
      if (!skill.skillId) continue;

      if (skill.id) {
        await api.updateEmployeeSkill(skill.id, {
          skill_id: skill.skillId,
          proficiency_level: skill.proficiencyLevel,
        });
        keptSkillIds.add(skill.id);
      } else {
        await api.createEmployeeSkill({
          employee_id: employeeIdToUse,
          skill_id: skill.skillId,
          proficiency_level: skill.proficiencyLevel,
        });
      }
    }

    for (const oldId of existingSkillIds) {
      if (!keptSkillIds.has(oldId)) {
        try { await api.deleteEmployeeSkill(oldId); } catch { /* ignore */ }
      }
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const errors: Record<string, string> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().split(/\s+/).length < 2) {
      errors.fullName = 'Informe nome e sobrenome';
    }
    if (onlyDigits(formData.governmentId).length !== 11) {
      errors.governmentId = 'CPF deve conter 11 dígitos';
    }
    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    }
    if (!formData.hireDate) {
      errors.hireDate = 'Data de admissão é obrigatória';
    }
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Data de nascimento é obrigatória';
    }
    if (!formData.gender) {
      errors.gender = 'Gênero é obrigatório';
    }
    if (!formData.ethnicity) {
      errors.ethnicity = 'Etnia é obrigatória';
    }
    if (!formData.motherName.trim()) {
      errors.motherName = 'Nome da mãe é obrigatório';
    }
    if (!formData.educationLevel) {
      errors.educationLevel = 'Escolaridade é obrigatória';
    }
    if (!formData.maritalStatus) {
      errors.maritalStatus = 'Estado civil é obrigatório';
    }
    if (!formData.departmentId) {
      errors.departmentId = 'Departamento é obrigatório';
    }
    if (!formData.positionId) {
      errors.positionId = 'Cargo é obrigatório';
    }

    // Validate at least one language
    const hasValidLanguage = languages.some((l) => l.languageId && l.proficiencyLevel);
    if (!hasValidLanguage) {
      errors.languages = 'Adicione pelo menos um idioma';
    }

    const companyId = selectedCompanyId || formData.companyId;
    if (!companyId) {
      errors.companyId = 'Selecione uma empresa';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.fullName || errors.governmentId || errors.dateOfBirth || errors.gender || errors.ethnicity || errors.motherName || errors.educationLevel || errors.maritalStatus) scrollToSection(dadosPessoaisRef);
      else if (errors.email) scrollToSection(contatoRef);
      else if (errors.languages) scrollToSection(idiomasRef);
      else if (errors.hireDate || errors.companyId || errors.departmentId || errors.positionId) scrollToSection(profissionalRef);
      return;
    }

    setFieldErrors({});

    if (!companyId) {
      setError('Selecione uma empresa para continuar');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      if (isEditing && employeeId) {
        const currentEmployee = employeeSnapshot || (await api.getEmployee(employeeId));
        const personId = currentEmployee?.person?.id;

        if (!personId) {
          throw new Error('Pessoa vinculada ao colaborador não encontrada');
        }

        await api.updatePerson(personId, {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          nationality: formData.nationality.trim(),
          government_id: onlyDigits(formData.governmentId),
          marital_status: formData.maritalStatus.trim() || undefined,
          rg: formData.rg.trim() || undefined,
          rg_issuer: formData.rgIssuer.trim() || undefined,
          rg_state: formData.rgState.trim() || undefined,
          rg_issue_date: formData.rgIssueDate || undefined,
          cnh: formData.cnh.trim() || undefined,
          cnh_category: formData.cnhCategory.trim() || undefined,
          cnh_issue_date: formData.cnhIssueDate || undefined,
          cnh_expiry_date: formData.cnhExpiryDate || undefined,
          cnh_issuer: formData.cnhIssuer.trim() || undefined,
          cnh_state: formData.cnhState.trim() || undefined,
          mother_name: formData.motherName.trim() || undefined,
          ethnicity: formData.ethnicity || undefined,
          pis: formData.pis.trim() || undefined,
          education_level: formData.educationLevel || undefined,
          photo_url: formData.photoUrl || null,
          has_food_intolerance: formData.hasFoodIntolerance,
          food_intolerance: formData.hasFoodIntolerance ? formData.foodIntolerance.trim() : '',
          has_medication_allergy: formData.hasMedicationAllergy,
          medication_allergy: formData.hasMedicationAllergy ? formData.medicationAllergy.trim() : '',
          contact: {
            email: formData.email.trim() || undefined,
            personal_email: formData.personalEmail.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            corporate_phone: formData.corporatePhone.trim() || undefined,
            address: formData.address.trim() || undefined,
            address_number: formData.addressNumber.trim() || undefined,
            address_complement: formData.addressComplement.trim() || undefined,
            neighborhood: formData.neighborhood.trim() || undefined,
            city: formData.city.trim() || undefined,
            state: formData.state.trim() || undefined,
            country: formData.country.trim() || undefined,
            postal_code: formData.postalCode.trim() || undefined,
          },
        });

        await api.updateEmployee(employeeId, {
          company_id: companyId,
          employee_number: formData.employeeNumber.trim() || undefined,
          employee_type: formData.employeeType,
          status: formData.status,
          manager_id: formData.managerId || undefined,
          cost_center_id: formData.costCenterId || undefined,
          hire_date: formData.hireDate,
          termination_date: formData.terminationDate || undefined,
          termination_reason: formData.terminationReason.trim() || undefined,
          observation: formData.observation.trim() || undefined,
        });

        await persistExtraRelations(personId, employeeId);
      } else {
        const person = await api.createPerson({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: formData.dateOfBirth || undefined,
          gender: formData.gender || 'OTHER',
          nationality: formData.nationality.trim(),
          government_id: onlyDigits(formData.governmentId),
          marital_status: formData.maritalStatus.trim() || undefined,
          mother_name: formData.motherName.trim() || undefined,
          ethnicity: formData.ethnicity || undefined,
          pis: formData.pis.trim() || undefined,
          education_level: formData.educationLevel || undefined,
          rg: formData.rg.trim() || undefined,
          rg_issuer: formData.rgIssuer.trim() || undefined,
          rg_state: formData.rgState.trim() || undefined,
          rg_issue_date: formData.rgIssueDate || undefined,
          cnh: formData.cnh.trim() || undefined,
          cnh_category: formData.cnhCategory.trim() || undefined,
          cnh_issue_date: formData.cnhIssueDate || undefined,
          cnh_expiry_date: formData.cnhExpiryDate || undefined,
          cnh_issuer: formData.cnhIssuer.trim() || undefined,
          cnh_state: formData.cnhState.trim() || undefined,
          photo_url: formData.photoUrl || undefined,
          has_food_intolerance: formData.hasFoodIntolerance,
          food_intolerance: formData.hasFoodIntolerance ? formData.foodIntolerance.trim() : '',
          has_medication_allergy: formData.hasMedicationAllergy,
          medication_allergy: formData.hasMedicationAllergy ? formData.medicationAllergy.trim() : '',
          contact: {
            email: formData.email.trim() || undefined,
            personal_email: formData.personalEmail.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            corporate_phone: formData.corporatePhone.trim() || undefined,
            address: formData.address.trim() || undefined,
            address_number: formData.addressNumber.trim() || undefined,
            address_complement: formData.addressComplement.trim() || undefined,
            neighborhood: formData.neighborhood.trim() || undefined,
            city: formData.city.trim() || undefined,
            state: formData.state.trim() || undefined,
            country: formData.country.trim() || undefined,
            postal_code: formData.postalCode.trim() || undefined,
          },
        });

        const employee = await api.createEmployee({
          person_id: person.id,
          company_id: companyId,
          employee_number: formData.employeeNumber.trim() || undefined,
          employee_type: formData.employeeType,
          status: formData.status,
          manager_id: formData.managerId || undefined,
          cost_center_id: formData.costCenterId || undefined,
          hire_date: formData.hireDate,
          termination_date: formData.terminationDate || undefined,
          termination_reason: formData.terminationReason.trim() || undefined,
          observation: formData.observation.trim() || undefined,
        });

        await persistExtraRelations(person.id, employee.id);
        navigate.push(`/employees/${employee.id}`);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate.push('/employees'), 900);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar colaborador');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate.push('/employees')}
            sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#f8fafc' } }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditing
                ? 'Atualize as informações do colaborador'
                : 'Preencha os dados para cadastrar um novo colaborador'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Colaborador {isEditing ? 'atualizado' : 'cadastrado'} com sucesso!
        </Alert>
      )}

      <Paper
        sx={{
          position: 'sticky',
          top: 64,
          zIndex: 10,
          mb: 3,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          bgcolor: 'white',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            p: 1.5,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 3 },
          }}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <Button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  scrollToSection(section.ref);
                }}
                startIcon={<Icon size={16} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 2.5,
                  py: 1,
                  borderRadius: 1.5,
                  whiteSpace: 'nowrap',
                  bgcolor: isActive ? '#0A1E3D' : 'transparent',
                  color: isActive ? 'white' : '#64748b',
                  border: isActive ? '1px solid #1A3A5C' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: isActive ? '#1A3A5C' : '#f1f5f9',
                    color: isActive ? 'white' : '#334155',
                  },
                }}
              >
                {section.label}
              </Button>
            );
          })}
        </Box>
      </Paper>

      <Paper component="form" noValidate onSubmit={handleSubmit} sx={{ borderRadius: 2, border: '1px solid #e2e8f0' }}>
        <Box sx={{ p: 3 }}>
          <Box id="dados-pessoais" ref={dadosPessoaisRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader icon={User} title="Dados Pessoais" />

            {/* Row 1: Photo + Nome, CPF, Nascimento, Gênero, Etnia */}
            <Box sx={{ display: 'flex', gap: 2.5, mb: 2, alignItems: 'center' }}>
              {/* Photo */}
              <Box
                sx={{
                  position: 'relative',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover .photo-overlay': { opacity: 1 },
                }}
              >
                <Avatar
                  src={photoPreview || resolveImageUrl(formData.photoUrl)}
                  sx={{ width: 100, height: 100, border: '3px solid #e2e8f0' }}
                />
                <Box
                  className="photo-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <IconButton
                    component="label"
                    size="small"
                    sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                  >
                    <Camera size={20} />
                    <input hidden type="file" accept="image/*" onChange={uploadPhoto} />
                  </IconButton>
                  {(photoPreview || formData.photoUrl) && (
                    <IconButton
                      size="small"
                      onClick={removePhoto}
                      sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    >
                      <Trash2 size={20} />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ flex: 1 }}>
                <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Nome completo" required value={formData.fullName} onChange={(e) => setField('fullName', e.target.value)} size="small" placeholder="Ex: João da Silva" error={!!fieldErrors.fullName} helperText={fieldErrors.fullName} /></Grid>
                <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth label="CPF" required value={formatCPF(formData.governmentId)} onChange={(e) => setField('governmentId', onlyDigits(e.target.value).slice(0, 11))} onPaste={(e) => { e.preventDefault(); const pasted = e.clipboardData.getData('text'); setField('governmentId', onlyDigits(pasted).slice(0, 11)); }} size="small" inputProps={{ maxLength: 14 }} error={!!fieldErrors.governmentId} helperText={fieldErrors.governmentId} /></Grid>
                <Grid size={{ xs: 6, sm: 2 }}><DateInput label="Nascimento" required value={formData.dateOfBirth} onChange={(v) => setField('dateOfBirth', v)} error={!!fieldErrors.dateOfBirth} helperText={fieldErrors.dateOfBirth} /></Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField fullWidth select label="Gênero" required value={formData.gender} onChange={(e) => setField('gender', e.target.value as Gender)} size="small" error={!!fieldErrors.gender} helperText={fieldErrors.gender}>
                    <MenuItem value="">Selecione</MenuItem>
                    <MenuItem value="MALE">Masculino</MenuItem>
                    <MenuItem value="FEMALE">Feminino</MenuItem>
                    <MenuItem value="OTHER">Outro</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField fullWidth select label="Etnia" required value={formData.ethnicity} onChange={(e) => setField('ethnicity', e.target.value as Ethnicity)} size="small" error={!!fieldErrors.ethnicity} helperText={fieldErrors.ethnicity}>
                    <MenuItem value="">Selecione</MenuItem>
                    <MenuItem value="BRANCA">Branca</MenuItem>
                    <MenuItem value="PRETA">Preta</MenuItem>
                    <MenuItem value="PARDA">Parda</MenuItem>
                    <MenuItem value="AMARELA">Amarela</MenuItem>
                    <MenuItem value="INDIGENA">Indígena</MenuItem>
                    <MenuItem value="NAO_DECLARADA">Não declarada</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            {/* Row 2: Nome da mãe, Escolaridade, Estado Civil, Nacionalidade */}
            <Grid container spacing={2} sx={{ mt: 3, mb: 0 }}>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth required label="Nome da mãe" value={formData.motherName} onChange={(e) => setField('motherName', e.target.value)} size="small" error={!!fieldErrors.motherName} helperText={fieldErrors.motherName} /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth select label="Escolaridade" required value={formData.educationLevel} onChange={(e) => setField('educationLevel', e.target.value as EducationLevel)} size="small" error={!!fieldErrors.educationLevel} helperText={fieldErrors.educationLevel}>
                  <MenuItem value="">Selecione</MenuItem>
                  <MenuItem value="FUNDAMENTAL_INCOMPLETO">Fundamental Incompleto</MenuItem>
                  <MenuItem value="FUNDAMENTAL_COMPLETO">Fundamental Completo</MenuItem>
                  <MenuItem value="MEDIO_INCOMPLETO">Médio Incompleto</MenuItem>
                  <MenuItem value="MEDIO_COMPLETO">Médio Completo</MenuItem>
                  <MenuItem value="SUPERIOR_INCOMPLETO">Superior Incompleto</MenuItem>
                  <MenuItem value="SUPERIOR_COMPLETO">Superior Completo</MenuItem>
                  <MenuItem value="POS_GRADUACAO">Pós-Graduação</MenuItem>
                  <MenuItem value="MESTRADO">Mestrado</MenuItem>
                  <MenuItem value="DOUTORADO">Doutorado</MenuItem>
                  <MenuItem value="PHD">PhD</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth select label="Estado Civil" required value={formData.maritalStatus} onChange={(e) => setField('maritalStatus', e.target.value)} size="small" error={!!fieldErrors.maritalStatus} helperText={fieldErrors.maritalStatus}>
                  <MenuItem value="">Selecione</MenuItem>
                  <MenuItem value="SOLTEIRO">Solteiro(a)</MenuItem>
                  <MenuItem value="CASADO">Casado(a)</MenuItem>
                  <MenuItem value="DIVORCIADO">Divorciado(a)</MenuItem>
                  <MenuItem value="VIUVO">Viúvo(a)</MenuItem>
                  <MenuItem value="UNIAO_ESTAVEL">União Estável</MenuItem>
                  <MenuItem value="SEPARADO">Separado(a)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="Nacionalidade" required value={formData.nationality} onChange={(e) => setField('nationality', e.target.value)} size="small" /></Grid>
            </Grid>

            {/* RG section — all on one line */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 1.5, color: 'text.secondary' }}>Documento de Identidade (RG) e PIS</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="PIS" value={formData.pis} onChange={(e) => setField('pis', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="Número do RG" value={formData.rg} onChange={(e) => setField('rg', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="Órgão emissor" value={formData.rgIssuer} onChange={(e) => setField('rgIssuer', e.target.value)} size="small" placeholder="SSP" /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><DateInput label="Data de expedição" value={formData.rgIssueDate} onChange={(v) => setField('rgIssueDate', v)} /></Grid>
              <Grid size={{ xs: 6, sm: 1 }}>
                <TextField fullWidth select label="UF" value={formData.rgState} onChange={(e) => setField('rgState', e.target.value)} size="small">
                  <MenuItem value="">-</MenuItem>
                  {UF_LIST.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            {/* CNH section */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 1.5, color: 'text.secondary' }}>Carteira Nacional de Habilitação (CNH)</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Número da CNH" value={formData.cnh} onChange={(e) => setField('cnh', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 6, sm: 1 }}>
                <TextField fullWidth select label="Categoria" value={formData.cnhCategory} onChange={(e) => setField('cnhCategory', e.target.value)} size="small">
                  <MenuItem value="">-</MenuItem>
                  {['A','B','C','D','E','AB','AC','AD','AE'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}><DateInput label="Data emissão" value={formData.cnhIssueDate} onChange={(v) => setField('cnhIssueDate', v)} /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><DateInput label="Data validade" value={formData.cnhExpiryDate} onChange={(v) => setField('cnhExpiryDate', v)} /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth label="Órgão emissor" value={formData.cnhIssuer} onChange={(e) => setField('cnhIssuer', e.target.value)} size="small" placeholder="DETRAN" /></Grid>
              <Grid size={{ xs: 6, sm: 1 }}>
                <TextField fullWidth select label="UF" value={formData.cnhState} onChange={(e) => setField('cnhState', e.target.value)} size="small">
                  <MenuItem value="">-</MenuItem>
                  {UF_LIST.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box id="contato" ref={contatoRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader icon={Phone} title="Informações de Contato" />
            {/* Email corp, Email pessoal, Tel corp, Tel pessoal — all on one line */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="E-mail corporativo" type="email" value={formData.email} onChange={(e) => setField('email', e.target.value)} size="small" error={!!fieldErrors.email} helperText={fieldErrors.email} /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="E-mail pessoal" type="email" value={formData.personalEmail} onChange={(e) => setField('personalEmail', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="Telefone corporativo" value={formatPhone(formData.corporatePhone)} onChange={(e) => setField('corporatePhone', onlyDigits(e.target.value).slice(0, 11))} onPaste={(e) => { e.preventDefault(); setField('corporatePhone', onlyDigits(e.clipboardData.getData('text')).slice(0, 11)); }} size="small" inputProps={{ maxLength: 15 }} /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="Telefone pessoal" value={formatPhone(formData.phone)} onChange={(e) => setField('phone', onlyDigits(e.target.value).slice(0, 11))} onPaste={(e) => { e.preventDefault(); setField('phone', onlyDigits(e.clipboardData.getData('text')).slice(0, 11)); }} size="small" inputProps={{ maxLength: 15 }} /></Grid>
            </Grid>
            {/* Address — all on one line */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2.5, mb: 1.5, color: 'text.secondary' }}>Endereço</Typography>
            <Grid container spacing={1}>
              <Grid size={{ xs: 6, sm: 1 }}><TextField fullWidth label="CEP" value={formData.postalCode} onChange={(e) => setField('postalCode', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth label="Logradouro" value={formData.address} onChange={(e) => setField('address', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 6, sm: 1 }}><TextField fullWidth label="Número" value={formData.addressNumber} onChange={(e) => setField('addressNumber', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth label="Complemento" value={formData.addressComplement} onChange={(e) => setField('addressComplement', e.target.value)} size="small" placeholder="Apto, Bloco" /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth label="Bairro" value={formData.neighborhood} onChange={(e) => setField('neighborhood', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth label="Cidade" value={formData.city} onChange={(e) => setField('city', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 6, sm: 1 }}>
                <TextField fullWidth select label="UF" value={formData.state} onChange={(e) => setField('state', e.target.value)} size="small">
                  <MenuItem value="">-</MenuItem>
                  {UF_LIST.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box id="emergencia" ref={emergenciaRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader
              icon={AlertCircle}
              title="Contato de Emergência"
              action={
                <Button size="small" startIcon={<Plus size={16} />} onClick={addEmergencyContact} sx={{ textTransform: 'none', fontWeight: 600 }}>
                  Adicionar contato
                </Button>
              }
            />
            {emergencyContacts.map((ec, idx) => (
              <Box key={idx} sx={{ mb: idx < emergencyContacts.length - 1 ? 2.5 : 0 }}>
                {emergencyContacts.length > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Contato {idx + 1}</Typography>
                    <IconButton size="small" onClick={() => removeEmergencyContact(idx)} sx={{ color: '#ef4444' }}>
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                )}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Nome completo" value={ec.name} onChange={(e) => setEmergencyField(idx, 'name', e.target.value)} size="small" /></Grid>
                  <Grid size={{ xs: 12, sm: 2 }}><TextField fullWidth label="Parentesco" value={ec.relationship} onChange={(e) => setEmergencyField(idx, 'relationship', e.target.value)} size="small" /></Grid>
                  <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth label="Telefone" value={formatPhone(ec.phone)} onChange={(e) => setEmergencyField(idx, 'phone', onlyDigits(e.target.value).slice(0, 11))} onPaste={(e) => { e.preventDefault(); setEmergencyField(idx, 'phone', onlyDigits(e.clipboardData.getData('text')).slice(0, 11)); }} size="small" inputProps={{ maxLength: 15 }} /></Grid>
                  <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth label="Tel. secundário" value={formatPhone(ec.phoneSecondary)} onChange={(e) => setEmergencyField(idx, 'phoneSecondary', onlyDigits(e.target.value).slice(0, 11))} onPaste={(e) => { e.preventDefault(); setEmergencyField(idx, 'phoneSecondary', onlyDigits(e.clipboardData.getData('text')).slice(0, 11)); }} size="small" inputProps={{ maxLength: 15 }} /></Grid>
                </Grid>
                {idx < emergencyContacts.length - 1 && <Divider sx={{ mt: 2.5 }} />}
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box id="profissional" ref={profissionalRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader icon={Briefcase} title="Dados Profissionais" />
            {/* Line 1: Matrícula, Admissão, Tempo empresa, Tipo vínculo, Status */}
            <Grid container spacing={2}>
              {!selectedCompanyId && (
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth select label="Empresa" required value={formData.companyId} onChange={(e) => setField('companyId', e.target.value)} size="small" error={!!fieldErrors.companyId} helperText={fieldErrors.companyId}>
                    {companies.map((company) => (
                      <MenuItem key={String(company.id)} value={String(company.id)}>{company.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 2 }}><TextField fullWidth label="Matrícula" value={formData.employeeNumber} onChange={(e) => setField('employeeNumber', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 6, sm: 2 }}><DateInput label="Data de admissão" value={formData.hireDate} onChange={(v) => setField('hireDate', v)} required error={!!fieldErrors.hireDate} helperText={fieldErrors.hireDate} /></Grid>
              {formData.hireDate && (
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    fullWidth
                    label="Tempo de empresa"
                    value={(() => {
                      const hire = new Date(formData.hireDate);
                      const today = new Date();
                      let totalMonths = (today.getFullYear() - hire.getFullYear()) * 12 + (today.getMonth() - hire.getMonth());
                      if (today.getDate() < hire.getDate()) totalMonths--;
                      if (totalMonths < 0) totalMonths = 0;
                      const years = Math.floor(totalMonths / 12);
                      const months = totalMonths % 12;
                      if (years >= 1) {
                        return months > 0 ? `${years} ano${years > 1 ? 's' : ''} e ${months} ${months > 1 ? 'meses' : 'mês'}` : `${years} ano${years > 1 ? 's' : ''}`;
                      }
                      return `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`;
                    })()}
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ '& .MuiInputBase-input': { color: '#475569', fontWeight: 600 } }}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth select label="Tipo de vínculo" value={formData.employeeType} onChange={(e) => setField('employeeType', e.target.value)} size="small">{availableEmployeeTypes.map((t) => (<MenuItem key={t.id} value={t.value}>{t.label}</MenuItem>))}{availableEmployeeTypes.length === 0 && <MenuItem value="FULL_TIME">Tempo Integral</MenuItem>}</TextField></Grid>
              <Grid size={{ xs: 6, sm: 1 }}><TextField fullWidth select label="Status" value={formData.status} onChange={(e) => setField('status', e.target.value as EmployeeStatus)} size="small"><MenuItem value="ACTIVE">Ativo</MenuItem><MenuItem value="INACTIVE">Inativo</MenuItem><MenuItem value="ON_LEAVE">Afastado</MenuItem><MenuItem value="TERMINATED">Desligado</MenuItem></TextField></Grid>
            </Grid>
            {/* Line 2: Gestor, Departamento, Cargo */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth select label="Departamento" required value={formData.departmentId} onChange={(e) => setField('departmentId', e.target.value)} size="small" error={!!fieldErrors.departmentId} helperText={fieldErrors.departmentId}>
                  <MenuItem value="">Sem departamento</MenuItem>
                  {departmentOptions.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id} sx={{ pl: 2 + dept.depth * 2 }}>
                      {dept.depth > 0 ? `${'── '.repeat(dept.depth)}${dept.name}` : dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  select
                  label="Cargo"
                  required
                  value={formData.positionId}
                  onChange={(e) => setField('positionId', e.target.value)}
                  size="small"
                  disabled={!formData.departmentId}
                  error={!!fieldErrors.positionId}
                  helperText={fieldErrors.positionId || (!formData.departmentId ? 'Selecione um departamento primeiro' : undefined)}
                >
                  <MenuItem value="">Sem cargo</MenuItem>
                  {filteredPositions.map((position) => (
                    <MenuItem key={position.id} value={position.id}>
                      {position.name}{position.levelName ? ` — ${position.levelName}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth select label="Gerente direto" value={formData.managerId} onChange={(e) => setField('managerId', e.target.value)} size="small">
                  <MenuItem value="">Sem gestor</MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>{manager.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box id="idiomas" ref={idiomasRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader
              icon={Globe}
              title="Idiomas & Habilidades"
            />

            {/* Idiomas */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Idiomas *</Typography>
              <Button size="small" startIcon={<Plus size={16} />} onClick={addLanguage} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Adicionar idioma
              </Button>
            </Box>
            {availableLanguages.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Nenhum idioma cadastrado nas configurações. Cadastre idiomas em Configurações &gt; Listas do Sistema.
              </Typography>
            )}
            {!!fieldErrors.languages && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{fieldErrors.languages}</Typography>
            )}
            {languages.map((lang, idx) => (
              <Box key={idx} sx={{ mb: idx < languages.length - 1 ? 2 : 0 }}>
                {languages.length > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Idioma {idx + 1}</Typography>
                    <IconButton size="small" onClick={() => removeLanguage(idx)} sx={{ color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </IconButton>
                  </Box>
                )}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField fullWidth select label="Idioma" value={lang.languageId} onChange={(e) => setLanguageField(idx, 'languageId', e.target.value)} size="small">
                      <MenuItem value="">Selecione</MenuItem>
                      {availableLanguages.map((al) => (
                        <MenuItem key={al.id} value={al.id}>{al.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField fullWidth select label="Fluência" value={lang.proficiencyLevel} onChange={(e) => setLanguageField(idx, 'proficiencyLevel', e.target.value)} size="small">
                      <MenuItem value="">Selecione</MenuItem>
                      <MenuItem value="BASICO">Básico</MenuItem>
                      <MenuItem value="INTERMEDIARIO">Intermediário</MenuItem>
                      <MenuItem value="AVANCADO">Avançado</MenuItem>
                      <MenuItem value="FLUENTE">Fluente</MenuItem>
                      <MenuItem value="NATIVO">Nativo</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                {idx < languages.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}

            {/* Habilidades */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary">Habilidades</Typography>
              <Button size="small" startIcon={<Plus size={16} />} onClick={addSkill} sx={{ textTransform: 'none', fontWeight: 600 }}>
                Adicionar habilidade
              </Button>
            </Box>
            {availableSkills.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Nenhuma habilidade cadastrada nas configurações. Cadastre habilidades em Configurações &gt; Listas do Sistema.
              </Typography>
            )}
            {skills.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Nenhuma habilidade adicionada.</Typography>
            )}
            {skills.map((skill, idx) => (
              <Box key={idx} sx={{ mb: idx < skills.length - 1 ? 2 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Habilidade {idx + 1}</Typography>
                  <IconButton size="small" onClick={() => removeSkill(idx)} sx={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField fullWidth select label="Habilidade" value={skill.skillId} onChange={(e) => setSkillField(idx, 'skillId', e.target.value)} size="small">
                      <MenuItem value="">Selecione</MenuItem>
                      {availableSkills.map((as_) => (
                        <MenuItem key={as_.id} value={as_.id}>{as_.name}{as_.category ? ` (${as_.category})` : ''}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField fullWidth select label="Nível" value={String(skill.proficiencyLevel)} onChange={(e) => setSkillField(idx, 'proficiencyLevel', Number(e.target.value))} size="small">
                      <MenuItem value="1">1 - Iniciante</MenuItem>
                      <MenuItem value="2">2 - Básico</MenuItem>
                      <MenuItem value="3">3 - Intermediário</MenuItem>
                      <MenuItem value="4">4 - Avançado</MenuItem>
                      <MenuItem value="5">5 - Expert</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                {idx < skills.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box id="contrato" ref={contratoRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader icon={DollarSign} title="Financeiro" />
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField fullWidth select label="Centro de Custo" value={formData.costCenterId} onChange={(e) => setField('costCenterId', e.target.value)} size="small">
                  <MenuItem value="">Sem centro de custo</MenuItem>
                  {availableCostCenters.map((cc) => (
                    <MenuItem key={cc.id} value={cc.id}>{cc.name}{cc.code ? ` (${cc.code})` : ''}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}><TextField fullWidth select label="Tipo de contrato" value={formData.contractType} onChange={(e) => setField('contractType', e.target.value)} size="small"><MenuItem value="">Não informado</MenuItem>{availableContractTypes.map((t) => (<MenuItem key={t.id} value={t.value}>{t.label}</MenuItem>))}</TextField></Grid>
              <Grid size={{ xs: 12, sm: 2 }}><DateInput label="Início do contrato" value={formData.contractStartDate} onChange={(v) => setField('contractStartDate', v)} /></Grid>
              <Grid size={{ xs: 12, sm: 2 }}><DateInput label="Fim do contrato" value={formData.contractEndDate} onChange={(v) => setField('contractEndDate', v)} /></Grid>
              <Grid size={{ xs: 12, sm: 2 }}><TextField fullWidth label="Salário" value={formData.salaryAmount} onChange={(e) => setField('salaryAmount', formatSalary(e.target.value))} size="small" placeholder="R$0,00" /></Grid>
              <Grid size={{ xs: 12, sm: 2 }}><TextField fullWidth label="Horas semanais" value={formData.workHours} onChange={(e) => setField('workHours', e.target.value)} size="small" /></Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box id="familia" ref={familiaRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader icon={UserCircle} title="Informações Familiares" />
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Nome do cônjuge" value={formData.spouseName} onChange={(e) => setField('spouseName', e.target.value)} size="small" /></Grid>
              <Grid size={{ xs: 12, sm: 2 }}><DateInput label="Nascimento cônjuge" value={formData.spouseBirthday} onChange={(v) => setField('spouseBirthday', v)} /></Grid>
              <Grid size={{ xs: 12, sm: 1 }}><TextField fullWidth type="number" label="Dependentes" value={formData.numberOfDependents} onChange={(e) => setField('numberOfDependents', e.target.value)} size="small" /></Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Saúde / Restrições */}
          <Box sx={{ mb: 3 }}>
            <SectionHeader icon={Heart} title="Saúde e Restrições" />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <input type="checkbox" checked={formData.hasFoodIntolerance} onChange={(e) => setField('hasFoodIntolerance', e.target.checked)} id="food-intolerance-check" />
                  <label htmlFor="food-intolerance-check" style={{ fontWeight: 500, fontSize: 12 }}>Possui intolerância/restrição alimentar</label>
                </Box>
                {formData.hasFoodIntolerance && (
                  <TextField fullWidth multiline rows={2} label="Descreva a intolerância/restrição alimentar" value={formData.foodIntolerance} onChange={(e) => setField('foodIntolerance', e.target.value)} size="small" />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <input type="checkbox" checked={formData.hasMedicationAllergy} onChange={(e) => setField('hasMedicationAllergy', e.target.checked)} id="medication-allergy-check" />
                  <label htmlFor="medication-allergy-check" style={{ fontWeight: 500, fontSize: 12 }}>Possui alergia a medicamentos</label>
                </Box>
                {formData.hasMedicationAllergy && (
                  <TextField fullWidth multiline rows={2} label="Descreva a alergia a medicamentos" value={formData.medicationAllergy} onChange={(e) => setField('medicationAllergy', e.target.value)} size="small" />
                )}
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Observação */}
          <Box id="observacao" ref={observacaoRef} sx={{ mb: 3, scrollMarginTop: '150px' }}>
            <SectionHeader icon={MessageSquare} title="Observação" />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Observações gerais sobre o colaborador"
              value={formData.observation}
              onChange={(e) => setField('observation', e.target.value)}
              size="small"
              placeholder="Adicione informações relevantes sobre o colaborador..."
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Button variant="outlined" onClick={() => navigate.push('/employees')} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} /> : <Save size={18} />}>
            {saving ? 'Salvando...' : isEditing ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
