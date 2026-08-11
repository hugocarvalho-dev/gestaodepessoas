import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.admin_user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.prisma.admin_user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async createAdminUser(email: string, password: string, name: string, role: string = 'OPERATOR') {
    const hash = await bcrypt.hash(password, 12);
    return this.prisma.admin_user.create({
      data: {
        email,
        password_hash: hash,
        name,
        role: role as any,
      },
      select: { id: true, email: true, name: true, role: true, created_at: true },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.admin_user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, last_login_at: true },
    });
  }
}
