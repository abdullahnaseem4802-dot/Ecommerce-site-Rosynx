import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, User } from "lucide-react";
import { fetchBlogPosts } from "@/lib/catalog";
import { blogImage, formatBlogDate } from "@/lib/content";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";

export const metadata: Metadata = {
  title: "Journal — ROSYNX",
  description: "Stories of craft, makers and styling from the ROSYNX journal.",
};

export default async function BlogsPage() {
  const posts = await fetchBlogPosts();

  return (
    <div className="pb-20">
      <PageBanner
        title="The Journal"
        subtitle="Stories of craft, makers and styling inspiration."
        crumb="Blogs"
      />
      <Container>
        {posts.length === 0 ? (
          <p className="py-16 text-center text-muted">
            No articles yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <div className="relative h-56 overflow-hidden rounded-2xl">
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
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> {post.author}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-espresso transition group-hover:text-brand">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-sm text-coffee/70">
                    {post.excerpt}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition group-hover:gap-2.5">
                    Read More <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
