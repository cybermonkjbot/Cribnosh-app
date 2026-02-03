import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ChefRootPage() {
    redirect("/chef/dashboard");
}
