import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // node scripts/update-password.js <emailOrPhone> <newPassword>
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: npx ts-node scripts/update-password.ts <emailOrPhone> <newPassword>");
    process.exit(1);
  }

  const [identifier, newPassword] = args;

  console.log(`Tìm kiếm người dùng: ${identifier}...`);
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phone: identifier },
        { userCode: identifier }
      ]
    }
  });

  if (!user) {
    console.error(`❌ Không tìm thấy user nào có email/SĐT/Mã nhân viên là: ${identifier}`);
    process.exit(1);
  }

  console.log(`✅ Tìm thấy user: ${user.userCode} - ${user.email || user.phone}`);
  console.log(`Đang hash password mới...`);

  // Default salt rounds in NestJS typical setups is usually 10
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  console.log(`🎉 Đã cập nhật mật khẩu thành công cho user: ${identifier}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
