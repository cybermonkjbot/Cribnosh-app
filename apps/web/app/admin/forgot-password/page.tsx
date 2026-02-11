import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function AdminForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden p-4">
            <div className="pointer-events-none select-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#ff3b30]/15 blur-3xl z-0" />
            <div className="pointer-events-none select-none absolute bottom-0 right-0 w-[320px] h-[320px] rounded-full bg-[#ff5e54]/10 blur-2xl z-0" />
            <div className="relative z-10 w-full flex justify-center">
                <ForgotPasswordForm role="admin" />
            </div>
        </div>
    );
}
