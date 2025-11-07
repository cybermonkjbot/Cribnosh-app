"use client";

import { BlogPostForm } from '@/components/admin/blog-post-form';
import { useRouter } from 'next/navigation';

export default function StaffBlogCreatePage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/staff/blog');
  };

  const handleCancel = () => {
    router.push('/staff/blog');
  };

  return (
    <BlogPostForm onSave={handleSave} onCancel={handleCancel} />
  );
}

