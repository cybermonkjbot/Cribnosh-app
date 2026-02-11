'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { api } from '@/convex/_generated/api';
import { useAction } from 'convex/react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';


interface ResetPasswordFormProps {
    role: 'admin' | 'staff';
}

export default function ResetPasswordForm({ role }: ResetPasswordFormProps) {
    const resetPassword = useAction(api.actions.password_reset_execution.resetPasswordWithToken);
    const router = useRouter();

    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new link.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await resetPassword({
                token,
                newPassword: password,
            });

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/${role}/login`);
                }, 3000);
            } else {
                setError(result.error || 'Reset failed. Your token may have expired.');
            }
        } catch (err: any) {
            setError(err.message || 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }

    };

    if (success) {
        return (
            <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-asgard text-gray-900 mb-4">Password Reset!</h1>
                <p className="text-gray-700 font-satoshi mb-6">
                    Your password has been successfully updated. You are being redirected to the login page...
                </p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff3b30] mx-auto"></div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-10 flex items-center justify-center mb-4">
                    <img src="/logo.svg" alt="CribNosh Logo" className="h-10 w-auto" />
                </div>
                <h1 className="text-xl sm:text-2xl font-asgard text-gray-900 mb-2">Reset Password</h1>
                <p className="text-sm font-satoshi text-center text-gray-700">
                    Enter your new password below to regain access to your account.
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
                    <label className="block text-sm font-medium text-gray-900 font-satoshi mb-2" htmlFor="password">New Password</label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 pl-12 pr-12 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 font-satoshi focus:outline-none focus:ring-2 focus:ring-[#ff3b30] transition-all"
                            placeholder="Min. 8 characters"
                            disabled={loading || !token}
                        />
                        <Lock className="w-5 h-5 text-[#ff3b30] absolute left-4 top-1/2 transform -translate-y-1/2" />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#ff3b30]"
                            disabled={loading || !token}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 font-satoshi mb-2" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="relative">
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 pl-12 pr-12 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 font-satoshi focus:outline-none focus:ring-2 focus:ring-[#ff3b30] transition-all"
                            placeholder="Repeat new password"
                            disabled={loading || !token}
                        />
                        <Lock className="w-5 h-5 text-[#ff3b30] absolute left-4 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-[#ff3b30] text-white hover:bg-[#ff5e54] active:scale-95 transition-all duration-150 rounded-xl font-asgard text-lg shadow-lg disabled:opacity-50"
                    disabled={loading || !token}
                >
                    {loading ? 'Resetting...' : 'Update Password'}
                </button>
            </form>
        </GlassCard>
    );
}
