import { ChefBackButton } from "@/components/ui/chef-back-button";
import { ChefAuthProvider } from "@/lib/chef-auth";

export default function ChefLayout({ children }: { children: React.ReactNode }) {
    return (
        <ChefAuthProvider>
            <ChefBackButton />
            <div className="min-h-screen bg-[#02120A] text-white">
                {children}
            </div>
        </ChefAuthProvider>
    );
}
