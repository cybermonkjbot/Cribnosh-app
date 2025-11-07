"use client";

import { BlogPostForm } from '@/components/admin/blog-post-form';
import { Id } from '@/convex/_generated/dataModel';
import { useParams, useRouter } from 'next/navigation';

export default function StaffBlogEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as Id<"blogPosts">;

  const handleSave = () => {
    router.push('/staff/blog');
  };

  const handleCancel = () => {
    router.push('/staff/blog');
  };

  return (
    <BlogPostForm postId={postId} onSave={handleSave} onCancel={handleCancel} />
  );
}

