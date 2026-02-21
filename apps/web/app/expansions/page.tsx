import { Metadata } from "next";
import ExpansionsClient from "./client-page";

export const metadata: Metadata = {
    title: "Cribnosh Expansions",
    description: "Find out where Cribnosh is expanding next. See our roadmap for bringing authentic cultural meals to more cities across the UK."
};

export default function ExpansionsPage() {
    return <ExpansionsClient />;
}
