import { Suspense } from "react";
import { ParallaxGroup, ParallaxLayer } from '@/components/ui/parallax';
import Image from "next/image";
import { SearchContent, SearchLoadingState } from "@/components/try-it";
import { env } from '@/lib/config/env';
import { redirect } from 'next/navigation';

/**
 * Renders the Try It page with a parallax background and interactive search content.
 *
 * If the Try It feature is disabled via environment configuration, users are redirected to the waitlist page.
 *
 * The page features layered parallax backgrounds with images and color effects, and displays the main search content within a suspense boundary.
 *
 * @returns The JSX for the Try It page, or triggers a redirect if disabled.
 */
export default function TryItPage() {
  // Redirect to waitlist if Try It feature is disabled
  if (env.DISABLE_TRY_IT) {
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