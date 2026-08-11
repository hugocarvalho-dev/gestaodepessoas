import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getCompanyOverview(companyId: string) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const [
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveEmployees,
        totalDepartments,
        totalPositions,
        totalContracts,
        recentHires,
        upcomingBirthdays,
        contractsExpiringSoon,
        departmentDistribution,
        employeeTypeDistribution,
        hiredThisMonth,
        terminatedThisMonth,
      ] = await Promise.all([
        // Counts
        this.prisma.employee.count({ where: { company_id: companyId } }),
        this.prisma.employee.count({ where: { company_id: companyId, status: 'ACTIVE' } }),
        this.prisma.employee.count({ where: { company_id: companyId, status: 'INACTIVE' } }),
        this.prisma.employee.count({ where: { company_id: companyId, status: 'ON_LEAVE' } }),
        this.prisma.department.count({ where: { company_id: companyId } }),
        this.prisma.position.count({ where: { company_id: companyId, deleted_at: null } }),
        this.prisma.contract.count({
          where: { employee: { company_id: companyId } },
        }),

        // Recent hires (last 5)
        this.prisma.employee.findMany({
          where: { company_id: companyId },
          take: 5,
          orderBy: { hire_date: 'desc' },
          include: {
            person: { select: { legal_name: true, photo_url: true } },
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
          },
        }),

        // Upcoming birthdays (this month)
        this.prisma.employee.findMany({
          where: {
            company_id: companyId,
            status: 'ACTIVE',
            person: {
              date_of_birth: { not: null },
            },
          },
          include: {
            person: { select: { legal_name: true, date_of_birth: true, photo_url: true } },
          },
        }),

        // Contracts expiring in next 30 days
        this.prisma.contract.findMany({
          where: {
            employee: { company_id: companyId },
            end_date: { gte: now, lte: thirtyDaysFromNow },
          },
          include: {
            employee: {
              include: { person: { select: { legal_name: true } } },
            },
          },
          take: 5,
          orderBy: { end_date: 'asc' },
        }),

        // Department distribution
        this.prisma.employee_department.groupBy({
          by: ['department_id'],
          where: {
            end_date: null,
            employee: { company_id: companyId, status: 'ACTIVE' },
          },
          _count: true,
        }),

        // Employee type distribution
        this.prisma.employee.groupBy({
          by: ['employee_type'],
          where: { company_id: companyId, status: 'ACTIVE' },
          _count: true,
        }),

        // Hired this month
        this.prisma.employee.count({
          where: {
            company_id: companyId,
            hire_date: { gte: startOfMonth, lte: endOfMonth },
          },
        }),

        // Terminated this month
        this.prisma.employee.count({
          where: {
            company_id: companyId,
            status: 'TERMINATED',
            termination_date: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
      ]);

      // Resolve department names for distribution
      const deptIds = departmentDistribution.map(d => d.department_id);
      const departments = deptIds.length > 0
        ? await this.prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, name: true },
          })
        : [];
      const deptMap = new Map(departments.map(d => [d.id, d.name]));

      // Filter upcoming birthdays for current month
      const currentMonth = now.getMonth();
      const birthdaysThisMonth = upcomingBirthdays
        .filter(e => {
          if (!e.person?.date_of_birth) return false;
          return new Date(e.person.date_of_birth).getMonth() === currentMonth;
        })
        .map(e => ({
          id: e.id,
          name: e.person?.legal_name,
          photo: e.person?.photo_url,
          date: e.person?.date_of_birth,
        }))
        .slice(0, 5);

      // Build headcount evolution (last 6 months)
      const headcountEvolution = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const count = await this.prisma.employee.count({
          where: {
            company_id: companyId,
            hire_date: { lte: monthEnd },
            OR: [
              { termination_date: null },
              { termination_date: { gt: monthEnd } },
            ],
          },
        });
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        headcountEvolution.push({
          month: monthNames[monthDate.getMonth()],
          year: monthDate.getFullYear(),
          count,
        });
      }

      return {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveEmployees,
        totalDepartments,
        totalPositions,
        totalContracts,
        hiredThisMonth,
        terminatedThisMonth,
        birthdaysThisMonth,
        headcountEvolution,
        recentHires: recentHires.map(e => ({
          id: e.id,
          name: e.person?.legal_name,
          photo: e.person?.photo_url,
          hireDate: e.hire_date,
          department: e.employee_department?.[0]?.department?.name || null,
          position: e.employee_position?.[0]?.position?.name || null,
        })),
        contractsExpiringSoon: contractsExpiringSoon.map(c => ({
          id: c.id,
          employeeName: c.employee?.person?.legal_name,
          endDate: c.end_date,
          contractType: c.contract_type,
        })),
        departmentDistribution: departmentDistribution
          .map(d => ({
            name: deptMap.get(d.department_id) || 'Sem departamento',
            count: d._count,
          }))
          .sort((a, b) => b.count - a.count),
        employeeTypeDistribution: employeeTypeDistribution.map(d => ({
          type: d.employee_type || 'Não definido',
          count: d._count,
        })),
      };
    } catch (error) {
      this.logger.error(`Error fetching company overview: ${error.message}`);
      throw error;
    }
  }

  async getEmployeeComprehensive(employeeId: string, companyId: string) {
    try {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          person: true,
          employee_department: true,
          employee_position: true,
          contract: true,
          employee_language: true,
          employee_skill: true,
          education: true,
          document: true,
          work_experience: true,
        },
      }) as any;

      if (!employee || employee.company_id !== companyId) return null;

      return {
        personalInfo: {
          id: employee.id,
          legalName: employee.person?.legal_name,
          preferredName: employee.person?.preferred_name,
          dateOfBirth: employee.person?.date_of_birth,
          gender: employee.person?.gender,
        },
        professionalInfo: {
          employeeNumber: employee.employee_number,
          type: employee.employee_type,
          status: employee.status,
          hireDate: employee.hire_date,
          terminationDate: employee.termination_date,
        },
        complementaryInfo: {},
      };
    } catch (error) {
      this.logger.error(`Error fetching employee comprehensive: ${error.message}`);
      throw error;
    }
  }

  async getOrganizationChart(companyId: string) {
    try {
      const departments = await this.prisma.department.findMany({
        where: { company_id: companyId },
        include: {
          employee_department: {
            where: { end_date: null },
            include: { employee: { include: { person: { select: { legal_name: true } } } } },
          },
        },
      });

      return departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        employees: dept.employee_department?.map(ed => ({
          id: ed.employee_id,
          name: ed.employee?.person?.legal_name,
          position: ed.employee?.employee_type,
        })) || [],
      }));
    } catch (error) {
      this.logger.error(`Error generating organization chart: ${error.message}`);
      throw error;
    }
  }
}
