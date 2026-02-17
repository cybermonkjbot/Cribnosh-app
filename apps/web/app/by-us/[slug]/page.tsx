import { JsonLd } from "@/components/JsonLd";
import { BlogContent } from "@/components/blog/blog-content";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
  /*
  const convex = getConvexClient();
  try {
    // @ts-ignore - TypeScript has issues with deep type instantiation for Convex queries
    const posts = await convex.query(api.queries.blog.getBlogPosts, {
      status: "published",
    });
    if (!posts || !Array.isArray(posts)) return [];
    return posts
      .filter((post: any) => post && post.slug && typeof post.slug === 'string')
      .map((post: any) => ({ slug: post.slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
  */
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
    // Check if this is a CribNosh Team post
    const author = post.author && typeof post.author === 'object' ? post.author : null;
    const authorName = author && typeof author.name === 'string' ? author.name : '';
    const isCribNoshTeam = !authorName ||
      authorName.trim() === '' ||
      authorName.toLowerCase() === 'cribnosh team' ||
      authorName.toLowerCase() === 'cribnosh editorial';
    const displayAuthorName = isCribNoshTeam ? 'CribNosh Team' : authorName;

    const title = post.title && typeof post.title === 'string' ? post.title : 'Untitled';
    const description = (post.excerpt && typeof post.excerpt === 'string' ? post.excerpt : '') ||
      (post.seoDescription && typeof post.seoDescription === 'string' ? post.seoDescription : '') ||
      '';
    const imageUrl = (post.coverImage && typeof post.coverImage === 'string' && post.coverImage.trim() !== '')
      ? post.coverImage
      : (post.featuredImage && typeof post.featuredImage === 'string' && post.featuredImage.trim() !== '')
        ? post.featuredImage
        : '';

    // Generate keywords from categories and tags
    const keywords = [
      ...(post.categories || []),
      ...(post.tags || []),
      "CribNosh",
      "Food Delivery",
      "Home Cooked Meals"
    ].filter(k => typeof k === 'string' && k.trim() !== '');

    return {
      title: `${title} | CribNosh`,
      description,
      keywords: keywords.join(', '),
      openGraph: {
        title: `${title} | CribNosh`,
        description,
        images: imageUrl ? [imageUrl] : [],
        type: 'article',
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        authors: [displayAuthorName],
        tags: keywords
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | CribNosh`,
        description,
        images: imageUrl ? [imageUrl] : []
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

  // Check if this is a CribNosh Team post (staff-authored)
  const author = post.author && typeof post.author === 'object' ? post.author : null;
  const authorName = author && typeof author.name === 'string' ? author.name : '';
  const isCribNoshTeam = !authorName ||
    authorName.trim() === '' ||
    authorName.toLowerCase() === 'cribnosh team' ||
    authorName.toLowerCase() === 'cribnosh editorial';
  const displayAuthorName = isCribNoshTeam ? 'CribNosh Team' : authorName;
  const displayAvatar = isCribNoshTeam ? '/card-images/IMG_2262.png' : (author?.avatar || '/card-images/IMG_2262.png');

  // Generate keywords for Schema
  const schemaKeywords = [
    ...(post.categories || []),
    ...(post.tags || [])
  ].filter(k => typeof k === 'string' && k.trim() !== '').join(', ');

  // Get related posts
  let relatedPosts: any[] = [];
  try {
    // Add limit to prevent fetching all posts (50 max for related posts)
    // @ts-ignore - TypeScript has issues with deep type instantiation for Convex queries
    const allPosts = await convex.query(api.queries.blog.getBlogPosts, {
      status: "published",
      limit: 50,
    });
    if (allPosts && Array.isArray(allPosts)) {
      relatedPosts = allPosts
        .filter((p: any) => {
          if (!p || !p.slug || p.slug === slug) return false;
          if (!p.categories || !Array.isArray(p.categories)) return false;
          if (!post.categories || !Array.isArray(post.categories)) return false;
          // Filter out non-string categories and check for matches
          const pCategories = p.categories.filter((c: any) => typeof c === 'string');
          const postCategories = post.categories.filter((c: any) => typeof c === 'string');
          return pCategories.some((c: string) => postCategories.includes(c));
        })
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
            headline: (post.title && typeof post.title === 'string') ? post.title : 'Untitled',
            description: (post.excerpt && typeof post.excerpt === 'string' ? post.excerpt : '') ||
              (post.seoDescription && typeof post.seoDescription === 'string' ? post.seoDescription : '') ||
              '',
            keywords: schemaKeywords,
            image: (() => {
              const coverImg = post.coverImage && typeof post.coverImage === 'string' && post.coverImage.trim() !== '' ? post.coverImage : null;
              const featuredImg = post.featuredImage && typeof post.featuredImage === 'string' && post.featuredImage.trim() !== '' ? post.featuredImage : null;
              return coverImg || featuredImg || '';
            })(),
            author: {
              "@type": "Organization",
              name: displayAuthorName
            },
            datePublished: (post.date && typeof post.date === 'string' ? post.date : '') ||
              (post.publishedAt && typeof post.publishedAt === 'number' && !isNaN(post.publishedAt)
                ? new Date(post.publishedAt).toISOString()
                : ''),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://cribnosh.com/by-us/${slug || ''}`
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
              {post.headings
                .filter((h: any) => h && typeof h === 'object' && typeof h.id === 'string' && typeof h.text === 'string')
                .map((h: { id: string; text: string }) => (
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
            {(() => {
              const coverImg = post.coverImage && typeof post.coverImage === 'string' ? post.coverImage : null;
              const featuredImg = post.featuredImage && typeof post.featuredImage === 'string' ? post.featuredImage : null;
              const imageUrl = coverImg || featuredImg;
              const hasImage = imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '';
              const title = (post.title && typeof post.title === 'string') ? post.title : 'Blog post';

              if (!hasImage) {
                return (
                  <Image
                    src="/backgrounds/masonry-1.jpg"
                    alt={title}
                    fill
                    className="object-cover"
                  />
                );
              }

              if (typeof imageUrl === 'string' && imageUrl.startsWith('/api/files/')) {
                // Use regular img tag for API redirect URLs with fill layout
                return (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                  />
                );
              }

              // Use Next.js Image for direct URLs
              return (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover"
                />
              );
            })()}
          </div>
          <h1 className="font-asgard text-3xl md:text-4xl mb-3">
            {(post.title && typeof post.title === 'string') ? post.title : 'Untitled'}
          </h1>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              {(() => {
                const avatarUrl = displayAvatar;
                const hasAvatar = avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '';

                if (!hasAvatar || isCribNoshTeam) {
                  return (
                    <Image
                      src="/card-images/IMG_2262.png"
                      alt={displayAuthorName}
                      fill
                      className="object-cover"
                    />
                  );
                }

                if (typeof avatarUrl === 'string' && avatarUrl.startsWith('/api/files/')) {
                  return (
                    <img
                      src={avatarUrl}
                      alt={displayAuthorName}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  );
                }

                return (
                  <Image
                    src={avatarUrl}
                    alt={displayAuthorName}
                    fill
                    className="object-cover"
                  />
                );
              })()}
            </div>
            <span className="font-satoshi">{displayAuthorName}</span>
            <span className="opacity-60">•</span>
            <span className="font-satoshi">
              {post.date || (post.createdAt && !isNaN(post.createdAt)
                ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '')}
            </span>
          </div>
        </header>

        <div className="prose prose-neutral max-w-none font-satoshi">
          {/* Render rich content from editor */}
          {post.content && typeof post.content === 'string' && post.content.trim() !== '' && (
            <BlogContent content={post.content} />
          )}

          {/* Render body paragraphs if available */}
          {post.body && Array.isArray(post.body) && post.body.length > 0 && (
            <>
              {post.body
                .filter((paragraph: any) => paragraph && typeof paragraph === 'string' && paragraph.trim() !== '')
                .map((paragraph: string, idx: number) => {
                  const headingId = post.headings && Array.isArray(post.headings) && post.headings[idx] &&
                    typeof post.headings[idx] === 'object' &&
                    typeof post.headings[idx].id === 'string'
                    ? post.headings[idx].id
                    : undefined;
                  return (
                    <p key={`p-${idx}`} id={headingId}>
                      {paragraph}
                    </p>
                  );
                })}
            </>
          )}

          {/* Render sections if available */}
          {post.sections && Array.isArray(post.sections) && post.sections.length > 0 && (
            <>
              {post.sections
                .filter((section: any) => section && typeof section === 'object' &&
                  section.id && typeof section.id === 'string')
                .map((section: any) => {
                  const sectionId = typeof section.id === 'string' ? section.id : `section-${Math.random()}`;
                  const sectionTitle = (section.title && typeof section.title === 'string') ? section.title : 'Untitled Section';

                  return (
                    <section key={sectionId} id={sectionId} className="mt-8">
                      <h2 className="font-asgard text-2xl mb-2">{sectionTitle}</h2>
                      {section.paragraphs && Array.isArray(section.paragraphs) &&
                        section.paragraphs
                          .filter((p: any) => p && typeof p === 'string' && p.trim() !== '')
                          .map((p: string, i: number) => (
                            <p key={`${sectionId}-p-${i}`}>{p}</p>
                          ))}
                      {section.image && typeof section.image === 'string' && section.image.trim() !== '' && (
                        <div className="my-6 rounded-xl overflow-hidden">
                          {section.image.startsWith('/api/files/') ? (
                            // Use regular img tag for API redirect URLs
                            <img
                              src={section.image}
                              alt={(section.imageAlt && typeof section.imageAlt === 'string' ? section.imageAlt : '') || sectionTitle}
                              className="w-full h-auto object-cover"
                              loading="lazy"
                            />
                          ) : (
                            // Use Next.js Image for direct URLs
                            <Image
                              src={section.image}
                              alt={(section.imageAlt && typeof section.imageAlt === 'string' ? section.imageAlt : '') || sectionTitle}
                              width={800}
                              height={600}
                              className="w-full h-auto object-cover"
                            />
                          )}
                        </div>
                      )}
                      {section.video && typeof section.video === 'string' && section.video.trim() !== '' && (
                        <div className="my-6 rounded-xl overflow-hidden">
                          <video
                            src={section.video}
                            controls
                            className="w-full h-auto"
                            poster={(section.videoThumbnail && typeof section.videoThumbnail === 'string') ? section.videoThumbnail : undefined}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      {section.bullets && Array.isArray(section.bullets) && section.bullets.length > 0 && (
                        <ul className="list-disc pl-6">
                          {section.bullets
                            .filter((b: any) => b && typeof b === 'string' && b.trim() !== '')
                            .map((b: string, i: number) => (
                              <li key={`${sectionId}-b-${i}`}>{b}</li>
                            ))}
                        </ul>
                      )}
                      {section.checklist && Array.isArray(section.checklist) && section.checklist.length > 0 && (
                        <ul className="list-disc pl-6">
                          {section.checklist
                            .filter((c: any) => c && typeof c === 'string' && c.trim() !== '')
                            .map((c: string, i: number) => (
                              <li key={`${sectionId}-c-${i}`}>{c}</li>
                            ))}
                        </ul>
                      )}
                      {section.proTips && Array.isArray(section.proTips) && section.proTips.length > 0 && (
                        <div className="mt-3 p-4 rounded-xl bg-[#ff3b30]/5 border border-[#ff3b30]/20">
                          <p className="font-satoshi text-sm font-medium text-[#ff3b30] mb-1">Pro tips</p>
                          <ul className="list-disc pl-6">
                            {section.proTips
                              .filter((t: any) => t && typeof t === 'string' && t.trim() !== '')
                              .map((t: string, i: number) => (
                                <li key={`${sectionId}-t-${i}`}>{t}</li>
                              ))}
                          </ul>
                        </div>
                      )}
                      {section.callout && typeof section.callout === 'object' && section.callout.text && typeof section.callout.text === 'string' && (
                        <div className={`mt-3 p-4 rounded-xl border ${section.callout.variant === 'warning'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                          : section.callout.variant === 'tip'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                          }`}>
                          <p className="text-sm">{section.callout.text}</p>
                        </div>
                      )}
                    </section>
                  );
                })}
            </>
          )}
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h3 className="font-asgard text-2xl mb-4">Related posts</h3>
            <div className="flex flex-wrap gap-2">
              {relatedPosts
                .filter((p: any) => p && p.slug && typeof p.slug === 'string' && p.title && typeof p.title === 'string')
                .map((p: any) => (
                  <Link key={p.slug} href={`/by-us/${p.slug}`} className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-satoshi hover:bg-neutral-200">
                    {p.title}
                  </Link>
                ))}
            </div>
          </section>
        )}

        <footer className="mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            {post.categories && Array.isArray(post.categories) &&
              post.categories
                .filter((c: any) => c && typeof c === 'string' && c.trim() !== '')
                .map((c: string) => (
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
