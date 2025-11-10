"use client";

import { BlogPostForm } from '@/components/admin/blog-post-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
    <div>
      {/* Back Button */}
      <div className="mb-4 px-6 pt-4">
        <Link href="/staff/blog" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>
      <BlogPostForm onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}

