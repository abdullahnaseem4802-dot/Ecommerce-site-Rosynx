import { Hero } from "@/components/home/hero";
import { CategoryStrip } from "@/components/home/category-strip";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { ShopByMaterial } from "@/components/home/shop-by-material";
import { PromoBanner } from "@/components/home/promo-banner";
import { NewArrivals } from "@/components/home/new-arrivals";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { Testimonials } from "@/components/home/testimonials";
import { NewsletterCTA } from "@/components/home/newsletter-cta";
import { LatestBlog } from "@/components/home/latest-blog";

export default function Home() {
  return (
    <div className="pb-4">
      <Hero />
      <CategoryStrip />
      <FeaturedCategories />
      <ShopByMaterial />
      <PromoBanner />
      <NewArrivals />
      <WhyChooseUs />
      <Testimonials />
      <NewsletterCTA />
      <LatestBlog />
    </div>
  );
}
