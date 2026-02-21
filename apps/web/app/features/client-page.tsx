"use client";

import { RotatingHeading } from "@/components/ui/rotating-heading";
import { AlertCircle, Apple, Book, Brain, ChefHat, Flame, Group, Home, Recycle, ShieldCheck, Shuffle, Smile, Sparkles, Star, Users, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const features = [
	{
		id: "dietary",
		title: "Dietary Memory",
		description: "Your AI-powered dietary profile that remembers your preferences and restrictions.",
		icon: <Apple className="w-6 h-6" />,
	},
	{
		id: "allergen",
		title: "Allergen Safeguard",
		description: "Advanced allergen detection and alerts to keep you safe while dining.",
		icon: <AlertCircle className="w-6 h-6" />,
	},
	{
		id: "ordering",
		title: "Smart Ordering",
		description: "Intelligent order recommendations based on your taste profile and past experiences.",
		icon: <Sparkles className="w-6 h-6" />,
	},
	{
		id: "emotion-engine",
		title: "Emotion Engine",
		description: "Personalized recommendations based on your mood, cravings, and context, dining that adapts to you.",
		icon: <Brain className="w-6 h-6" />,
	},
	{
		id: "chef-discovery",
		title: "Chef Discovery & Hiring",
		description: "Follow and hire foodCreators directly explore culinary talent and book unique experiences.",
		icon: <ChefHat className="w-6 h-6" />,
	},
	{
		id: "on-the-stove",
		title: "#OnTheStove Live Cooking",
		description: "Watch real-time cooking streams and order directly from live kitchen action.",
		icon: <Flame className="w-6 h-6" />,
	},
	{
		id: "group-ordering",
		title: "Group & Gift Ordering",
		description: "Order for friends, family, or groups, flexible payments and collaborative experiences.",
		icon: <Users className="w-6 h-6" />,
	},
	{
		id: "decision-support",
		title: "Shake to Decide For Me",
		description: "Solve choice paralysis, shake your phone and let CribNosh pick for you!",
		icon: <Shuffle className="w-6 h-6" />,
	},
	{
		id: "sentiment-system",
		title: "Sentiment System",
		description: "Rate with a sentiment bar, tag your feelings, and see calorie scores for every meal.",
		icon: <Smile className="w-6 h-6" />,
	},
	{
		id: "too-good-to-go",
		title: "Too Good To Go Integration",
		description: "Get subsidized access to unsold good food, help reduce waste and save money.",
		icon: <Recycle className="w-6 h-6" />,
	},
	{
		id: "shared-kitchen",
		title: "Shared Kitchen Access",
		description: "Connect foodCreators to certified kitchen owners, empowering local food creators.",
		icon: <Home className="w-6 h-6" />,
	},
	{
		id: "chef-profiles",
		title: "Chef Profiles",
		description: "Full multimedia food creator profiles, videos, bookings, stories, and menus.",
		icon: <Book className="w-6 h-6" />,
	},
	{
		id: "community-features",
		title: "Community Features",
		description: "Follow, tag, and connect, deep community tools, shared kitchens, and live feeds.",
		icon: <Group className="w-6 h-6" />,
	},
	{
		id: "quiet-ai",
		title: "Quiet AI Personalization",
		description: "Ambient, non-intrusive AI, personalizes your experience without being pushy.",
		icon: <Zap className="w-6 h-6" />,
	},
	{
		id: "cultural-storytelling",
		title: "In-App Cultural Storytelling",
		description: "Discover kitchen origins, food backgrounds, and food creator stories through contextual UI.",
		icon: <Star className="w-6 h-6" />,
	},
	{
		id: "accessibility-sustainability",
		title: "Accessibility & Sustainability",
		description: "WCAG-aware design, mood visibility, screen reader support, and food waste reduction.",
		icon: <ShieldCheck className="w-6 h-6" />,
	},
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.1 }}
			className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10"
		>
			<div className="relative z-10">
				<div className="mb-4 inline-block rounded-xl bg-[#ff3b30]/10 p-3 text-[#ff3b30]">
					{feature.icon}
				</div>
				<h3 className="mb-2 font-asgard text-xl sm:text-2xl font-bold text-[#ff3b30]">{feature.title}</h3>
				<p className="text-neutral-600 ">{feature.description}</p>
			</div>
			<div className="absolute inset-0 z-0 bg-gradient-to-br from-[#ff3b30]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
		</motion.div>
	);
};

/**
 * Renders the main features page showcasing all AI-powered dining features with animated headings, feature cards, and a call-to-action section.
 *
 * Displays a responsive grid of feature cards, each with an icon, title, and description, enhanced by staggered entrance animations and a visually styled background.
 */
export default function Features() {
	return (
		<main>
			<section data-section-theme="light" className="min-h-screen relative">
				<div className="absolute mt-20 inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#ff3b3015_0%,transparent_100%)]" />

				<div className="container mx-auto px-4 py-24">
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center mb-16"
					>
						<h1 className="font-asgard text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
							<span className="text-neutral-900 ">
								<RotatingHeading
									className="inline"
									highlightClassName="text-[#ff3b30]"
								/>
							</span>
						</h1>
						<p className="text-xl text-neutral-600  max-w-2xl mx-auto">
							Experience dining like never before with our AI-powered features designed to make every meal perfect for you.
						</p>
					</motion.div>

					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<FeatureCard key={feature.id} feature={feature} index={index} />
						))}
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="mt-24 text-center"
					>
						<h2 className="font-asgard text-2xl sm:text-3xl font-bold text-neutral-800 mb-6">
							Ready to transform your dining experience?
						</h2>
						<Link
							href="/try-it"
							className="inline-flex items-center justify-center rounded-full bg-[#ff3b30] px-8 py-3 text-lg font-semibold text-white hover:bg-[#ff5e54] transition-colors duration-300"
						>
							Try CribNosh Now
						</Link>
					</motion.div>
				</div>
			</section>
		</main>
	);
}
