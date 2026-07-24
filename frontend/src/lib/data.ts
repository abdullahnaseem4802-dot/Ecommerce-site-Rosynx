/* ------------------------------------------------------------------ *
 *  ROSYNX catalog & site data
 * ------------------------------------------------------------------ */

import { generatedProducts } from "./catalog.generated";

export type NavLink = { label: string; href: string };

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "FAQ's", href: "/faqs" },
  { label: "Blogs", href: "/blogs" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

/* ----------------------------- Hero ------------------------------- */

export type HeroSlide = {
  id: number;
  eyebrow: string;
  title: string[];
  description: string;
  image: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    eyebrow: "Handmade Collection",
    title: ["Made by Hands,", "Chosen with Heart"],
    description:
      "Discover timeless handmade treasures crafted with passion, tradition, and purpose.",
    image: "/images/hero/hero-1.jpg",
  },
  {
    id: 2,
    eyebrow: "Artisan Craftsmanship",
    title: ["Crafted to Last,", "Designed to Love"],
    description:
      "Every piece tells a story — hand-carved, hand-finished, and made to be cherished.",
    image: "/images/hero/hero-2.jpg",
  },
  {
    id: 3,
    eyebrow: "Modern Heritage",
    title: ["Timeless Pieces,", "Modern Living"],
    description:
      "Bring warmth and character home with artisan décor sourced from master makers.",
    image: "/images/hero/hero-3.jpg",
  },
  {
    id: 4,
    eyebrow: "Limited Edition",
    title: ["Heritage Artistry,", "Everyday Beauty"],
    description:
      "From rosewood to onyx — authentic craftsmanship for the way you live today.",
    image: "/images/hero/hero-4.jpg",
  },
];

/* --------------------------- Categories --------------------------- */

export type Category = {
  slug: string;
  name: string;
  description: string;
  products: number;
  image: string;
  featured?: boolean;
};

export const categories: Category[] = [
  {
    slug: "luxury",
    name: "Luxury Collection",
    description: "Gold-accented statement pieces and designer handmade décor.",
    products: 24,
    image: "/images/categories/luxury.jpg",
    featured: true,
  },
  {
    slug: "rosewood",
    name: "Rosewood",
    description: "Hand-carved rosewood bowls, trays and sculptural objects.",
    products: 18,
    image: "/images/categories/rosewood.jpg",
    featured: true,
  },
  {
    slug: "onyx",
    name: "Onyx",
    description: "Translucent onyx bowls, lamps and decorative stoneware.",
    products: 32,
    image: "/images/categories/onyx.jpg",
    featured: true,
  },
  {
    slug: "leather",
    name: "Leather",
    description: "Full-grain leather bags, wallets, belts and journals.",
    products: 15,
    image: "/images/categories/leather.jpg",
    featured: true,
  },
  {
    slug: "stone",
    name: "Stone",
    description: "Marble bowls, stone sculptures and natural décor.",
    products: 21,
    image: "/images/categories/stone.jpg",
    featured: true,
  },
  {
    slug: "wood",
    name: "Wood",
    description: "Wooden bowls, plates, spoons and hand-turned sculpture.",
    products: 38,
    image: "/images/categories/wood.jpg",
    featured: true,
  },
  {
    slug: "kitchen",
    name: "Kitchen Items",
    description: "Tea sets, serving trays, tableware and wooden utensils.",
    products: 28,
    image: "/images/categories/kitchen.jpg",
  },
  {
    slug: "home-decor",
    name: "Home Decor",
    description: "Vases, candles, frames, ceramics and wall décor.",
    products: 45,
    image: "/images/categories/home-decor.jpg",
  },
  {
    slug: "office-decor",
    name: "Office Decor",
    description: "Desk accessories and minimal artisan office pieces.",
    products: 16,
    image: "/images/categories/office-decor.jpg",
  },
  {
    slug: "dining",
    name: "Dining",
    description: "Handcrafted dinnerware and serveware for the table.",
    products: 22,
    image: "/images/categories/dining.jpg",
  },
  {
    slug: "wall-art",
    name: "Wall Art",
    description: "Hand-finished wall décor, panels and framed art.",
    products: 19,
    image: "/images/categories/wall-art.jpg",
  },
  {
    slug: "lighting",
    name: "Lighting",
    description: "Artisan lamps and warm sculptural lighting.",
    products: 14,
    image: "/images/categories/lighting.jpg",
  },
];

export const categoryBySlug = (slug: string) =>
  categories.find((c) => c.slug === slug);

