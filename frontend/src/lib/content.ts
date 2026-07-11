/* ------------------------------------------------------------------ *
 *  ROSYNX shared content — blog bodies, team, timeline, etc.
 *  (data.ts is owned by another dev; new shared content lives here.)
 * ------------------------------------------------------------------ */

/** Stable slug from a blog title. */
export const blogSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Fallback cover image for posts that have no uploaded image, by category. */
const BLOG_IMAGE_BY_CATEGORY: Record<string, string> = {
  Craftsmanship: "/images/categories/rosewood.jpg",
  Interiors: "/images/categories/onyx.jpg",
  Sustainability: "/images/categories/home-decor.jpg",
  Materials: "/images/categories/stone.jpg",
};
export const blogImage = (category?: string) =>
  (category && BLOG_IMAGE_BY_CATEGORY[category]) ||
  "/images/categories/rosewood.jpg";

/** Format an ISO date as "Jun 12, 2026". */
export const formatBlogDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

/* ----------------------------- Blog bodies ------------------------ */

export type BlogSection = { heading: string; paragraphs: string[] };
export type BlogBody = { intro: string; sections: BlogSection[] };

/** Richer article bodies keyed by blogSlug(post.title). */
export const blogBodies: Record<string, BlogBody> = {
  "the-art-of-rosewood-carving": {
    intro:
      "Rosewood has been prized for centuries for its deep grain, natural sheen and the way it warms with age. Step inside a ROSYNX partner workshop and you discover that every finished piece is the product of patience, intuition and decades of inherited skill.",
    sections: [
      {
        heading: "Choosing the Wood",
        paragraphs: [
          "Before a single cut is made, the carver studies the block — reading the grain, feeling for hidden tension and imagining the form held inside it. Only seasoned, sustainably sourced rosewood makes it to the bench, each piece chosen for density and colour.",
          "This first decision shapes everything that follows. A bowl, a sculpture or a trinket box each demands a different cut, and the maker plans around knots and figure rather than fighting them.",
        ],
      },
      {
        heading: "The Hands Behind the Blade",
        paragraphs: [
          "Carving is slow, deliberate work. Master artisans rough out the silhouette with broad gouges, then switch to finer chisels to coax out detail — a curling leaf, a beaded rim, the soft swell of a handle.",
          "Mistakes cannot be undone, so every stroke is committed. It is this stakes-high precision that gives handmade rosewood its quiet confidence.",
        ],
      },
      {
        heading: "Finishing & Patina",
        paragraphs: [
          "Once the form is complete the surface is sanded through ever-finer grits and sealed with natural oils and waxes. No stains, no shortcuts — the colour you see is the wood's own.",
          "Over years of handling, rosewood develops a patina that no factory can replicate. The piece you buy today will look richer a decade from now.",
        ],
      },
    ],
  },
  "styling-with-onyx-stone": {
    intro:
      "Stone brings something a printed cushion never can: weight, translucency and a sense of permanence. Used well, onyx and marble turn a minimalist room into a layered, tactile space without adding clutter.",
    sections: [
      {
        heading: "Let Light Do the Work",
        paragraphs: [
          "Onyx glows. Place a banded onyx bowl or lamp where daylight can pass through it and the stone reveals ribbons of amber and green you would otherwise miss.",
          "A single backlit piece can become the quiet focal point of a console or shelf — no extra accessories required.",
        ],
      },
      {
        heading: "Mix Textures, Not Colours",
        paragraphs: [
          "Pair the cool smoothness of polished stone with rougher companions — raw linen, aged brass, hand-thrown ceramic. The contrast is what makes each material feel intentional.",
          "Keep the palette restrained and let surface and finish carry the interest instead of bold colour.",
        ],
      },
      {
        heading: "Scale With Intention",
        paragraphs: [
          "One generous marble bowl reads as sculpture; five small trinkets read as clutter. When in doubt, choose fewer, larger pieces and give them room to breathe.",
          "Group objects in odd numbers and vary their heights to keep the arrangement feeling natural rather than staged.",
        ],
      },
    ],
  },
  "why-handmade-lasts-longer": {
    intro:
      "Fast décor is designed to be replaced. Handmade objects are designed to be kept. The difference is not nostalgia — it is engineering, materials and the simple fact that a person stood behind the work.",
    sections: [
      {
        heading: "Built From Better Materials",
        paragraphs: [
          "Solid rosewood, full-grain leather and natural stone behave differently from veneers and composites. They can be repaired, refinished and passed on rather than discarded.",
          "Because the raw materials are chosen for longevity, the finished object resists the wear that sends mass-produced goods to landfill within a season or two.",
        ],
      },
      {
        heading: "The Value of a Maker",
        paragraphs: [
          "When one artisan owns a piece from start to finish, accountability is built in. Joints are tighter, finishes are more even and flaws are caught before the object ever ships.",
          "That care translates directly into lifespan — and into a story you can feel every time you use it.",
        ],
      },
      {
        heading: "Buy Less, Choose Well",
        paragraphs: [
          "The most sustainable object is the one you never have to replace. Investing in fewer, better pieces reduces waste while quietly raising the quality of everyday life.",
          "It is a small shift in habit with a long-term payoff — for your home and for the makers who depend on it.",
        ],
      },
    ],
  },
};

