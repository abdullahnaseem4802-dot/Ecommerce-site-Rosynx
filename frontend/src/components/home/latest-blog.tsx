import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { fetchBlogPosts } from "@/lib/catalog";
import { blogImage, formatBlogDate } from "@/lib/content";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

export async function LatestBlog() {
  const posts = (await fetchBlogPosts()).slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <Container className="pt-16">
      <Reveal>
        <SectionHeading title="From the Journal" viewAllHref="/blogs" />
      </Reveal>
      <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <RevealItem key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="relative h-52 overflow-hidden rounded-2xl">
                <Image
                  src={post.imageUrl || blogImage(post.category)}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-110"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-coffee backdrop-blur">
                  {post.category}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />{" "}
                    {formatBlogDate(post.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {post.readTime}
                  </span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-semibold text-espresso transition group-hover:text-brand">
                  {post.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-coffee/70">
                  {post.excerpt}
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-brand">
                  Read More →
                </span>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
