import { JsonLd } from "@/components/JsonLd";
import { useSessionToken } from '@/hooks/useSessionToken';
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogContent } from "@/components/blog/blog-content";

type Params = { slug: string };

export async function generateStaticParams() {
  const convex = getConvexClient();
  try {
    const posts = await convex.query(api.queries.blog.getBlogPosts, {
      status: "published",
    });
    if (!posts || !Array.isArray(posts)) return [];
    return posts.map((post: any) => ({ slug: post.slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const convex = getConvexClient();
  try {
    const post = await convex.query(api.queries.blog.getBlogPostBySlug, { slug });
    // Only generate metadata for published posts
    if (!post || post.status !== 'published') {
      return { title: "Post not found | CribNosh" };
    }
    return {
      title: `${post.title} | CribNosh`,
      description: post.excerpt || post.seoDescription || '',
      openGraph: {
        title: `${post.title} | CribNosh`,
        description: post.excerpt || post.seoDescription || '',
        images: [post.coverImage || post.featuredImage || '']
      }
    };
  } catch (error) {
    return { title: "Post not found | CribNosh" };
  }
}

export default async function ByUsPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const convex = getConvexClient();
  
  let post: any;
  try {
    post = await convex.query(api.queries.blog.getBlogPostBySlug, { slug });
  } catch (error) {
    console.error('Error fetching post:', error);
    post = null;
  }

  // Only show published posts - return 404 for draft or archived posts
  if (!post || post.status !== 'published') {
    notFound();
  }

  // Get related posts
  let relatedPosts: any[] = [];
  try {
    // Add limit to prevent fetching all posts (50 max for related posts)
    const allPosts = await convex.query(api.queries.blog.getBlogPosts, {
      status: "published",
      limit: 50,
    });
    if (allPosts && Array.isArray(allPosts)) {
      relatedPosts = allPosts
        .filter((p: any) => p.slug !== slug && p.categories && post.categories && 
          p.categories.some((c: string) => post.categories.includes(c)))
        .slice(0, 6);
    }
  } catch (error) {
    console.error('Error fetching related posts:', error);
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-white to-gray-50">
      {/* Global Org & Website JSON-LD */}
      <JsonLd />
      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt || post.seoDescription || '',
            image: post.coverImage || post.featuredImage || '',
            author: { "@type": "Organization", name: post.author?.name || 'CribNosh Editorial' },
            datePublished: post.date || (post.publishedAt ? new Date(post.publishedAt).toISOString() : ''),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://cribnosh.com/by-us/${slug}`
            }
          })
        }}
      />
      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Table of contents (if available) */}
        {post.headings && Array.isArray(post.headings) && post.headings.length > 0 && (
          <nav className="mb-6 p-4 rounded-xl bg-neutral-100/60 border border-neutral-200">
            <p className="font-satoshi text-sm text-neutral-700 mb-3">On this page</p>
            <ul className="space-y-2">
              {post.headings.map((h: { id: string; text: string }) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="text-[#ff3b30] font-satoshi text-sm">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <header className="mb-8">
          <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-6">
            {(post.coverImage || post.featuredImage)?.startsWith('/api/files/') ? (
              // Use regular img tag for API redirect URLs with fill layout
              <img 
                src={post.coverImage || post.featuredImage || '/backgrounds/masonry-1.jpg'} 
                alt={post.title} 
                className="absolute inset-0 w-full h-full object-cover" 
                loading="eager"
              />
            ) : (
              <Image 
                src={post.coverImage || post.featuredImage || '/backgrounds/masonry-1.jpg'} 
                alt={post.title} 
                fill 
                className="object-cover" 
              />
            )}
          </div>
          <h1 className="font-asgard text-3xl md:text-4xl mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image 
                src={post.author?.avatar || '/card-images/IMG_2262.png'} 
                alt={post.author?.name || 'CribNosh Editorial'} 
                fill 
                className="object-cover" 
              />
            </div>
            <span className="font-satoshi">{post.author?.name || 'CribNosh Editorial'}</span>
            <span className="opacity-60">•</span>
            <span className="font-satoshi">{post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '')}</span>
          </div>
        </header>

        <div className="prose prose-neutral max-w-none font-satoshi">
          {/* Render rich content from editor */}
          {post.content && <BlogContent content={post.content} />}

          {/* Render body paragraphs if available */}
          {post.body && Array.isArray(post.body) && post.body.length > 0 && (
            <>
              {post.body.map((paragraph: string, idx: number) => (
                <p key={`p-${idx}`} id={post.headings && Array.isArray(post.headings) && post.headings[idx] ? post.headings[idx].id : undefined}>
                  {paragraph}
                </p>
              ))}
            </>
          )}

          {/* Render sections if available */}
          {post.sections && Array.isArray(post.sections) && post.sections.length > 0 && (
            <>
              {post.sections.map((section: any) => (
                <section key={section.id} id={section.id} className="mt-8">
                  <h2 className="font-asgard text-2xl mb-2">{section.title}</h2>
                  {section.paragraphs && Array.isArray(section.paragraphs) && section.paragraphs.map((p: string, i: number) => (
                    <p key={`${section.id}-p-${i}`}>{p}</p>
                  ))}
                  {section.image && (
                    <div className="my-6 rounded-xl overflow-hidden">
                      {section.image.startsWith('/api/files/') ? (
                        // Use regular img tag for API redirect URLs
                        <img 
                          src={section.image} 
                          alt={section.imageAlt || section.title} 
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                      ) : (
                        // Use Next.js Image for direct URLs
                        <Image 
                          src={section.image} 
                          alt={section.imageAlt || section.title} 
                          width={800}
                          height={600}
                          className="w-full h-auto object-cover"
                        />
                      )}
                    </div>
                  )}
                  {section.video && (
                    <div className="my-6 rounded-xl overflow-hidden">
                      <video 
                        src={section.video}
                        controls
                        className="w-full h-auto"
                        poster={section.videoThumbnail}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  {section.bullets && Array.isArray(section.bullets) && section.bullets.length > 0 && (
                    <ul className="list-disc pl-6">
                      {section.bullets.map((b: string, i: number) => (
                        <li key={`${section.id}-b-${i}`}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {section.checklist && Array.isArray(section.checklist) && section.checklist.length > 0 && (
                    <ul className="list-disc pl-6">
                      {section.checklist.map((c: string, i: number) => (
                        <li key={`${section.id}-c-${i}`}>{c}</li>
                      ))}
                    </ul>
                  )}
                  {section.proTips && Array.isArray(section.proTips) && section.proTips.length > 0 && (
                    <div className="mt-3 p-4 rounded-xl bg-[#ff3b30]/5 border border-[#ff3b30]/20">
                      <p className="font-satoshi text-sm font-medium text-[#ff3b30] mb-1">Pro tips</p>
                      <ul className="list-disc pl-6">
                        {section.proTips.map((t: string, i: number) => (
                          <li key={`${section.id}-t-${i}`}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {section.callout && (
                    <div className={`mt-3 p-4 rounded-xl border ${
                      section.callout.variant === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                        : section.callout.variant === 'tip'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                    }`}>
                      <p className="text-sm">{section.callout.text}</p>
                    </div>
                  )}
                </section>
              ))}
            </>
          )}
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h3 className="font-asgard text-2xl mb-4">Related posts</h3>
            <div className="flex flex-wrap gap-2">
              {relatedPosts.map((p: any) => (
                <Link key={p.slug} href={`/by-us/${p.slug}`} className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-satoshi hover:bg-neutral-200">
                  {p.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            {post.categories && Array.isArray(post.categories) && post.categories.map((c: string) => (
              <span key={c} className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-satoshi">
                {c}
              </span>
            ))}
          </div>
          <Link href="/by-us" className="text-[#ff3b30] font-satoshi">← Back</Link>
        </footer>
      </article>
    </main>
  );
}