/* ---------------------------- Materials --------------------------- */

export type Material = { slug: string; name: string; image: string };

export const materials: Material[] = [
  { slug: "wood", name: "Wood", image: "/images/materials/wood.jpg" },
  { slug: "stone", name: "Stone", image: "/images/materials/stone.jpg" },
  { slug: "leather", name: "Leather", image: "/images/materials/leather.jpg" },
  { slug: "onyx", name: "Onyx", image: "/images/materials/onyx.jpg" },
  { slug: "ceramic", name: "Ceramic", image: "/images/materials/ceramic.jpg" },
  { slug: "brass", name: "Brass", image: "/images/materials/brass.jpg" },
  { slug: "copper", name: "Copper", image: "/images/materials/copper.jpg" },
  { slug: "marble", name: "Marble", image: "/images/materials/marble.jpg" },
];

/* ---------------------------- Products ---------------------------- */

export type ProductBadge = "new" | "sale" | "limited";

export type Product = {
  id: number;
  apiId: string; // backend product id (cuid) — used for cart/checkout API calls
  slug: string;
  name: string;
  category: string; // primary category slug
  categorySlugs?: string[]; // all category slugs this product belongs to
  categoryName: string;
  material: string; // material slug
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  sales: number;
  badges: ProductBadge[];
  colors: string[];
  inStock: boolean;
  sku: string;
  images: string[];
  short: string;
  // optional rich fields — populated from the live API (mapProduct)
  description?: string;
  stockQty?: number;
  dimensions?: string;
  weight?: string;
  finish?: string;
  origin?: string;
  care?: string;
};

// Curated names per category to keep the catalog believable.
const SEEDS: Record<
  string,
  { material: string; names: string[]; colors: string[] }
> = {
  luxury: {
    material: "brass",
    colors: ["#caa45d", "#8a5d3e", "#2b1c11"],
    names: [
      "Gilded Brass Statement Vase",
      "Hammered Gold Bowl",
      "Royal Onyx Candle Holder",
      "Engraved Brass Jewelry Box",
      "Antique Gold Incense Burner",
      "Handcrafted Brass Lantern",
    ],
  },
  rosewood: {
    material: "wood",
    colors: ["#6b3f24", "#8a5d3e", "#3a2415"],
    names: [
      "Carved Rosewood Trinket Box",
      "Rosewood Serving Tray",
      "Hand-Turned Rosewood Bowl",
      "Rosewood Elephant Sculpture",
      "Inlaid Rosewood Coasters",
      "Rosewood Desk Organizer",
    ],
  },
  onyx: {
    material: "onyx",
    colors: ["#9bbf9a", "#d9c7a0", "#5a6b4f"],
    names: [
      "Translucent Onyx Bowl",
      "Green Onyx Table Lamp",
      "Onyx Decorative Sphere",
      "Banded Onyx Vase",
      "Onyx Pillar Candle Stand",
      "Polished Onyx Coaster Set",
    ],
  },
  leather: {
    material: "leather",
    colors: ["#7a4a2b", "#3a2415", "#a9764f"],
    names: [
      "Handcrafted Leather Satchel",
      "Full-Grain Leather Wallet",
      "Stitched Leather Journal",
      "Artisan Leather Belt",
      "Leather Crossbody Bag",
      "Vintage Leather Pouch",
    ],
  },
  stone: {
    material: "marble",
    colors: ["#e7e2d8", "#bdb5a6", "#6b6157"],
    names: [
      "Marble Stone Pottery Bowl",
      "Carved Stone Sculpture",
      "Pebble Stone Décor Set",
      "Marble Trinket Dish",
      "Stone Mortar & Pestle",
      "River Stone Candle Tray",
    ],
  },
  wood: {
    material: "wood",
    colors: ["#8a5d3e", "#6b3f24", "#caa45d"],
    names: [
      "Hand-Turned Wooden Bowl",
      "Olive Wood Serving Spoon",
      "Abstract Wood Sculpture",
      "Acacia Wood Plate Set",
      "Reclaimed Wood Tray",
      "Carved Wooden Goblet",
    ],
  },
  kitchen: {
    material: "ceramic",
    colors: ["#caa45d", "#8a5d3e", "#e7e2d8"],
    names: [
      "Antique Brass Tea Pot",
      "Stoneware Serving Platter",
      "Wooden Utensil Set",
      "Hand-Glazed Mug Pair",
      "Copper Serving Tray",
      "Ceramic Spice Jars",
    ],
  },
  "home-decor": {
    material: "ceramic",
    colors: ["#e7e2d8", "#caa45d", "#7a4a2b"],
    names: [
      "Hand-Painted Ceramic Vase Set",
      "Glazed Terracotta Planter",
      "Carved Picture Frame",
      "Scented Soy Candle",
      "Decorative Wall Mirror",
      "Ceramic Bud Vase Trio",
    ],
  },
};

