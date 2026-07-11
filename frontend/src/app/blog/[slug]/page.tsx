import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, User } from "lucide-react";
import { fetchBlogPost, fetchBlogPosts } from "@/lib/catalog";
import { blogImage, formatBlogDate } from "@/lib/content";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ShareRow } from "@/components/blog/share-row";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) return { title: "Article not found — ROSYNX" };
  return {
    title: `${post.title} — ROSYNX Journal`,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) notFound();

  const paragraphs = post.content
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const all = await fetchBlogPosts();
  const related = all.filter((p) => p.slug !== slug).slice(0, 3);
  const cover = post.imageUrl || blogImage(post.category);

  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="relative h-[360px] w-full overflow-hidden">
        <Image
          src={cover}
          alt={post.title}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/40 to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-10">
          <span className="inline-block rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            {post.category}
          </span>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold text-cream sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-cream/80">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatBlogDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {post.readTime}
            </span>
          </div>
        </Container>
      </div>

      <Container className="py-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blogs", href: "/blogs" },
            { label: post.title },
          ]}
        />
      </Container>

      <Container>
        <article className="max-w-3xl space-y-6 text-coffee/80">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-6">
            <ShareRow />
          </div>
          {post.excerpt && (
            <p className="text-lg leading-relaxed text-coffee">{post.excerpt}</p>
          )}
          {paragraphs.map((p, i) => (
            <p key={i} className="leading-relaxed">
              {p}
            </p>
          ))}
        </article>
      </Container>

      {/* Related articles */}
      {related.length > 0 && (
        <Container className="pt-16">
          <h2 className="mb-6 font-serif text-2xl font-bold text-espresso sm:text-3xl">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {related.map((rp) => (
              <Link
                key={rp.id}
                href={`/blog/${rp.slug}`}
                className="group block"
              >
                <div className="relative h-56 overflow-hidden rounded-2xl">
                  <Image
                    src={rp.imageUrl || blogImage(rp.category)}
                    alt={rp.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-coffee backdrop-blur">
                    {rp.category}
                  </span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />{" "}
                      {formatBlogDate(rp.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {rp.readTime}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-espresso transition group-hover:text-brand">
                    {rp.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-coffee/70">
                    {rp.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      )}
    </div>
  );
}
