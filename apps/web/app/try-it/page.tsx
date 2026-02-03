import { SearchContent, SearchLoadingState } from "@/components/try-it";
import { ParallaxGroup, ParallaxLayer } from '@/components/ui/parallax';
import { env } from "@/lib/config/env";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

/**
 * Renders the Try It page with a parallax background and interactive search content.
 *
 * The page features layered parallax backgrounds with images and color effects, and displays the main search content within a suspense boundary.
 * 
 * In production, if DISABLE_TRY_IT is true, redirects to waitlist.
 * In development mode, always allows access regardless of DISABLE_TRY_IT setting.
 *
 * @returns The JSX for the Try It page or redirects to waitlist.
 */
export default function TryItPage() {
  // Check if try-it is disabled and we're not in development mode
  const isDisabled = env.DISABLE_TRY_IT === 'true';
  const isDevelopment = env.NODE_ENV === 'development';

  // Redirect to waitlist if disabled and not in development
  if (isDisabled && !isDevelopment) {
    redirect('/waitlist');
  }

  return (
    <main className="relative">
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0">
            {/* Original background image */}
            <div className="absolute inset-0 opacity-20">
              <Image
                src="/backgrounds/earlyaccess-background.png"
                alt="Background pattern"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100   opacity-80" />
          </div>
        </ParallaxLayer>

        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            {/* Brand color stains */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b72]  blur-[120px] -top-20 -right-20 opacity-20" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30]  blur-[100px] bottom-0 -left-20 opacity-20" />
          </div>
        </ParallaxLayer>

        {/* Content layer */}
        <div className="relative z-10">
          <Suspense fallback={<SearchLoadingState />}>
            <SearchContent />
          </Suspense>
        </div>
      </ParallaxGroup>
    </main>
  );
} 