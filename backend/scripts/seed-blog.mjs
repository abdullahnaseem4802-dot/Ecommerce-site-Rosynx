/** Seed three starter blog posts. Run: node --env-file=.env scripts/seed-blog.mjs */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const posts = [
  {
    slug: 'the-art-of-rosewood-carving',
    title: 'The Art of Rosewood Carving',
    author: 'Maya Idris',
    category: 'Craftsmanship',
    readTime: '6 min read',
    excerpt:
      'Inside the workshops where master carvers turn raw rosewood into heirlooms.',
    content:
      'Rosewood has been prized for centuries for its rich grain, deep color, and remarkable durability. In the workshops of our artisans, each piece begins as a rough block, hand-selected for its density and the natural pattern hidden within. Nothing is rushed; the wood must be read before it can be shaped.\n\nThe carving itself is a conversation between hand and material. Master carvers work with chisels passed down through generations, following the grain rather than fighting it. A single decorative panel can take weeks, with the finest details emerging only in the final days of work. Every curve reflects a decision made in the moment, impossible to reproduce by machine.\n\nOnce the form is complete, the surface is smoothed through progressively finer abrasives and finished by hand with natural oils. This slow finishing process is what gives rosewood its unmistakable glow, a warmth that deepens with age and handling.\n\nWhen you hold a finished piece, you hold the accumulated skill of a craftsperson and the patience of the tree that grew for decades before it. That is the quiet luxury of true handwork: an object made to be kept, and to be passed on.',
  },
  {
    slug: 'styling-with-onyx-and-stone',
    title: 'Styling with Onyx & Stone',
    author: 'Leo Hassan',
    category: 'Interiors',
    readTime: '4 min read',
    excerpt:
      'Five ways to bring warmth and texture into a modern minimalist home.',
    content:
      'Minimalism does not have to mean cold. The right natural materials bring depth and quiet character to even the most pared-back interior, and few materials do this as beautifully as onyx and hand-cut stone.\n\nStart with a single statement piece. A translucent onyx bowl or a carved stone lamp base draws the eye and anchors a room without overwhelming it. Because the material is naturally varied, no two pieces are alike, giving your space a sense of the one-of-a-kind.\n\nBalance is everything. Pair the cool solidity of stone with softer textures such as linen, wool, and warm timber. This interplay of hard and soft keeps a minimalist room feeling inviting rather than austere.\n\nFinally, let light do the work. Onyx in particular comes alive when backlit or placed near a window, its veins glowing like slow-moving smoke. With a few carefully chosen pieces, warmth and texture become part of the architecture itself.',
  },
  {
    slug: 'why-handmade-lasts-longer',
    title: 'Why Handmade Lasts Longer',
    author: 'Amira Khan',
    category: 'Sustainability',
    readTime: '5 min read',
    excerpt:
      'The sustainability case for buying fewer, better, hand-crafted objects.',
    content:
      'We live surrounded by objects designed to be replaced. Mass production optimizes for speed and cost, and durability is rarely the priority. Handmade objects follow a different logic entirely, and that difference has real consequences for the planet.\n\nWhen an object is made by hand, it is made to last. Joints are fitted rather than glued, materials are chosen for longevity, and small repairs are possible because the maker understood how the piece was assembled. A well-made item can serve for generations instead of ending up in a landfill within a few years.\n\nThere is also an environmental cost hidden in every cheap purchase: the energy, transport, and raw material spent producing something destined to be discarded. Buying fewer, better things breaks that cycle. One heirloom quietly replaces a dozen disposable versions.\n\nChoosing handmade is not about nostalgia. It is a practical, forward-looking decision to consume less and value more. The most sustainable object is the one you never have to buy again.',
  },
];

for (const p of posts) {
  await prisma.blogPost.upsert({
    where: { slug: p.slug },
    create: { ...p, imageUrl: null },
    update: {
      title: p.title,
      author: p.author,
      category: p.category,
      readTime: p.readTime,
      excerpt: p.excerpt,
      content: p.content,
    },
  });
  console.log('seeded', p.slug);
}
await prisma.$disconnect();
