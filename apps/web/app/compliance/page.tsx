import { Metadata } from "next";
import ComplianceClient from "./client-page";

export const metadata: Metadata = {
    title: "Compliance",
    description: "Read the Cribnosh Compliance policies. We are committed to maintaining the highest standards of safety and regulatory compliance."
};

export default function CompliancePage() {
    return <ComplianceClient />;
}
