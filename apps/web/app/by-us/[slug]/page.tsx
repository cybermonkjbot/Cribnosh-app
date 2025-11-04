import { JsonLd } from "@/components/JsonLd";
import { getAllSlugs, getPostBySlug } from "@/lib/byus/posts";
import { sanitizeByUsPost } from "@/lib/utils/content-sanitizer";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type Params = { slug: string };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found | CribNosh" };
  return {
    title: `${post.title} | CribNosh`,
    description: post.description,
    openGraph: {
      title: `${post.title} | CribNosh`,
      description: post.description,
      images: [post.coverImage]
    }
  };
}

export default async function ByUsPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const rawPost = getPostBySlug(slug);
  if (!rawPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-asgard text-3xl">Post not found</h1>
          <Link href="/by-us" className="text-[#ff3b30] underline">Back to By Us</Link>
        </div>
      </div>
    );
  }

  // Sanitize the post content to fix any character encoding issues
  const post = sanitizeByUsPost(rawPost);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
            description: post.description,
            image: post.coverImage,
            author: { "@type": "Organization", name: post.author.name },
            datePublished: post.date,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://cribnosh.com/by-us/${slug}`
            }
          })
        }}
      />
      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Table of contents (if available) */}
        {post.headings && post.headings.length > 0 && (
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
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
          <h1 className="font-asgard text-3xl md:text-4xl mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
            </div>
            <span className="font-satoshi">{post.author.name}</span>
            <span className="opacity-60">•</span>
            <span className="font-satoshi">{post.date}</span>
          </div>
        </header>

        <p className="font-satoshi text-lg text-neutral-700 mb-6">{post.description}</p>

        <div className="prose prose-neutral max-w-none font-satoshi">
          {post.body.map((paragraph: string, idx: number) => (
            <p key={`p-${idx}`} id={post.headings && post.headings[idx] ? post.headings[idx].id : undefined}>
              {paragraph}
            </p>
          ))}
          {post.sections?.map((section) => (
            <section key={section.id} id={section.id} className="mt-8">
              <h2 className="font-asgard text-2xl mb-2">{section.title}</h2>
              {section.paragraphs.map((p: string, i: number) => (
                <p key={`${section.id}-p-${i}`}>{p}</p>
              ))}
              {section.image && (
                <div className="my-6 rounded-xl overflow-hidden">
                  <Image 
                    src={section.image} 
                    alt={section.imageAlt || section.title} 
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
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
              {section.bullets && section.bullets.length > 0 && (
                <ul className="list-disc pl-6">
                  {section.bullets.map((b: string, i: number) => (
                    <li key={`${section.id}-b-${i}`}>{b}</li>
                  ))}
                </ul>
              )}
              {section.checklist && section.checklist.length > 0 && (
                <ul className="list-disc pl-6">
                  {section.checklist.map((c: string, i: number) => (
                    <li key={`${section.id}-c-${i}`}>{c}</li>
                  ))}
                </ul>
              )}
              {section.proTips && section.proTips.length > 0 && (
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
        </div>

        {/* Related posts */}
        <section className="mt-12">
          <h3 className="font-asgard text-2xl mb-4">Related posts</h3>
          <div className="flex flex-wrap gap-2">
            {(getAllSlugs()
              .filter((s) => s !== slug)
              .map((s) => getPostBySlug(s)!)
              .filter((p) => p.categories.some((c) => post.categories.includes(c)))
              .slice(0, 6))
              .map((p) => (
                <Link key={p.slug} href={`/by-us/${p.slug}`} className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-satoshi hover:bg-neutral-200">
                  {p.title}
                </Link>
              ))}
          </div>
        </section>

        <footer className="mt-10 flex items-center justify-between">
          <div className="flex gap-2">
            {post.categories.map((c: string) => (
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