const PRODUCT_CATEGORIES = Object.keys(SEEDS);

function buildProducts(): Product[] {
  const out: Product[] = [];
  let id = 1;

  PRODUCT_CATEGORIES.forEach((catSlug) => {
    const cat = categoryBySlug(catSlug)!;
    const seed = SEEDS[catSlug];

    seed.names.forEach((name, i) => {
      // deterministic pseudo-variation (no Math.random — keeps SSR stable)
      const base = 38 + ((id * 17) % 130);
      const onSale = (id + i) % 3 === 0;
      const isNew = i < 2;
      const isLimited = catSlug === "luxury" && i % 3 === 0;
      const rating = 4.4 + (((id * 7) % 6) / 10); // 4.4–4.9
      const reviews = 12 + ((id * 13) % 80);
      const sales = 40 + ((id * 29) % 400);

      const badges: ProductBadge[] = [];
      if (isNew) badges.push("new");
      if (onSale) badges.push("sale");
      if (isLimited) badges.push("limited");

      const imgA = ((i % 4) + 1);
      const imgB = (((i + 1) % 4) + 1);
      const imgC = (((i + 2) % 4) + 1);

      out.push({
        id,
        apiId: "",
        slug: `${catSlug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
        name,
        category: catSlug,
        categoryName: cat.name,
        material: seed.material,
        price: base,
        oldPrice: onSale ? Math.round(base * 1.18) : undefined,
        rating: Math.round(rating * 10) / 10,
        reviews,
        sales,
        badges,
        colors: seed.colors,
        inStock: id % 11 !== 0,
        sku: `RX-${catSlug.slice(0, 3).toUpperCase()}-${1000 + id}`,
        images: [
          `/images/products/${catSlug}-${imgA}.jpg`,
          `/images/products/${catSlug}-${imgB}.jpg`,
          `/images/products/${catSlug}-${imgC}.jpg`,
        ],
        short: cat.description,
      });
      id += 1;
    });
  });

  return out;
}

// Real catalog pulled from the backend API (Neon + Cloudinary) via
// scripts/gen-catalog.mjs — replaces the old buildProducts() mock.
export const products: Product[] = generatedProducts;
void buildProducts; // kept for reference/fallback

export const productById = (id: number) => products.find((p) => p.id === id);
export const productBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const newArrivals = products.filter((p) => p.badges.includes("new")).slice(0, 8);
export const trending = [...products]
  .filter((p) => p.rating >= 4.7)
  .slice(0, 8);

export const relatedProducts = (product: Product, count = 4) =>
  products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, count);

/* --------------------------- Misc lists --------------------------- */

export const categoryOptions = [
  "All Categories",
  ...categories.map((c) => c.name),
];

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "bestselling", label: "Popularity" },
  { value: "az", label: "Alphabetical (A–Z)" },
];

export const priceBounds = {
  min: Math.min(...products.map((p) => p.price)),
  max: Math.max(...products.map((p) => p.price)),
};

/* ----------------------- Marketing content ------------------------ */

export const whyChooseUs = [
  { title: "100% Handmade", text: "Every piece crafted by hand, never mass-produced.", icon: "hand" },
  { title: "Premium Materials", text: "Sourced rosewood, onyx, marble, full-grain leather.", icon: "gem" },
  { title: "Worldwide Shipping", text: "Carefully packed and delivered to 60+ countries.", icon: "globe" },
  { title: "Secure Payments", text: "Encrypted checkout with trusted providers.", icon: "shield" },
  { title: "Authenticity Guaranteed", text: "Certificate of craftsmanship with every order.", icon: "badge" },
  { title: "Easy Returns", text: "30-day hassle-free returns, no questions asked.", icon: "rotate" },
];

export type Collection = {
  name: string;
  tagline: string;
  image: string;
  href: string;
  size?: "large" | "small";
};

export const featuredCollections: Collection[] = [
  {
    name: "Modern Living",
    tagline: "Clean lines, warm materials",
    image: "/images/categories/home-decor.jpg",
    href: "/shop?category=home-decor",
    size: "large",
  },
  {
    name: "Luxury Gifts",
    tagline: "Unforgettable, handcrafted",
    image: "/images/categories/luxury.jpg",
    href: "/shop?category=luxury",
  },
  {
    name: "Office Collection",
    tagline: "Desk décor with character",
    image: "/images/categories/office-decor.jpg",
    href: "/shop?category=office-decor",
  },
  {
    name: "Dining Collection",
    tagline: "Tableware worth gathering for",
    image: "/images/categories/dining.jpg",
    href: "/shop?category=dining",
  },
  {
    name: "Outdoor Décor",
    tagline: "Bring craft to the garden",
    image: "/images/categories/stone.jpg",
    href: "/shop?category=stone",
    size: "large",
  },
];

export const instagramImages = [
  "/images/products/luxury-1.jpg",
  "/images/products/rosewood-2.jpg",
  "/images/products/onyx-3.jpg",
  "/images/products/stone-1.jpg",
  "/images/products/leather-2.jpg",
  "/images/products/wood-4.jpg",
  "/images/products/kitchen-1.jpg",
  "/images/products/home-decor-3.jpg",
];

export type Testimonial = {
  name: string;
  country: string;
  rating: number;
  product: string;
  text: string;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "Amelia Carter",
    country: "United Kingdom",
    rating: 5,
    product: "Carved Rosewood Trinket Box",
    text: "Absolutely stunning craftsmanship. The detail in the carving is even better in person — it has become the centrepiece of my living room.",
    avatar: "https://i.pravatar.cc/120?img=47",
  },
  {
    name: "Daniel Meyer",
    country: "Germany",
    rating: 5,
    product: "Translucent Onyx Bowl",
    text: "The onyx glows when the light hits it. Beautifully packaged and shipped faster than I expected. Will order again.",
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    name: "Sofia Rossi",
    country: "Italy",
    rating: 4,
    product: "Handcrafted Leather Satchel",
    text: "Gorgeous full-grain leather that smells amazing and ages beautifully. You can feel the quality the moment you hold it.",
    avatar: "https://i.pravatar.cc/120?img=32",
  },
  {
    name: "Noah Williams",
    country: "United States",
    rating: 5,
    product: "Hand-Painted Ceramic Vase Set",
    text: "Each vase is unique and the glaze is flawless. ROSYNX clearly cares about the artisans and the customer. Five stars.",
    avatar: "https://i.pravatar.cc/120?img=15",
  },
];

export type OrderStatus = "Delivered" | "Shipped" | "Pending" | "Cancelled";

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  items: { productId: number; qty: number }[];
  total: number;
};

export const sampleOrders: Order[] = [
  {
    id: "RX-100482",
    date: "Jun 18, 2026",
    status: "Delivered",
    items: [
      { productId: 3, qty: 1 },
      { productId: 13, qty: 2 },
    ],
    total: 152,
  },
  {
    id: "RX-100451",
    date: "Jun 09, 2026",
    status: "Shipped",
    items: [{ productId: 31, qty: 1 }],
    total: 138,
  },
  {
    id: "RX-100410",
    date: "May 28, 2026",
    status: "Pending",
    items: [
      { productId: 7, qty: 1 },
      { productId: 19, qty: 1 },
    ],
    total: 170,
  },
  {
    id: "RX-100377",
    date: "May 12, 2026",
    status: "Cancelled",
    items: [{ productId: 25, qty: 1 }],
    total: 88,
  },
];

export type BlogPost = {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: string;
};

export const blogPosts: BlogPost[] = [
  {
    title: "The Art of Rosewood Carving",
    excerpt: "Inside the workshops where master carvers turn raw rosewood into heirlooms.",
    author: "Maya Idris",
    date: "Jun 12, 2026",
    readTime: "6 min read",
    image: "/images/categories/rosewood.jpg",
    category: "Craftsmanship",
  },
  {
    title: "Styling with Onyx & Stone",
    excerpt: "Five ways to bring warmth and texture into a modern minimalist home.",
    author: "Leo Hassan",
    date: "Jun 02, 2026",
    readTime: "4 min read",
    image: "/images/categories/onyx.jpg",
    category: "Interiors",
  },
  {
    title: "Why Handmade Lasts Longer",
    excerpt: "The sustainability case for buying fewer, better, hand-crafted objects.",
    author: "Amira Khan",
    date: "May 24, 2026",
    readTime: "5 min read",
    image: "/images/categories/home-decor.jpg",
    category: "Sustainability",
  },
];
