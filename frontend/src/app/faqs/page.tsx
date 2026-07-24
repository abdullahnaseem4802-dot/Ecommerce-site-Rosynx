import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { FaqAccordion, type FaqEntry } from "@/components/faq/faq-accordion";

// Admin-managed via /admin → FAQs. This page renders whatever the admin has
// published; the list below is only a fallback shown when none exist yet (e.g.
// a fresh database), so the page is never empty. On-demand revalidation
// (backend RevalidateService.faq → /faqs) makes admin edits appear in seconds.
export const revalidate = 300;

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface ApiFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
}

const FALLBACK: FaqEntry[] = [
  {
    q: "What does “handmade” really mean at ROSYNX?",
    a: "Every ROSYNX piece is individually made by skilled artisans, not stamped out by a machine. Because a real person shapes, carves and finishes each item by hand, no two are ever perfectly identical. Small differences in grain, tone, veining or finish are not flaws — they are the signature of authentic, one-of-a-kind craftsmanship.",
  },
  {
    q: "What materials do you use and where do they come from?",
    a: "We work with natural, responsibly sourced materials — rosewood and hardwoods, onyx and marble, natural stone, full-grain leather, ceramic and hand-worked brass and copper. Each product page lists its primary material, and wherever possible we partner directly with the makers and suppliers who share our commitment to quality and longevity.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders are carefully inspected and packed within 1–3 business days. Domestic deliveries typically arrive within 3–7 business days, while international orders generally take 7–18 business days depending on the destination and customs clearance. Larger or made-to-order pieces may need a little extra time, which we’ll always note on the product page.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — we ship worldwide to more than 60 countries. Please note that international orders may be subject to import duties, taxes or customs fees set by your local authorities. These are not included at checkout and are the responsibility of the recipient.",
  },
  {
    q: "How can I track my order?",
    a: "Once your order ships, we’ll email you a confirmation with tracking details. You can also follow your order status at any time from the “Track Order” section of your account. If your tracking hasn’t updated after a few days, our support team is happy to look into it for you.",
  },
  {
    q: "What is your returns and exchanges policy?",
    a: "If your piece isn’t quite right, you may request a return or exchange within 14 days of delivery, provided the item is unused and in its original condition and packaging. Please note that custom, personalised or commissioned pieces are made specifically for you and are non-returnable unless they arrive damaged or faulty.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently offer Cash on Delivery where available, as well as secure card payments at checkout. Card payments are processed in a protected sandbox environment for now while we finalise our live payment integration, so you can order with confidence.",
  },
  {
    q: "How do I contact your support team?",
    a: "We’re here to help. Reach us through our Contact page, by email, or via the WhatsApp chat button on the site. We typically reply within 24 hours on business days and will always do our best to make things right.",
  },
];

async function fetchFaqs(): Promise<FaqEntry[]> {
  try {
    const res = await fetch(`${API}/faqs`, { next: { revalidate: 300 } });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as ApiFaq[];
    if (!Array.isArray(data) || data.length === 0) return FALLBACK;
    return data.map((f) => ({ q: f.question, a: f.answer }));
  } catch {
    return FALLBACK;
  }
}

export default async function FaqsPage() {
  const faqs = await fetchFaqs();
  return (
    <div className="pb-20">
      <PageBanner
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about ordering from ROSYNX."
        crumb="FAQ's"
      />
      <Container>
        <FaqAccordion items={faqs} />
      </Container>
    </div>
  );
}
