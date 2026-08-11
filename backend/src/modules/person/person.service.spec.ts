import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PersonService } from './person.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePersonDto } from './dto/person.dto';

describe('PersonService', () => {
  let service: PersonService;

  const mockPrismaService = {
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    person: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    personal_contact: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a person with valid data', async () => {
      const createPersonDto: CreatePersonDto = {
        first_name: 'Joao',
        last_name: 'Silva',
        date_of_birth: '1990-05-15',
        gender: 'MALE',
        nationality: 'Brasileiro',
      };

      const mockResult = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        legal_name: 'JOAO SILVA',
        created_at: new Date(),
      };

      mockPrismaService.person.create.mockResolvedValue(mockResult);

      const result = await service.create(createPersonDto);

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.person.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should find a person by ID', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPerson = {
        id: personId,
        legal_name: 'Joao Silva',
        personal_contact: [],
        emergency_contact: [],
        family_info: [],
        employee: [],
      };

      mockPrismaService.person.findUnique.mockResolvedValue(mockPerson);

      const result = await service.findOne(personId);

      expect(result).toEqual(mockPerson);
      expect(mockPrismaService.person.findUnique).toHaveBeenCalledWith({
        where: { id: personId },
        include: expect.anything(),
      });
    });

    it('should throw NotFoundException if person is not found', async () => {
      mockPrismaService.person.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated persons', async () => {
      const pagination = { skip: 0, take: 10 };
      const mockPersons = [
        {
          id: 'person-1',
          legal_name: 'Joao Silva',
          created_at: new Date(),
        },
      ];

      mockPrismaService.person.findMany.mockResolvedValue(mockPersons);
      mockPrismaService.person.count.mockResolvedValue(1);

      const result = await service.findAll(pagination);

      expect(result.data).toEqual(mockPersons);
      expect(result.total).toBe(1);
      expect(mockPrismaService.person.findMany).toHaveBeenCalled();
      expect(mockPrismaService.person.count).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a person', async () => {
      const personId = 'person-123';
      const mockPerson = {
        id: personId,
        legal_name: 'Joao Silva',
      };
      const updateData = { first_name: 'Joao', last_name: 'Santos' };
      const updatedPerson = { ...mockPerson, legal_name: 'JOAO SANTOS' };

      mockPrismaService.person.findUnique.mockResolvedValue(mockPerson);
      mockPrismaService.person.update.mockResolvedValue(updatedPerson);

      const result = await service.update(personId, updateData);

      expect(result).toEqual(updatedPerson);
      expect(mockPrismaService.person.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a person', async () => {
      const personId = 'person-123';
      const mockPerson = { id: personId };

      mockPrismaService.person.findUnique.mockResolvedValue(mockPerson);
      mockPrismaService.person.delete.mockResolvedValue(mockPerson);

      await service.remove(personId);

      expect(mockPrismaService.person.delete).toHaveBeenCalledWith({
        where: { id: personId },
      });
    });
  });
});
