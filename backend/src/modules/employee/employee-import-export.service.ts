import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as XLSX from 'xlsx';

// Template column definitions with * for required fields
const TEMPLATE_COLUMNS = [
  // Dados Pessoais
  'Nome Completo*',
  'Nome Social',
  'CPF*',
  'RG',
  'Órgão Emissor RG',
  'UF RG',
  'Data Emissão RG',
  'CNH',
  'Categoria CNH',
  'Data Emissão CNH',
  'Data Validade CNH',
  'Órgão Emissor CNH',
  'UF CNH',
  'PIS/PASEP',
  'Data Nascimento',
  'Gênero',
  'Nacionalidade',
  'Etnia',
  'Nome da Mãe',
  'Escolaridade',
  'Estado Civil',
  // Contato
  'E-mail*',
  'E-mail Pessoal',
  'Telefone',
  'Telefone Corporativo',
  // Endereço
  'CEP',
  'Endereço',
  'Número',
  'Complemento',
  'Bairro',
  'Cidade',
  'Estado',
  'País',
  // Dados Profissionais
  'Matrícula',
  'Departamento',
  'Cargo',
  'Tipo Vínculo',
  'Tipo Contrato',
  'Carga Horária',
  'Centro de Custo',
  'Gestor (CPF)',
  'Data Admissão*',
  'Salário',
  'Observação',
  // Saúde
  'Intolerância Alimentar',
  'Alergia a Medicamento',
];

// Map from template headers (without *) to internal keys
const HEADER_MAP: Record<string, string> = {
  'Nome Completo': 'legal_name',
  'Nome Social': 'preferred_name',
  'CPF': 'government_id',
  'RG': 'passport',
  'Órgão Emissor RG': 'rg_issuer',
  'UF RG': 'rg_state',
  'Data Emissão RG': 'rg_issue_date',
  'CNH': 'ssn',
  'Categoria CNH': 'cnh_category',
  'Data Emissão CNH': 'cnh_issue_date',
  'Data Validade CNH': 'cnh_expiry_date',
  'Órgão Emissor CNH': 'cnh_issuer',
  'UF CNH': 'cnh_state',
  'PIS/PASEP': 'pis',
  'Data Nascimento': 'date_of_birth',
  'Gênero': 'gender',
  'Nacionalidade': 'nationality',
  'Etnia': 'ethnicity',
  'Nome da Mãe': 'mother_name',
  'Escolaridade': 'education_level',
  'Estado Civil': 'marital_status',
  'E-mail': 'email',
  'E-mail Pessoal': 'personal_email',
  'Telefone': 'phone',
  'Telefone Corporativo': 'corporate_phone',
  'CEP': 'postal_code',
  'Endereço': 'address',
  'Número': 'address_number',
  'Complemento': 'address_complement',
  'Bairro': 'neighborhood',
  'Cidade': 'city',
  'Estado': 'state',
  'País': 'country',
  'Matrícula': 'employee_number',
  'Departamento': 'department',
  'Cargo': 'position',
  'Tipo Vínculo': 'employee_type',
  'Tipo Contrato': 'contract_type',
  'Carga Horária': 'work_hours',
  'Centro de Custo': 'cost_center',
  'Gestor (CPF)': 'manager_cpf',
  'Data Admissão': 'hire_date',
  'Salário': 'salary',
  'Observação': 'observation',
  'Intolerância Alimentar': 'food_intolerance',
  'Alergia a Medicamento': 'medication_allergy',
};

const REQUIRED_FIELDS = ['legal_name', 'government_id', 'email', 'hire_date'];

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: ParsedRow[];
}

@Injectable()
export class EmployeeImportExportService {
  private readonly logger = new Logger(EmployeeImportExportService.name);

  constructor(private prisma: PrismaService) {}

