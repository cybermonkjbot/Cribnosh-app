import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Cribnosh | The Home of Food Creators",
    description: "Learn about Cribnosh's mission to revolutionize home-cooked meals, our values, and the team behind the movement.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
