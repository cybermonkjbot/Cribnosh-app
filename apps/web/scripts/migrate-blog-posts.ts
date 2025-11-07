#!/usr/bin/env tsx
/**
 * Migration script to migrate hardcoded blog posts from posts.ts to Convex database
 * 
 * This script:
 * 1. Reads posts from lib/byus/posts.ts
 * 2. Uploads images from public directory to Convex storage
 * 3. Transforms post data to match the new schema
 * 4. Creates blog posts in the database
 * 
 * Usage:
 *   tsx scripts/migrate-blog-posts.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { getConvexClient, api } from '../lib/conxed-client';
import { POSTS, type ByUsPost } from '../lib/byus/posts';

// Load environment variables from .env.local or .env
config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env') });

// Track uploaded images to avoid re-uploading
const imageCache = new Map<string, string>();

/**
 * Upload an image file to Convex storage
 */
async function uploadImageToConvex(
  imagePath: string,
  convex: ReturnType<typeof getConvexClient>
): Promise<string> {
  // Check cache first
  if (imageCache.has(imagePath)) {
    return imageCache.get(imagePath)!;
  }

  // Resolve the actual file path
  const publicPath = path.join(process.cwd(), 'public', imagePath);
  
  // Check if file exists
  if (!fs.existsSync(publicPath)) {
    console.warn(`⚠️  Image not found: ${imagePath}, using original path`);
    imageCache.set(imagePath, imagePath);
    return imagePath;
  }

  try {
    // Read the file
    const fileBuffer = fs.readFileSync(publicPath);
    const fileStats = fs.statSync(publicPath);
    const fileName = path.basename(imagePath);
    const mimeType = getMimeType(fileName);

    // Generate upload URL
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

    // Upload to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${imagePath}: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    if (!result.storageId) {
      throw new Error(`No storageId in upload response for ${imagePath}`);
    }

    // Store the Convex storage URL
    const storageUrl = `/api/files/${result.storageId}`;
    imageCache.set(imagePath, storageUrl);
    
    console.log(`✅ Uploaded: ${imagePath} -> ${storageUrl}`);
    return storageUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${imagePath}:`, error);
    // Fallback to original path
    imageCache.set(imagePath, imagePath);
    return imagePath;
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Upload all images in a post (cover image, section images, author avatar)
 */
async function uploadPostImages(
  post: ByUsPost,
  convex: ReturnType<typeof getConvexClient>
): Promise<{
  coverImage: string;
  featuredImage: string;
  authorAvatar: string;
  sections: Array<{
    image?: string;
    video?: string;
    videoThumbnail?: string;
  }>;
}> {
  // Upload cover image
  const coverImage = await uploadImageToConvex(post.coverImage, convex);
  
  // Upload author avatar
  const authorAvatar = await uploadImageToConvex(post.author.avatar, convex);

  // Upload section images and videos
  const sections = await Promise.all(
    (post.sections || []).map(async (section) => {
      const uploaded: {
        image?: string;
        video?: string;
        videoThumbnail?: string;
      } = {};

      if (section.image) {
        uploaded.image = await uploadImageToConvex(section.image, convex);
      }

      if (section.video) {
        uploaded.video = await uploadImageToConvex(section.video, convex);
      }

      if (section.videoThumbnail) {
        uploaded.videoThumbnail = await uploadImageToConvex(section.videoThumbnail, convex);
      }

      return uploaded;
    })
  );

  return {
    coverImage,
    featuredImage: coverImage, // Use cover image as featured image
    authorAvatar,
    sections,
  };
}

/**
 * Transform a post from the old format to the new database format
 */
async function transformPost(
  post: ByUsPost,
  convex: ReturnType<typeof getConvexClient>
): Promise<Parameters<typeof api.mutations.blog.createBlogPost>[0]> {
  // Upload all images
  const uploadedImages = await uploadPostImages(post, convex);

  // Transform sections with uploaded images
  const transformedSections = post.sections?.map((section, index) => ({
    ...section,
    image: uploadedImages.sections[index]?.image || section.image,
    video: uploadedImages.sections[index]?.video || section.video,
    videoThumbnail: uploadedImages.sections[index]?.videoThumbnail || section.videoThumbnail,
  }));

  // Generate HTML content from body and sections
  // This is a simple transformation - in production, you might want more sophisticated HTML generation
  const content = generateHTMLContent(post.body, transformedSections);

  return {
    title: post.title,
    slug: post.slug,
    content, // Rich HTML content
    excerpt: post.description,
    body: post.body,
    sections: transformedSections,
    headings: post.headings,
    author: {
      name: post.author.name,
      avatar: uploadedImages.authorAvatar,
    },
    categories: post.categories,
    date: post.date,
    coverImage: uploadedImages.coverImage,
    featuredImage: uploadedImages.featuredImage,
    tags: [], // No tags in old format
    status: 'published', // All existing posts should be published
  };
}

/**
 * Generate HTML content from body paragraphs and sections
 */
function generateHTMLContent(
  body: string[],
  sections?: Array<{
    id: string;
    title: string;
    paragraphs?: string[];
    bullets?: string[];
    checklist?: string[];
    proTips?: string[];
    callout?: { variant: 'note' | 'warning' | 'tip'; text: string };
    image?: string;
    imageAlt?: string;
    video?: string;
    videoThumbnail?: string;
  }>
): string {
  let html = '';

  // Add body paragraphs
  body.forEach((paragraph) => {
    html += `<p>${escapeHtml(paragraph)}</p>\n`;
  });

  // Add sections
  sections?.forEach((section) => {
    html += `<section id="${section.id}">\n`;
    html += `<h2>${escapeHtml(section.title)}</h2>\n`;

    // Add paragraphs
    section.paragraphs?.forEach((p) => {
      html += `<p>${escapeHtml(p)}</p>\n`;
    });

    // Add bullets
    if (section.bullets && section.bullets.length > 0) {
      html += '<ul>\n';
      section.bullets.forEach((bullet) => {
        html += `<li>${escapeHtml(bullet)}</li>\n`;
      });
      html += '</ul>\n';
    }

    // Add checklist
    if (section.checklist && section.checklist.length > 0) {
      html += '<ul>\n';
      section.checklist.forEach((item) => {
        html += `<li>${escapeHtml(item)}</li>\n`;
      });
      html += '</ul>\n';
    }

    // Add pro tips
    if (section.proTips && section.proTips.length > 0) {
      html += '<div class="pro-tips">\n';
      html += '<p><strong>Pro tips</strong></p>\n';
      html += '<ul>\n';
      section.proTips.forEach((tip) => {
        html += `<li>${escapeHtml(tip)}</li>\n`;
      });
      html += '</ul>\n';
      html += '</div>\n';
    }

    // Add callout
    if (section.callout) {
      const variantClass = section.callout.variant;
      html += `<div class="callout callout-${variantClass}">\n`;
      html += `<p>${escapeHtml(section.callout.text)}</p>\n`;
      html += '</div>\n';
    }

    // Add image
    if (section.image) {
      html += `<img src="${escapeHtml(section.image)}" alt="${escapeHtml(section.imageAlt || section.title)}" />\n`;
    }

    // Add video
    if (section.video) {
      html += `<video src="${escapeHtml(section.video)}" controls`;
      if (section.videoThumbnail) {
        html += ` poster="${escapeHtml(section.videoThumbnail)}"`;
      }
      html += '></video>\n';
    }

    html += '</section>\n';
  });

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Main migration function
 */
async function migratePosts() {
  console.log('🚀 Starting blog post migration...\n');

  const convex = getConvexClient();

  // Check if posts already exist
  const existingPosts = await convex.query(api.queries.blog.getBlogPosts, {
    status: 'published',
  });

  if (existingPosts && existingPosts.length > 0) {
    console.log(`⚠️  Found ${existingPosts.length} existing posts in database.`);
    console.log('   This script will skip posts that already exist (by slug).\n');
  }

  const existingSlugs = new Set(
    existingPosts?.map((p: any) => p.slug) || []
  );

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    console.log(`\n[${i + 1}/${POSTS.length}] Processing: ${post.title}`);

    // Skip if already exists
    if (existingSlugs.has(post.slug)) {
      console.log(`   ⏭️  Skipping (already exists): ${post.slug}`);
      skipCount++;
      continue;
    }

    try {
      // Transform post
      const transformedPost = await transformPost(post, convex);

      // Create blog post
      await convex.mutation(api.mutations.blog.createBlogPost, transformedPost);

      console.log(`   ✅ Created: ${post.slug}`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`   ❌ Error creating ${post.slug}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${POSTS.length}`);
  console.log('='.repeat(50) + '\n');

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run migration
migratePosts().catch((error: any) => {
  console.error('❌ Migration failed:', error.message || error);
  if (error.message?.includes('Could not find public function')) {
    console.error('\n💡 Tip: Make sure Convex is running. Run one of:');
    console.error('   - npx convex dev (for development)');
    console.error('   - npx convex deploy (for production)');
  }
  process.exit(1);
});

