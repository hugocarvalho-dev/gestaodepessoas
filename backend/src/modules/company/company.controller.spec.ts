import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

describe('CompanyController', () => {
  let controller: CompanyController;
  let service: CompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
            findUserCompanies: jest.fn().mockResolvedValue([]),
            findAllForAdmin: jest.fn().mockResolvedValue([]),
          }
        }
      ],
    }).compile();

    controller = module.get<CompanyController>(CompanyController);
    service = module.get<CompanyService>(CompanyService);
  });

  it('should return companies', async () => {
    const result = await controller.findAll({}, {
      headers: { 'x-company-id': 'company-1' },
      user: { id: 'user-1' },
    });
    expect(result).toEqual([]);
    expect(service.findAll).toHaveBeenCalled();
  });
});
