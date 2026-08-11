import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateEmployeeDto, EmployeeStatus, EmployeeType } from './dto/employee.dto';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    employee: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    person: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an employee with valid data', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        person_id: 'person-123',
        company_id: 'company-123',
        employee_number: 'EMP001',
        employee_type: EmployeeType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        hire_date: '2024-01-15',
      };

      const mockPerson = { id: 'person-123' };
      const mockResult = {
        id: 'emp-123',
        ...createEmployeeDto,
        created_at: new Date(),
      };

      mockPrismaService.person.findUnique.mockResolvedValue(mockPerson);
      mockPrismaService.employee.create.mockResolvedValue(mockResult);

      const result = await service.create(createEmployeeDto, 'company-123');

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.person.findUnique).toHaveBeenCalledWith({
        where: { id: 'person-123' },
      });
    });

    it('should throw error if person not found', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        person_id: 'nonexistent-person',
        company_id: 'company-123',
        hire_date: '2024-01-15',
      };

      mockPrismaService.person.findUnique.mockResolvedValue(null);

      await expect(service.create(createEmployeeDto, 'company-123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if company ID mismatch', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        person_id: 'person-123',
        company_id: 'wrong-company',
        hire_date: '2024-01-15',
      };

      mockPrismaService.person.findUnique.mockResolvedValue({ id: 'person-123' });

      await expect(service.create(createEmployeeDto, 'company-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should find an employee by ID with full data', async () => {
      const employeeId = 'emp-123';
      const companyId = 'company-123';

      const mockEmployee = {
        id: employeeId,
        company_id: companyId,
        person_id: 'person-123',
        employee_number: 'EMP001',
        status: EmployeeStatus.ACTIVE,
        person: { legal_name: 'João Silva' },
        employee_department: [],
        employee_position: [],
        contract: [],
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.findOne(employeeId, companyId);

      expect(result).toEqual(mockEmployee);
      expect(mockPrismaService.employee.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', 'company-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if employee not in company', async () => {
      const mockEmployee = {
        id: 'emp-123',
        company_id: 'other-company',
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      await expect(service.findOne('emp-123', 'my-company')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated employees for company', async () => {
      const companyId = 'company-123';
      const pagination = { skip: 0, take: 10 };

      const mockEmployees = [
        {
          id: 'emp-1',
          company_id: companyId,
          person: { legal_name: 'João Silva' },
        },
      ];

      mockPrismaService.employee.findMany.mockResolvedValue(mockEmployees);
      mockPrismaService.employee.count.mockResolvedValue(1);

      const result = await service.findAll(pagination, companyId);

      expect(result.data).toEqual(mockEmployees);
      expect(result.total).toBe(1);
    });
  });

  describe('remove', () => {
    it('should delete an employee', async () => {
      const employeeId = 'emp-123';
      const companyId = 'company-123';

      const mockEmployee = {
        id: employeeId,
        company_id: companyId,
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.delete.mockResolvedValue(mockEmployee);

      await service.remove(employeeId, companyId);

      expect(mockPrismaService.employee.delete).toHaveBeenCalledWith({
        where: { id: employeeId },
      });
    });

    it('should throw error if employee not in company', async () => {
      const mockEmployee = {
        id: 'emp-123',
        company_id: 'other-company',
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      await expect(service.remove('emp-123', 'my-company')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
