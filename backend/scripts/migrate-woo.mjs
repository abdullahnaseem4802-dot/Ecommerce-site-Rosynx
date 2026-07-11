/**
 * One-off migration: WooCommerce (live MySQL `rosynx`) -> Neon Postgres (Prisma).
 * - Reads 146 simple products + categories from MySQL.
 * - Uploads each product's real image files (from wp-content/uploads) to Cloudinary.
 * - Inserts clean rows into Neon.
 *
 * Run:  node --env-file=.env scripts/migrate-woo.mjs
 * Idempotent: wipes products/categories first; Cloudinary uses stable public_ids.
 */
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { existsSync } from 'node:fs';
import path from 'node:path';

const UPLOADS_DIR = path.resolve(
  'G:/Projects freelance/Ecommerce site/reference/rosynx/wp-content/uploads',
);
const MATERIAL_SLUGS = new Set(['onyx', 'stone', 'wood', 'rosewood', 'leather']);
const CONCURRENCY = 6;

const prisma = new PrismaClient();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const toCents = (v) => {
  const n = parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// simple concurrency pool
async function pool(items, limit, worker) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await runners.reduce((p) => p, Promise.resolve());
  await Promise.all(runners);
  return results;
}

const uploadCache = new Map(); // attachmentId -> {url, position}
async function uploadAttachment(db, attId) {
  if (!attId) return null;
  if (uploadCache.has(attId)) return uploadCache.get(attId);
  const [rows] = await db.query(
    "SELECT meta_value FROM fh7d_postmeta WHERE post_id=? AND meta_key='_wp_attached_file' LIMIT 1",
    [attId],
  );
  const rel = rows[0]?.meta_value;
  if (!rel) return null;
  const abs = path.join(UPLOADS_DIR, rel);
  if (!existsSync(abs)) {
    console.warn(`  ! missing file for attachment ${attId}: ${rel}`);
    return null;
  }
  try {
    const res = await cloudinary.uploader.upload(abs, {
      folder: 'rosynx/products',
      public_id: `woo-${attId}`,
      overwrite: true,
      resource_type: 'image',
    });
    const out = { url: res.secure_url };
    uploadCache.set(attId, out);
    return out;
  } catch (e) {
    console.warn(`  ! upload failed for ${attId}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log('Connecting to MySQL...');
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rosynx',
  });

  // ---- Categories ----
  const [cats] = await db.query(
    `SELECT t.term_id, t.name, t.slug, tt.description, tt.count
     FROM fh7d_term_taxonomy tt JOIN fh7d_terms t ON t.term_id=tt.term_id
     WHERE tt.taxonomy='product_cat' AND t.slug<>'uncategorized'`,
  );
  console.log(`Wiping Neon products/categories...`);
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log(`Inserting ${cats.length} categories...`);
  let sort = 0;
  for (const c of cats) {
    await prisma.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description || null,
        sortOrder: sort++,
        isFeatured: !MATERIAL_SLUGS.has(c.slug), // collections featured
      },
    });
  }

  // ---- Products ----
  const [products] = await db.query(
    `SELECT ID, post_title, post_name, post_content, post_excerpt, post_date
     FROM fh7d_posts WHERE post_type='product' AND post_status='publish'
     ORDER BY post_date ASC`,
  );
  console.log(`Found ${products.length} products. Migrating (images -> Cloudinary)...`);

  // preload meta for all products
  const ids = products.map((p) => p.ID);
  const [metaRows] = await db.query(
    `SELECT post_id, meta_key, meta_value FROM fh7d_postmeta
     WHERE post_id IN (${ids.join(',')}) AND meta_key IN
     ('_regular_price','_sale_price','_price','_stock_status','_thumbnail_id',
      '_product_image_gallery','wpr_secondary_image_id','total_sales',
      '_wc_average_rating','_wc_review_count')`,
  );
  const metaByProduct = new Map();
  for (const m of metaRows) {
    if (!metaByProduct.has(m.post_id)) metaByProduct.set(m.post_id, {});
    metaByProduct.get(m.post_id)[m.meta_key] = m.meta_value;
  }

  // category relations
  const [relRows] = await db.query(
    `SELECT tr.object_id, t.slug FROM fh7d_term_relationships tr
     JOIN fh7d_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
     JOIN fh7d_terms t ON t.term_id=tt.term_id
     WHERE tt.taxonomy='product_cat' AND tr.object_id IN (${ids.join(',')})`,
  );
  const catsByProduct = new Map();
  for (const r of relRows) {
    if (!catsByProduct.has(r.object_id)) catsByProduct.set(r.object_id, []);
    catsByProduct.get(r.object_id).push(r.slug);
  }

  let done = 0;
  await pool(products, CONCURRENCY, async (p) => {
    const meta = metaByProduct.get(p.ID) ?? {};
    const catSlugs = (catsByProduct.get(p.ID) ?? []).filter((s) => s !== 'uncategorized');

    const regular = toCents(meta._regular_price ?? meta._price);
    const sale = meta._sale_price ? toCents(meta._sale_price) : null;
    const priceCents = regular ?? sale ?? 0;
    const salePriceCents = sale && sale < (regular ?? Infinity) ? sale : null;

    // resolve images: thumbnail, secondary hover, gallery
    const attIds = [];
    if (meta._thumbnail_id) attIds.push(Number(meta._thumbnail_id));
    if (meta.wpr_secondary_image_id && Number(meta.wpr_secondary_image_id) > 0)
      attIds.push(Number(meta.wpr_secondary_image_id));
    if (meta._product_image_gallery)
      for (const g of String(meta._product_image_gallery).split(',').filter(Boolean))
        attIds.push(Number(g));
    const uniqueAtt = [...new Set(attIds)];

    const images = [];
    for (const attId of uniqueAtt) {
      const up = await uploadAttachment(db, attId);
      if (up) images.push(up.url);
    }

    const material = catSlugs.find((s) => MATERIAL_SLUGS.has(s)) ?? null;
    const badges = [];
    if (salePriceCents != null) badges.push('sale');

    const slug = p.post_name || slugify(p.post_title) || `product-${p.ID}`;
    const description = (p.post_content || p.post_excerpt || '').trim() || null;
    const short = (p.post_excerpt || '').trim().slice(0, 300) || null;

    await prisma.product.create({
      data: {
        slug,
        name: p.post_title,
        shortDesc: short,
        description,
        priceCents,
        salePriceCents,
        material,
        badges,
        inStock: (meta._stock_status ?? 'instock') === 'instock',
        ratingAvg: parseFloat(meta._wc_average_rating || '0') || 0,
        ratingCount: parseInt(meta._wc_review_count || '0', 10) || 0,
        totalSales: parseInt(meta.total_sales || '0', 10) || 0,
        categories: catSlugs.length
          ? { connect: catSlugs.map((s) => ({ slug: s })) }
          : undefined,
        images: images.length
          ? {
              create: images.map((url, i) => ({
                url,
                position: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
      },
    });
    done++;
    if (done % 20 === 0) console.log(`  ...${done}/${products.length}`);
  });

  // promote our test admin if present
  await prisma.user.updateMany({
    where: { email: 'admin@rosynx.com' },
    data: { role: 'ADMIN' },
  });

  const [pc, cc, ic] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.productImage.count(),
  ]);
  console.log(`\nDONE. Products: ${pc}, Categories: ${cc}, Images: ${ic}`);
  console.log(`Cloudinary uploads (unique): ${uploadCache.size}`);

  await db.end();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('MIGRATION FAILED:', e);
  await prisma.$disconnect();
  process.exit(1);
});
