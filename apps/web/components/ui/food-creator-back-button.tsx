"use client";

import { useRouter } from 'next/navigation';

export function ChefBackButton() {
    const router = useRouter();
    return (
        <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="fixed top-4 left-4 z-50 bg-white/80 backdrop-blur border border-gray-200 rounded-full p-2 shadow-md hover:bg-white hover:scale-105 transition-all"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-900">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
    );
}
