"use client";

import {
  FoodCreatorHero,
  FoodCreatorPerks,
  FoodCreatorProcess,
} from '@/components/cooking';
import { SharedKitchenIntro } from '@/components/cooking/shared-kitchen-intro';
import { ParallaxGroup, ParallaxLayer } from '@/components/ui/parallax';
import { useRouter } from 'next/navigation';

export default function BecomeAFoodCreatorPage() {
  const router = useRouter();

  const handleApplyClick = () => {
    router.push('/become-a-food-creator/apply');
  };

  return (
    <main className="relative">
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] opacity-90" />
        </ParallaxLayer>

        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-40" />
          </div>
        </ParallaxLayer>

        {/* Content layer */}
        <div className="relative z-10">
          <FoodCreatorHero />
          <FoodCreatorProcess />
          <FoodCreatorPerks />
          <SharedKitchenIntro />
        </div>
      </ParallaxGroup>
    </main>
  );
} 