import 'dotenv/config';
import { PrismaClient } from '.prisma/admin-client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.MASTER_DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding master database...');

  // Criar super admin padrão
  const existingAdmin = await prisma.admin_user.findUnique({
    where: { email: 'admin@gestao.com' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await prisma.admin_user.create({
      data: {
        email: 'admin@gestao.com',
        password_hash: passwordHash,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super Admin criado: admin@gestao.com / admin123');
  } else {
    console.log('ℹ️ Super Admin já existe');
  }

  console.log('🌱 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
