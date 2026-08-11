import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/dto/paginated.response';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    try {
      const [data, total] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            status: { not: 'DELETED' },
          },
          skip: pagination.skip,
          take: pagination.take,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            userCompanies: {
              where: { isActive: true },
              select: {
                id: true,
                companyId: true,
                isActive: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                userRoles: {
                  select: {
                    role: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({
          where: {
            status: { not: 'DELETED' },
          },
        }),
      ]);

      return new PaginatedResponse(data, total, pagination.skip, pagination.take);
    } catch (error) {
      this.logger.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          status: { not: 'DELETED' },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          userCompanies: {
            where: { isActive: true },
            select: {
              id: true,
              companyId: true,
              isActive: true,
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
              userRoles: {
                select: {
                  role: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error fetching user ${id}: ${error.message}`);
      throw error;
    }
  }

  async create(data: CreateUserDto, requestingUserId: string) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.status !== 'DELETED') {
        throw new ConflictException(`User with email ${data.email} already exists`);
      }

      if (!data.companies || data.companies.length === 0) {
        throw new BadRequestException('At least one company and role must be provided');
      }

      // Verify all companies and roles exist and collect them
      const companyRolePairs: Array<{ companyId: string; roleIds: string[] }> = [];

      for (const companyRole of data.companies) {
        const company = await this.prisma.company.findUnique({
          where: { id: companyRole.companyId },
        });

        if (!company) {
          throw new NotFoundException(
            `Company with ID ${companyRole.companyId} not found`,
          );
        }

        const roleIds: string[] = [];
        for (const roleName of companyRole.roles) {
          const role = await this.prisma.role.findFirst({
            where: {
              name: roleName,
              OR: [{ companyId: companyRole.companyId }, { companyId: null }],
            },
          });

          if (!role) {
            throw new NotFoundException(
              `Role ${roleName} not found for company ${companyRole.companyId}`,
            );
          }

          roleIds.push(role.id);
        }

        companyRolePairs.push({
          companyId: companyRole.companyId,
          roleIds,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const isReactivation = Boolean(existingUser && existingUser.status === 'DELETED');

      // Create or reactivate user within a transaction
      const user = await this.prisma.$transaction(async (tx) => {
        let targetUser;

        if (isReactivation) {
          targetUser = await tx.user.update({
            where: { id: existingUser!.id },
            data: {
              password: hashedPassword,
              firstName: data.firstName,
              lastName: data.lastName,
              status: 'ACTIVE',
              isActive: true,
              updatedBy: requestingUserId,
            },
          });

          await tx.user_role.deleteMany({
            where: { userId: targetUser.id },
          });

          await tx.user_company.deleteMany({
            where: { userId: targetUser.id },
          });
        } else {
          targetUser = await tx.user.create({
            data: {
              email: data.email,
              password: hashedPassword,
              firstName: data.firstName,
              lastName: data.lastName,
              status: 'ACTIVE',
              isActive: true,
              createdBy: requestingUserId,
              updatedBy: requestingUserId,
            },
          });
        }

        // For each company, create user-company relationship and assign roles
        for (const pair of companyRolePairs) {
          const userCompany = await tx.user_company.create({
            data: {
              userId: targetUser.id,
              companyId: pair.companyId,
              isActive: true,
            },
          });

          // Assign each role to user in the company
          for (const roleId of pair.roleIds) {
            await tx.user_role.create({
              data: {
                userId: targetUser.id,
                roleId,
                userCompanyId: userCompany.id,
              },
            });
          }
        }

        return targetUser;
      });

      this.logger.log(
        `${isReactivation ? 'User reactivated' : 'User created'}: ${user.id} with ${companyRolePairs.length} companies`,
      );

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateUserDto,
    requestingUserId: string,
    currentCompanyId?: string,
  ) {
    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (user.status === 'DELETED') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const isSelfUpdate = id === requestingUserId;
      if (isSelfUpdate) {
        if (data.isActive === false) {
          throw new BadRequestException('Você não pode inativar o próprio usuário');
        }

        if (data.companies) {
          if (data.companies.length === 0) {
            throw new BadRequestException(
              'Você não pode remover todos os seus vínculos de empresa',
            );
          }

          if (
            currentCompanyId &&
            !data.companies.some((company) => company.companyId === currentCompanyId)
          ) {
            throw new BadRequestException(
              'Você deve manter acesso à empresa atualmente selecionada',
            );
          }
        }
      }

      // Check if email already exists (if updating email)
      if (data.email && data.email !== user.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: data.email },
        });
        if (existingUser) {
          throw new ConflictException(`Email ${data.email} already in use`);
        }
      }

      const hashedPassword = data.password
        ? await bcrypt.hash(data.password, 10)
        : undefined;

      // Update user within transaction if companies need to be updated
      const updatedUser = await this.prisma.$transaction(async (tx) => {
        // Update basic user info
        const userUpdate = await tx.user.update({
          where: { id },
          data: {
            ...(data.email && { email: data.email }),
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
            ...(hashedPassword && { password: hashedPassword }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.isActive !== undefined && { status: data.isActive ? 'ACTIVE' : 'INACTIVE' }),
            updatedBy: requestingUserId,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            updatedAt: true,
          },
        });

        // Update companies and roles if provided
        if (data.companies && data.companies.length > 0) {
          // Get current user companies
          const currentUserCompanies = await tx.user_company.findMany({
            where: { userId: id },
            include: { userRoles: true },
          });

          const newCompanyIds = data.companies.map((c) => c.companyId);
          const currentCompanyIds = currentUserCompanies.map((uc) => uc.companyId);

          // Delete user roles and company associations that are not in the new list
          for (const uc of currentUserCompanies) {
            if (!newCompanyIds.includes(uc.companyId)) {
              await tx.user_role.deleteMany({
                where: { userCompanyId: uc.id },
              });
              await tx.user_company.delete({
                where: { id: uc.id },
              });
            }
          }

          // For each company in the update
          for (const companyRole of data.companies) {
            const company = await tx.company.findUnique({
              where: { id: companyRole.companyId },
            });

            if (!company) {
              throw new NotFoundException(
                `Company with ID ${companyRole.companyId} not found`,
              );
            }

            // Get or create user company relationship
            let userCompany = currentUserCompanies.find(
              (uc) => uc.companyId === companyRole.companyId,
            );

            if (!userCompany) {
              userCompany = await tx.user_company.create({
                data: {
                  userId: id,
                  companyId: companyRole.companyId,
                  isActive: true,
                },
                include: { userRoles: true },
              });
            }

            // Get role IDs
            const roleIds: string[] = [];
            for (const roleName of companyRole.roles) {
              const role = await tx.role.findFirst({
                where: {
                  name: roleName,
                  OR: [{ companyId: companyRole.companyId }, { companyId: null }],
                },
              });

              if (!role) {
                throw new NotFoundException(
                  `Role ${roleName} not found for company ${companyRole.companyId}`,
                );
              }

              roleIds.push(role.id);
            }

            // Delete current roles for this company
            const currentRoleIds = userCompany.userRoles.map((ur) => ur.roleId);
            const rolesToDelete = currentRoleIds.filter(
              (rId) => !roleIds.includes(rId),
            );
            const rolesToAdd = roleIds.filter(
              (rId) => !currentRoleIds.includes(rId),
            );

            // Delete old roles
            for (const roleId of rolesToDelete) {
              await tx.user_role.deleteMany({
                where: {
                  userCompanyId: userCompany.id,
                  roleId,
                },
              });
            }

            // Add new roles
            for (const roleId of rolesToAdd) {
              await tx.user_role.create({
                data: {
                  userId: id,
                  roleId,
                  userCompanyId: userCompany.id,
                },
              });
            }
          }
        }

        return userUpdate;
      });

      this.logger.log(`User updated: ${id}`);
      return updatedUser;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error updating user ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, requestingUserId: string) {
    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (id === requestingUserId) {
        throw new BadRequestException('Você não pode excluir o próprio usuário');
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.user_role.deleteMany({
          where: { userId: id },
        });

        await tx.user_company.deleteMany({
          where: { userId: id },
        });

        // Soft delete user identity
        await tx.user.update({
          where: { id },
          data: {
            isActive: false,
            status: 'DELETED',
            updatedBy: requestingUserId,
          },
        });
      });

      this.logger.log(`User removed (status DELETED) and permissions revoked: ${id}`);
      return { message: 'User removed successfully', id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error removing user ${id}: ${error.message}`);
      throw error;
    }
  }
}
