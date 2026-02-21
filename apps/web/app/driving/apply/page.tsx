import { Metadata } from "next";
import DrivingApplyClient from "./client-page";

export const metadata: Metadata = {
    title: "Become a Delivery Driver",
    description: "Join the Cribnosh delivery fleet. Enjoy flexible hours, competitive pay, and be a crucial part of delivering authentic cultural meals."
};

export default function DrivingApplyPage() {
    return <DrivingApplyClient />;
}
