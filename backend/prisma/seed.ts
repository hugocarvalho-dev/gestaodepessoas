import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Configuração especial para Prisma 7.4.0
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); // ← ESSENCIAL!

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Criar recursos padrão
  console.log('Criando recursos...');
  const resources = [
    { name: 'dashboard', displayName: 'Dashboard', order: 1 },
    { name: 'employees', displayName: 'Funcionários', order: 2 },
    { name: 'departments', displayName: 'Departamentos', order: 3 },
    { name: 'positions', displayName: 'Cargos', order: 4 },
    { name: 'contracts', displayName: 'Contratos', order: 5 },
    { name: 'companies', displayName: 'Empresas', order: 6 },
    { name: 'users', displayName: 'Usuários', order: 7 },
    { name: 'roles', displayName: 'Papéis e Permissões', order: 8 },
    { name: 'reports', displayName: 'Relatórios', order: 9 },
  ];

  for (const r of resources) {
    await prisma.resource.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  // 2. Criar ações padrão
  console.log('Criando ações...');
  const actions = [
    { name: 'create', displayName: 'Criar' },
    { name: 'read', displayName: 'Visualizar' },
    { name: 'update', displayName: 'Editar' },
    { name: 'delete', displayName: 'Excluir' },
    { name: 'manage', displayName: 'Gerenciar' },
    { name: 'export', displayName: 'Exportar' },
    { name: 'import', displayName: 'Importar' },
    { name: 'approve', displayName: 'Aprovar' },
  ];

  for (const a of actions) {
    await prisma.action.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
  }

  // 3. Criar permissões (combinação de todos recursos x ações)
  console.log('Criando permissões...');
  const allResources = await prisma.resource.findMany();
  const allActions = await prisma.action.findMany();

  for (const resource of allResources) {
    for (const action of allActions) {
      await prisma.permission.upsert({
        where: {
          resourceId_actionId: {
            resourceId: resource.id,
            actionId: action.id,
          },
        },
        update: {},
        create: {
          resourceId: resource.id,
          actionId: action.id,
          description: `${action.displayName} ${resource.displayName}`,
        },
      });
    }
  }

  // 4. Criar roles padrão (CORRIGIDO: companyId opcional)
  console.log('Criando roles...');
  const roles = [
    { name: 'Super Admin', description: 'Acesso total a tudo', isSystem: true },
    { name: 'Admin', description: 'Administrador da empresa', isSystem: true },
    { name: 'Editor', description: 'Pode editar conteúdo', isSystem: true },
    { name: 'Visualizador', description: 'Apenas visualização', isSystem: true },
  ];

  for (const roleData of roles) {
    // Para roles globais (sem companyId), usamos create diretamente
    const existingRole = await prisma.role.findFirst({
      where: {
        name: roleData.name,
        companyId: null,
      },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem,
          companyId: null, // null = role global
        },
      });
    }
  }

  // 5. Atribuir permissões ao Super Admin
  console.log('Atribuindo permissões ao Super Admin...');
  const superAdmin = await prisma.role.findFirst({
    where: {
      name: 'Super Admin',
      companyId: null,
    },
  });

  if (superAdmin) {
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
      await prisma.role_permission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdmin.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdmin.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // 6. Criar usuário admin
  console.log('Criando usuário admin...');
  const hashedPassword = await bcrypt.hash('admin@123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      password: hashedPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      isActive: true,
    },
  });

  // 7. Se existir empresa, vincular admin
  const firstCompany = await prisma.company.findFirst();
  
  if (firstCompany) {
    console.log('Vinculando admin à primeira empresa...');
    
    // Verificar se já existe o vínculo
    const existingUserCompany = await prisma.user_company.findFirst({
      where: {
        userId: admin.id,
        companyId: firstCompany.id,
      },
    });

    if (!existingUserCompany) {
      // Vincular usuário à empresa
      const userCompany = await prisma.user_company.create({
        data: {
          userId: admin.id,
          companyId: firstCompany.id,
          isActive: true,
        },
      });

      // Atribuir role Super Admin
      if (superAdmin) {
        await prisma.user_role.create({
          data: {
            userId: admin.id,
            roleId: superAdmin.id,
            userCompanyId: userCompany.id,
          },
        });
      }
    }
  }

  // ───── Seed: Idiomas ─────
  console.log('Criando idiomas...');
  const languagesData = [
    { name: 'Português' },
    { name: 'Inglês' },
    { name: 'Espanhol' },
    { name: 'Francês' },
    { name: 'Alemão' },
    { name: 'Italiano' },
    { name: 'Mandarim' },
    { name: 'Japonês' },
  ];

  for (const lang of languagesData) {
    await prisma.language.upsert({
      where: { name: lang.name },
      update: {},
      create: lang,
    });
  }

  // ───── Seed: Habilidades ─────
  console.log('Criando habilidades...');
  const skillsData = [
    { name: 'Excel', category: 'Informática' },
    { name: 'Word', category: 'Informática' },
    { name: 'PowerPoint', category: 'Informática' },
    { name: 'Comunicação', category: 'Interpessoal' },
    { name: 'Liderança', category: 'Gestão' },
    { name: 'Trabalho em Equipe', category: 'Interpessoal' },
    { name: 'Gestão de Projetos', category: 'Gestão' },
    { name: 'Negociação', category: 'Comercial' },
    { name: 'Planejamento Estratégico', category: 'Gestão' },
    { name: 'Atendimento ao Cliente', category: 'Comercial' },
    { name: 'Power BI', category: 'Informática' },
    { name: 'SAP', category: 'Informática' },
  ];

  for (const skill of skillsData) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  // ───── Seed: Tipos de Colaborador e Contrato (por empresa) ─────
  if (firstCompany) {
    console.log('Criando tipos de colaborador e contrato...');

    // ───── Seed: Níveis de Cargo ─────
    console.log('Criando níveis de cargo...');
    const positionLevels = [
      { name: 'Estagiário' },
      { name: 'Júnior' },
      { name: 'Pleno' },
      { name: 'Sênior' },
      { name: 'Especialista' },
      { name: 'Líder' },
      { name: 'Coordenador' },
      { name: 'Gerente' },
      { name: 'Diretor' },
    ];

    for (const level of positionLevels) {
      const existing = await prisma.position_level.findFirst({
        where: { company_id: firstCompany.id, name: level.name },
      });
      if (!existing) {
        await prisma.position_level.create({
          data: { company_id: firstCompany.id, ...level },
        });
      }
    }

    const employeeTypes = [
      { value: 'FULL_TIME', label: 'Tempo Integral', description: 'Colaborador em jornada completa', is_system: true },
      { value: 'PART_TIME', label: 'Meio Período', description: 'Colaborador em jornada parcial', is_system: true },
      { value: 'CONTRACTOR', label: 'Prestador (PJ)', description: 'Prestador de serviço pessoa jurídica', is_system: true },
      { value: 'INTERN', label: 'Estagiário', description: 'Estagiário', is_system: true },
      { value: 'APPRENTICE', label: 'Jovem Aprendiz', description: 'Jovem aprendiz', is_system: true },
      { value: 'TEMPORARY', label: 'Temporário', description: 'Colaborador temporário', is_system: true },
    ];

    for (const et of employeeTypes) {
      const existing = await prisma.employee_type_config.findFirst({
        where: { company_id: firstCompany.id, value: et.value },
      });
      if (!existing) {
        await prisma.employee_type_config.create({
          data: { company_id: firstCompany.id, ...et },
        });
      }
    }

    const contractTypes = [
      { value: 'INDEFINITE', label: 'Indeterminado', description: 'Contrato por prazo indeterminado', is_system: true },
      { value: 'FIXED_TERM', label: 'Prazo Determinado', description: 'Contrato por prazo determinado', is_system: true },
      { value: 'APPRENTICE', label: 'Aprendiz', description: 'Contrato de aprendizagem', is_system: true },
      { value: 'TEMPORARY', label: 'Temporário', description: 'Contrato temporário', is_system: true },
      { value: 'EXPERIENCE', label: 'Experiência', description: 'Contrato de experiência', is_system: true },
    ];

    for (const ct of contractTypes) {
      const existing = await prisma.contract_type_config.findFirst({
        where: { company_id: firstCompany.id, value: ct.value },
      });
      if (!existing) {
        await prisma.contract_type_config.create({
          data: { company_id: firstCompany.id, ...ct },
        });
      }
    }

    // ───── Seed: Centros de Custo ─────
    console.log('Criando centros de custo...');
    const costCenters = [
      { name: 'Administrativo', code: 'ADM', description: 'Centro de custo administrativo' },
      { name: 'Operacional', code: 'OPR', description: 'Centro de custo operacional' },
      { name: 'Comercial', code: 'COM', description: 'Centro de custo comercial' },
      { name: 'Tecnologia da Informação', code: 'TI', description: 'Centro de custo de TI' },
      { name: 'Recursos Humanos', code: 'RH', description: 'Centro de custo de RH' },
      { name: 'Financeiro', code: 'FIN', description: 'Centro de custo financeiro' },
    ];

    for (const cc of costCenters) {
      const existing = await prisma.cost_center.findFirst({
        where: { company_id: firstCompany.id, name: cc.name },
      });
      if (!existing) {
        await prisma.cost_center.create({
          data: { company_id: firstCompany.id, ...cc },
        });
      }
    }
  }

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });