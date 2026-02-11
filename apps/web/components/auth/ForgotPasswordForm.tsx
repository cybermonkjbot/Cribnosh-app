'use client';

import { Link } from '@/components/link';
import { GlassCard } from '@/components/ui/glass-card';
import { api } from '@/convex/_generated/api';
import { useAction } from 'convex/react';
import { AlertCircle, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { useState } from 'react';


interface ForgotPasswordFormProps {
    role: 'admin' | 'staff';
}

export default function ForgotPasswordForm({ role }: ForgotPasswordFormProps) {
    const sendResetEmail = useAction(api.actions.password_reset_action.sendPasswordResetEmail);
    const [email, setEmail] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await sendResetEmail({
                email: email.trim().toLowerCase(),
                role: role as "admin" | "staff",
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Operation failed. Please try again.');
        } finally {
            setLoading(false);
        }

    };

    if (success) {
        return (
            <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-asgard text-gray-900 mb-4">Request Sent!</h1>
                <p className="text-gray-700 font-satoshi mb-6">
                    If an account exists for <strong>{email}</strong>, you will receive an email with instructions to reset your password shortly.
                </p>
                <Link
                    href={`/${role}/login`}
                    className="text-[#ff3b30] hover:text-[#ff5e54] font-asgard text-lg"
                >
                    Return to Login
                </Link>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-10 flex items-center justify-center mb-4">
                    <img src="/logo.svg" alt="CribNosh Logo" className="h-10 w-auto" />
                </div>
                <h1 className="text-xl sm:text-2xl font-asgard text-gray-900 mb-2">Forgot Password?</h1>
                <p className="text-sm font-satoshi text-center text-gray-700">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 font-satoshi">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-900 font-satoshi mb-2" htmlFor="email">Email Address</label>
                    <div className="relative">
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 pl-12 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 font-satoshi focus:outline-none focus:ring-2 focus:ring-[#ff3b30] transition-all"
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                        <Mail className="w-5 h-5 text-[#ff3b30] absolute left-4 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-[#ff3b30] text-white hover:bg-[#ff5e54] active:scale-95 transition-all duration-150 rounded-xl font-asgard text-lg shadow-lg disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <Link
                    href={`/${role}/login`}
                    className="inline-flex items-center text-sm font-satoshi text-gray-600 hover:text-[#ff3b30] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                </Link>
            </div>
        </GlassCard>
    );
}
