/** Seed the two storefront coupons. Run: node --env-file=.env scripts/seed-coupons.mjs */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const coupons = [
  { code: 'ROSYNX10', type: 'PERCENT', value: 10, minSubtotalCents: 0 },
  { code: 'WELCOME15', type: 'PERCENT', value: 15, minSubtotalCents: 5000 },
];

for (const c of coupons) {
  await prisma.coupon.upsert({
    where: { code: c.code },
    create: c,
    update: { type: c.type, value: c.value, minSubtotalCents: c.minSubtotalCents, isActive: true },
  });
  console.log('seeded', c.code);
}
await prisma.$disconnect();
