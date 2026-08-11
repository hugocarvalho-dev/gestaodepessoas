import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, UpdateProfileDto, UpdateSettingsDto } from './dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // Normalizar email
    const normalizedEmail = dto.email.toLowerCase().trim();
    
    // Buscar usuÃ¡rio
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userCompanies: {
          include: {
            company: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: {
                          include: {
                            resource: true,
                            action: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!user) {
      throw new UnauthorizedException('Email não cadastrado ou inválido');
    }
    if ((user as any).status === 'DELETED') {
      throw new UnauthorizedException('Email não cadastrado ou inválido');
    }
    
    // Verificar se usuÃ¡rio estÃ¡ ativo
    if (!user.isActive) {
      throw new UnauthorizedException('UsuÃ¡rio inativo. Contate o administrador');
    }
    
    // Verificar senha
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    
    if (!passwordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }
    
    // Atualizar Ãºltimo login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Estruturar empresas e permissÃµes para o frontend
    const companies = user.userCompanies.map(uc => ({
      id: uc.company.id,
      name: uc.company.name,
      document: uc.company.document,
      roles: uc.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map(rp => ({
          resource: rp.permission.resource.name,
          action: rp.permission.action.name,
        })),
      })),
    }));
    
    // Gerar token
    const token = this.generateToken(user);
    
    return {
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      companies: companies,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        userCompanies: {
          include: {
            company: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: {
                          include: {
                            resource: true,
                            action: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    
    const companies = user.userCompanies.map(uc => ({
      id: uc.company.id,
      name: uc.company.name,
      document: uc.company.document,
      roles: uc.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions.map(rp => ({
          resource: rp.permission.resource.name,
          action: rp.permission.action.name,
        })),
      })),
    }));

    const settings = user.settings
      ? {
          theme: user.settings.theme,
          emailNotifications: user.settings.emailNotifications,
          birthdayReminders: user.settings.birthdayReminders,
          anniversaryReminders: user.settings.anniversaryReminders,
          customColors: user.settings.customColors ?? null,
        }
      : {
          theme: 'light',
          emailNotifications: true,
          birthdayReminders: true,
          anniversaryReminders: true,
          customColors: null,
        };
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      settings,
      companies,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    // If changing email or password, require current password
    if (dto.email || dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Senha atual é obrigatória para alterar e-mail ou senha');
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) {
        throw new BadRequestException('Senha atual incorreta');
      }
    }

    // Check email uniqueness
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException('Este e-mail já está em uso');
      }
    }

    const hashedPassword = dto.newPassword
      ? await bcrypt.hash(dto.newPassword, 10)
      : undefined;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.email && { email: dto.email }),
        ...(hashedPassword && { password: hashedPassword }),
        updatedBy: userId,
      },
    });

    // Re-issue token so the user stays logged in with updated data
    const newToken = this.generateToken(updated);

    return {
      token: newToken,
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
      },
    };
  }

  async getSettings(userId: string) {
    // Upsert: cria settings com defaults se não existir
    const settings = await this.prisma.user_settings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return {
      theme: settings.theme,
      emailNotifications: settings.emailNotifications,
      birthdayReminders: settings.birthdayReminders,
      anniversaryReminders: settings.anniversaryReminders,
      customColors: settings.customColors ?? null,
    };
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    // Build prisma-safe data: convert customColors class to plain JSON
    const data: Record<string, unknown> = {};
    if (dto.theme !== undefined) data.theme = dto.theme;
    if (dto.emailNotifications !== undefined) data.emailNotifications = dto.emailNotifications;
    if (dto.birthdayReminders !== undefined) data.birthdayReminders = dto.birthdayReminders;
    if (dto.anniversaryReminders !== undefined) data.anniversaryReminders = dto.anniversaryReminders;
    if (dto.customColors !== undefined) {
      data.customColors = dto.customColors ? JSON.parse(JSON.stringify(dto.customColors)) : null;
    }

    const settings = await this.prisma.user_settings.upsert({
      where: { userId },
      create: { userId, ...data } as any,
      update: data as any,
    });

    return {
      theme: settings.theme,
      emailNotifications: settings.emailNotifications,
      birthdayReminders: settings.birthdayReminders,
      anniversaryReminders: settings.anniversaryReminders,
      customColors: settings.customColors ?? null,
    };
  }

  private generateToken(user: any): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');

    if (!secret) {
      throw new Error('JWT_SECRET nÃ£o configurado no .env');
    }
    
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return this.jwtService.sign(payload, {
      secret: secret,
      expiresIn: expiresIn as any,
    });
  }
}
