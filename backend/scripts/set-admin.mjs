/**
 * Create or update an ADMIN account (change email/password).
 *
 * Usage:
 *   node --env-file=.env scripts/set-admin.mjs <email> <password> [name]
 *
 * Examples:
 *   node --env-file=.env scripts/set-admin.mjs owner@rosynx.com MyStr0ngPass!
 *   node --env-file=.env scripts/set-admin.mjs owner@rosynx.com MyStr0ngPass! "Store Owner"
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error('Usage: node --env-file=.env scripts/set-admin.mjs <email> <password> [name]');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 12);

const user = await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  create: {
    email: email.toLowerCase(),
    name: name || 'Administrator',
    passwordHash,
    role: 'ADMIN',
  },
  update: {
    passwordHash,
    role: 'ADMIN',
    ...(name ? { name } : {}),
  },
});

console.log(`✅ Admin ready: ${user.email} (role ${user.role})`);
console.log('You can now log in to the admin panel with this email + the password you set.');
await prisma.$disconnect();
process.exit(0);
