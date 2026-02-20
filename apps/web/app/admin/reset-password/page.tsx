import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden p-4">
            <div className="pointer-events-none select-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#ff3b30]/15 blur-3xl z-0" />
            <div className="pointer-events-none select-none absolute bottom-0 right-0 w-[320px] h-[320px] rounded-full bg-[#ff5e54]/10 blur-2xl z-0" />
            <div className="relative z-10 w-full flex justify-center">
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm role="admin" />
                </Suspense>
            </div>
        </div>
    );
}