  generateTemplate(): Buffer {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_COLUMNS]);

    // Set column widths
    ws['!cols'] = TEMPLATE_COLUMNS.map((col) => ({ wch: Math.max(col.length + 2, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateExport(companyId: string): Promise<Buffer> {
    const employees = await this.prisma.employee.findMany({
      where: { company_id: companyId },
      include: {
        person: {
          include: {
            personal_contact: { where: { is_primary: true }, take: 1 },
          },
        },
        cost_center: {
          select: { name: true },
        },
        employee: {
          select: {
            person: {
              select: { government_id: true },
            },
          },
        },
        employee_department: {
          where: { end_date: null },
          take: 1,
          include: { department: { select: { name: true } } },
        },
        employee_position: {
          where: { end_date: null },
          take: 1,
          include: { position: { select: { name: true } } },
        },
        contract: {
          where: { end_date: null },
          take: 1,
          include: { salary: { orderBy: { start_date: 'desc' }, take: 1 } },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatDate = (value?: Date | string | null) => {
      if (!value) return '';
      return new Date(value).toLocaleDateString('pt-BR');
    };

    const rows = employees.map((emp) => {
      const contact = emp.person?.personal_contact?.[0];
      const department = emp.employee_department?.[0]?.department?.name || '';
      const position = emp.employee_position?.[0]?.position?.name || '';
      const contract = emp.contract?.[0];
      const salary = contract?.salary?.[0]?.amount;

      return {
        'Nome Completo*': emp.person?.legal_name || '',
        'Nome Social': emp.person?.preferred_name || '',
        'CPF*': emp.person?.government_id || '',
        'RG': emp.person?.passport || '',
        'Órgão Emissor RG': emp.person?.rg_issuer || '',
        'UF RG': emp.person?.rg_state || '',
        'Data Emissão RG': formatDate(emp.person?.rg_issue_date),
        'CNH': emp.person?.ssn || '',
        'Categoria CNH': emp.person?.cnh_category || '',
        'Data Emissão CNH': formatDate(emp.person?.cnh_issue_date),
        'Data Validade CNH': formatDate(emp.person?.cnh_expiry_date),
        'Órgão Emissor CNH': emp.person?.cnh_issuer || '',
        'UF CNH': emp.person?.cnh_state || '',
        'PIS/PASEP': emp.person?.pis || '',
        'Data Nascimento': formatDate(emp.person?.date_of_birth),
        'Gênero': emp.person?.gender || '',
        'Nacionalidade': emp.person?.nationality || '',
        'Etnia': emp.person?.ethnicity || '',
        'Nome da Mãe': emp.person?.mother_name || '',
        'Escolaridade': emp.person?.education_level || '',
        'Estado Civil': emp.person?.marital_status || '',
        'E-mail*': contact?.email || '',
        'E-mail Pessoal': contact?.personal_email || '',
        'Telefone': contact?.phone || '',
        'Telefone Corporativo': contact?.corporate_phone || '',
        'CEP': contact?.postal_code || '',
        'Endereço': contact?.address || '',
        'Número': contact?.address_number || '',
        'Complemento': contact?.address_complement || '',
        'Bairro': contact?.neighborhood || '',
        'Cidade': contact?.city || '',
        'Estado': contact?.state || '',
        'País': contact?.country || '',
        'Matrícula': emp.employee_number || '',
        'Departamento': department,
        'Cargo': position,
        'Tipo Vínculo': emp.employee_type || '',
        'Tipo Contrato': contract?.contract_type || '',
        'Carga Horária': contract?.work_hours || '',
        'Centro de Custo': emp.cost_center?.name || '',
        'Gestor (CPF)': emp.employee?.person?.government_id || '',
        'Data Admissão*': formatDate(emp.hire_date),
        'Salário': salary != null ? String(salary) : '',
        'Observação': emp.observation || '',
        'Intolerância Alimentar': emp.person?.food_intolerance || '',
        'Alergia a Medicamento': emp.person?.medication_allergy || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: TEMPLATE_COLUMNS });
    ws['!cols'] = TEMPLATE_COLUMNS.map((col) => ({ wch: Math.max(col.length + 2, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  parseFile(fileBuffer: Buffer): ImportValidationResult {
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false, raw: true });
    } catch {
      throw new BadRequestException('Arquivo inválido. Envie um arquivo .xlsx válido.');
    }

    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Planilha vazia. Nenhuma aba encontrada.');
    }

    const ws = wb.Sheets[sheetName];
    const rawData: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (rawData.length < 2) {
      throw new BadRequestException('Planilha vazia. Adicione ao menos um colaborador após o cabeçalho.');
    }

    // Parse headers
    const rawHeaders = rawData[0].map((h) => String(h).trim());
    const headerMapping: { index: number; key: string; original: string }[] = [];
    const unrecognized: string[] = [];

    for (let i = 0; i < rawHeaders.length; i++) {
      const header = rawHeaders[i];
      if (!header) continue;

      // Remove * from header for matching
      const cleanHeader = header.replace(/\*$/, '').trim();
      const key = HEADER_MAP[cleanHeader];
      if (key) {
        headerMapping.push({ index: i, key, original: header });
      } else {
        unrecognized.push(header);
      }
    }

    // Check required columns exist
    const mappedKeys = headerMapping.map((h) => h.key);
    const missingRequired = REQUIRED_FIELDS.filter((f) => !mappedKeys.includes(f));
    if (missingRequired.length > 0) {
      const friendlyNames = missingRequired.map((f) => {
        const entry = Object.entries(HEADER_MAP).find(([, v]) => v === f);
        return entry ? entry[0] : f;
      });
      throw new BadRequestException(
        `Colunas obrigatórias não encontradas: ${friendlyNames.join(', ')}. ` +
        `Utilize o modelo de importação para garantir o formato correto.`,
      );
    }

    const rows: ParsedRow[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];

      // Skip completely empty rows
      const hasData = row.some((cell) => String(cell).trim() !== '');
      if (!hasData) continue;

      const data: Record<string, string> = {};
      const errors: string[] = [];

      for (const mapping of headerMapping) {
        const rawValue = String(row[mapping.index] ?? '').trim();
        data[mapping.key] = rawValue;
      }

      // Validate required fields
      if (!data.legal_name) {
        errors.push('Nome Completo é obrigatório');
      }

      if (!data.government_id) {
        errors.push('CPF é obrigatório');
      } else if (!this.isValidCPF(data.government_id)) {
        errors.push(`CPF inválido: ${data.government_id}`);
      }

      if (!data.email) {
        errors.push('E-mail é obrigatório');
      } else if (!this.isValidEmail(data.email)) {
        errors.push(`E-mail inválido: ${data.email}`);
      }

      if (!data.hire_date) {
        errors.push('Data Admissão é obrigatória');
      } else if (!this.parseDate(data.hire_date)) {
        errors.push(`Data Admissão inválida: ${data.hire_date}. Use o formato DD/MM/AAAA`);
      }

      // Validate optional fields
      if (data.date_of_birth && !this.parseDate(data.date_of_birth)) {
        errors.push(`Data Nascimento inválida: ${data.date_of_birth}. Use o formato DD/MM/AAAA`);
      }

      if (data.gender && !['MALE', 'FEMALE', 'OTHER'].includes(data.gender.toUpperCase())) {
        errors.push(`Gênero inválido: ${data.gender}. Use: MALE, FEMALE ou OTHER`);
      }

      if (data.salary && isNaN(parseFloat(data.salary.replace(',', '.')))) {
        errors.push(`Salário inválido: ${data.salary}. Use um valor numérico`);
      }

      if (unrecognized.length > 0 && i === 1) {
        errors.push(`Colunas não reconhecidas: ${unrecognized.join(', ')}`);
      }

      rows.push({
        rowNumber: i + 1, // 1-based, accounting for header
        data,
        errors,
      });
    }

    const validRows = rows.filter((r) => r.errors.length === 0).length;
    return {
      totalRows: rows.length,
      validRows,
      errorRows: rows.length - validRows,
      rows,
    };
  }

  async importEmployees(
    fileBuffer: Buffer,
    companyId: string,
  ): Promise<{ imported: number; errors: Array<{ row: number; error: string }> }> {
    const validation = this.parseFile(fileBuffer);

    if (validation.errorRows > 0) {
      throw new BadRequestException({
        message: 'Planilha contém erros. Corrija os erros e tente novamente.',
        validation,
      });
    }

    // Pre-load departments, positions, cost centers for name matching
    const [departments, positions, costCenters] = await Promise.all([
      this.prisma.department.findMany({
        where: { company_id: companyId },
        select: { id: true, name: true },
      }),
      this.prisma.position.findMany({
        where: { company_id: companyId },
        select: { id: true, name: true },
      }),
      this.prisma.cost_center.findMany({
        where: { company_id: companyId },
        select: { id: true, name: true },
      }),
    ]);

    const deptMap = new Map(departments.map((d) => [d.name.toLowerCase(), d.id]));
    const posMap = new Map(positions.map((p) => [p.name.toLowerCase(), p.id]));
    const ccMap = new Map(costCenters.map((c) => [c.name.toLowerCase(), c.id]));

    const imported: number[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (const row of validation.rows) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const d = row.data;

          // Check for duplicate CPF
          const existingPerson = await tx.person.findFirst({
            where: { government_id: this.cleanCPF(d.government_id) },
            include: { employee: { where: { company_id: companyId } } },
          });

          if (existingPerson?.employee?.length) {
            throw new Error(`Colaborador com CPF ${d.government_id} já existe nesta empresa`);
          }

          // Create or reuse person
          const person = existingPerson || await tx.person.create({
            data: {
              legal_name: d.legal_name,
              preferred_name: d.preferred_name || null,
              government_id: this.cleanCPF(d.government_id),
              passport: d.passport || null,
              rg_issuer: d.rg_issuer || null,
              rg_state: d.rg_state || null,
              rg_issue_date: d.rg_issue_date ? this.parseDate(d.rg_issue_date) : null,
              ssn: d.ssn || null,
              cnh_category: d.cnh_category || null,
              cnh_issue_date: d.cnh_issue_date ? this.parseDate(d.cnh_issue_date) : null,
              cnh_expiry_date: d.cnh_expiry_date ? this.parseDate(d.cnh_expiry_date) : null,
              cnh_issuer: d.cnh_issuer || null,
              cnh_state: d.cnh_state || null,
              pis: d.pis || null,
              date_of_birth: d.date_of_birth ? this.parseDate(d.date_of_birth) : null,
              gender: d.gender?.toUpperCase() || null,
              nationality: d.nationality || null,
              ethnicity: d.ethnicity || null,
              mother_name: d.mother_name || null,
              education_level: d.education_level || null,
              marital_status: d.marital_status || null,
              has_food_intolerance: d.food_intolerance ? true : false,
              food_intolerance: d.food_intolerance || null,
              has_medication_allergy: d.medication_allergy ? true : false,
              medication_allergy: d.medication_allergy || null,
            },
          });

          // Create contact
          if (d.email || d.phone || d.personal_email) {
            await tx.personal_contact.create({
              data: {
                person_id: person.id,
                email: d.email || null,
                personal_email: d.personal_email || null,
                phone: d.phone || null,
                corporate_phone: d.corporate_phone || null,
                postal_code: d.postal_code || null,
                address: d.address || null,
                address_number: d.address_number || null,
                address_complement: d.address_complement || null,
                neighborhood: d.neighborhood || null,
                city: d.city || null,
                state: d.state || null,
                country: d.country || null,
                is_primary: true,
              },
            });
          }

          const hireDate = this.parseDate(d.hire_date)!;

          // Resolve cost center
          const costCenterId = d.cost_center
            ? ccMap.get(d.cost_center.toLowerCase()) || null
            : null;

          // Resolve manager by CPF
          let managerId: string | null = null;
          if (d.manager_cpf) {
            const managerPerson = await tx.person.findFirst({
              where: { government_id: this.cleanCPF(d.manager_cpf) },
              include: { employee: { where: { company_id: companyId }, take: 1 } },
            });
            if (managerPerson?.employee?.[0]) {
              managerId = managerPerson.employee[0].id;
            }
          }

          // Create employee
          const employee = await tx.employee.create({
            data: {
              person_id: person.id,
              company_id: companyId,
              employee_number: d.employee_number || null,
              employee_type: d.employee_type || null,
              hire_date: hireDate,
              status: 'ACTIVE',
              cost_center_id: costCenterId,
              manager_id: managerId,
              observation: d.observation || null,
            },
          });

          // Assign department (by name)
          if (d.department) {
            const deptId = deptMap.get(d.department.toLowerCase());
            if (deptId) {
              await tx.employee_department.create({
                data: {
                  employee_id: employee.id,
                  department_id: deptId,
                  start_date: hireDate,
                  is_primary: true,
                },
              });
            }
          }

          // Assign position (by name)
          if (d.position) {
            const posId = posMap.get(d.position.toLowerCase());
            if (posId) {
              await tx.employee_position.create({
                data: {
                  employee_id: employee.id,
                  position_id: posId,
                  start_date: hireDate,
                },
              });
            }
          }

          // Create contract + salary
          if (d.salary || d.contract_type || d.work_hours) {
            const salaryAmount = d.salary ? parseFloat(d.salary.replace(',', '.')) : null;
            const contract = await tx.contract.create({
              data: {
                employee_id: employee.id,
                contract_type: d.contract_type || null,
                work_hours: d.work_hours || null,
                start_date: hireDate,
              },
            });

            if (salaryAmount && !isNaN(salaryAmount)) {
              await tx.salary.create({
                data: {
                  contract_id: contract.id,
                  amount: salaryAmount,
                  currency: 'BRL',
                  start_date: hireDate,
                },
              });
            }
          }

          imported.push(row.rowNumber);
        });
      } catch (err: any) {
        errors.push({
          row: row.rowNumber,
          error: err.message || 'Erro desconhecido ao importar linha',
        });
      }
    }

    this.logger.log(`Import completed: ${imported.length} imported, ${errors.length} errors`);

    return { imported: imported.length, errors };
  }

  private cleanCPF(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private isValidCPF(cpf: string): boolean {
    const cleaned = this.cleanCPF(cpf);
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cleaned[10])) return false;

    return true;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const trimmed = String(dateStr).trim();

    // Excel serial number (e.g. 45678 or 45678.0)
    const numVal = Number(trimmed);
    if (!isNaN(numVal) && numVal > 30000 && numVal < 100000) {
      // Excel epoch: Jan 0, 1900. Account for the Lotus 1-2-3 leap year bug.
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + numVal * 86400000);
      if (!isNaN(d.getTime())) return d;
    }

    // Try DD/MM/YYYY (with various separators)
    const brMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      if (!isNaN(d.getTime())) return d;
    }

    // Try YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const d = new Date(trimmed + 'T00:00:00Z');
      if (!isNaN(d.getTime())) return d;
    }

    // Try ISO datetime from Excel (e.g. "2026-03-05T00:00:00.000Z" or "Mon Mar 05 2026...")
    const isoFull = new Date(trimmed);
    if (!isNaN(isoFull.getTime()) && trimmed.length > 8) {
      return isoFull;
    }

    return null;
  }
}