/* ------------------------------- About ---------------------------- */

export type Milestone = { year: string; title: string; text: string };

export const timeline: Milestone[] = [
  {
    year: "2015",
    title: "Founded",
    text: "ROSYNX begins as a single workshop partnership, championing handmade rosewood.",
  },
  {
    year: "2018",
    title: "500 Customers",
    text: "Word of mouth carries our craft into homes across three continents.",
  },
  {
    year: "2020",
    title: "International Shipping",
    text: "We open carefully-packed worldwide delivery to over 60 countries.",
  },
  {
    year: "2023",
    title: "Artisan Network",
    text: "Our maker community grows to 120+ master artisans across disciplines.",
  },
  {
    year: "2025",
    title: "12k Customers",
    text: "Twelve thousand homes now live with a piece of ROSYNX craftsmanship.",
  },
];

export type Artisan = {
  name: string;
  role: string;
  country: string;
  image: string;
};

export const artisans: Artisan[] = [
  {
    name: "Idris Rahman",
    role: "Master Rosewood Carver",
    country: "India",
    image: "/images/materials/wood.jpg",
  },
  {
    name: "Lina Haddad",
    role: "Onyx & Stone Sculptor",
    country: "Morocco",
    image: "/images/materials/onyx.jpg",
  },
  {
    name: "Marco Bianchi",
    role: "Full-Grain Leather Artisan",
    country: "Italy",
    image: "/images/materials/leather.jpg",
  },
  {
    name: "Yuki Tanaka",
    role: "Ceramic Glaze Specialist",
    country: "Japan",
    image: "/images/materials/ceramic.jpg",
  },
  {
    name: "Amara Okafor",
    role: "Brass & Copper Smith",
    country: "Egypt",
    image: "/images/materials/brass.jpg",
  },
  {
    name: "Sofia Marin",
    role: "Marble Finisher",
    country: "Spain",
    image: "/images/materials/marble.jpg",
  },
];

/** Behind-the-scenes workshop strip. */
export const workshopImages: string[] = [
  "/images/hero/hero-2.jpg",
  "/images/categories/wood.jpg",
  "/images/categories/stone.jpg",
  "/images/hero/hero-4.jpg",
];

/* ------------------------------ Contact --------------------------- */

export type BusinessHour = { day: string; hours: string };

export const businessHours: BusinessHour[] = [
  { day: "Monday – Friday", hours: "9:00 AM – 6:00 PM" },
  { day: "Saturday", hours: "10:00 AM – 4:00 PM" },
  { day: "Sunday", hours: "Closed" },
];
