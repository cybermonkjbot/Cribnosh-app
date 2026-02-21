import { ChefBackButton } from "@/components/ui/food-creator-back-button";
import { FoodCreatorAuthProvider } from "@/lib/food-creator-auth";

export default function ChefLayout({ children }: { children: React.ReactNode }) {
    return (
        <FoodCreatorAuthProvider>
            <ChefBackButton />
            <div className="min-h-screen bg-[#02120A] text-white">
                {children}
            </div>
        </FoodCreatorAuthProvider>
    );
}
