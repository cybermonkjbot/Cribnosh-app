"use client";

import React from "react";
import Link from "next/link";
import ExpandableCardDemo, { type Card } from "@/components/ui/expandable-card-standard";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { MobileBackButton } from "@/components/ui/mobile-back-button";

const cities = [
	{
		title: "Birmingham",
		description:
			"Birmingham is the second-largest city in the United Kingdom, known for its industrial heritage and cultural diversity.",
		src: "/images/cities/optimized/birmingham-new.jpg",
	},
	{
		title: "Leicester",
		description:
			"Leicester is a city in the East Midlands of England, known for its rich history and diverse population.",
		src: "/images/cities/optimized/leicester.jpg",
	},
	{
		title: "Nottingham",
		description:
			"Nottingham is famous for its connection to the legend of Robin Hood and its historical landmarks.",
		src: "/images/cities/optimized/nottingham.jpg",
	},
	{
		title: "Coventry",
		description:
			"Coventry is known for its modern Cathedral and historical automotive industry.",
		src: "/images/cities/optimized/coventry.jpg",
	},
	{
		title: "Stoke-on-Trent",
		description:
			"Stoke-on-Trent is a city in Staffordshire, famous for its pottery industry and heritage.",
		src: "/images/cities/optimized/stoke-on-trent.jpg",
	},
	{
		title: "Derby",
		description:
			"Derby played an important role in the UK's industrial revolution and is home to many historic sites.",
		src: "/images/cities/optimized/derby.jpg",
	},
	{
		title: "Wolverhampton",
		description:
			"Wolverhampton is a city in the West Midlands with a strong cultural and industrial background.",
		src: "/images/cities/optimized/wolverhampton.jpg",
	},
	{
		title: "Northampton",
		description:
			"Northampton is well-known for its historic leather and footwear industries.",
		src: "/images/cities/optimized/northampton.jpg",
	},
];

export default function AllCities() {
	const slugify = (value: string) =>
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");

	const cards: Card[] = cities.map((city) => ({
		...city,
		ctaText: "Explore",
		ctaLink: `/cities/${slugify(city.title)}`,
		content: () => null,
	}));

	return (
		<main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
			<ParallaxGroup>
				{/* Mobile Back Button - only on mobile, fixed top left */}
				<MobileBackButton />
				{/* Background layers */}
				<ParallaxLayer asBackground speed={0.2} className="z-0">
					<div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30]/80 to-[#ff5e54]/80" />
				</ParallaxLayer>

				<ParallaxLayer
					asBackground
					speed={0.4}
					className="z-0 pointer-events-none"
				>
					<div className="fixed inset-0">
						<div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-30 animate-pulse" />
						<div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-20 animate-pulse delay-100" />
					</div>
				</ParallaxLayer>

				{/* Content layer */}
				<div className="relative z-10 flex-1 pt-20 sm:pt-32">
					<section
						data-section-theme="light"
						className="py-6 sm:py-12 px-3 sm:px-6 container mx-auto bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl sm:rounded-2xl shadow-lg"
					>
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-12">
							<div>
								<h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-transparent bg-clip-text">
									All Available Cities
								</h1>
								<p className="text-neutral-600 mt-2 text-sm sm:text-lg">
									Explore all the cities where Cribnosh is available or coming
									soon
								</p>
							</div>
							<Link
								href="/"
								className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] rounded-full hover:opacity-90 transition-all duration-200 hover:shadow-md flex items-center justify-center sm:justify-start gap-2"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 sm:h-5 sm:w-5 rotate-180 transition-transform duration-200 group-hover:translate-x-1"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
										clipRule="evenodd"
									/>
								</svg>
								Back to Home
							</Link>
						</div>

						<div className="max-w-5xl mx-auto px-1 sm:px-0">
						<ExpandableCardDemo cards={cards} />
						</div>
					</section>
				</div>

				{/* Decorative elements layer */}
				<ParallaxLayer speed={1.5} className="z-20 pointer-events-none">
					<div className="fixed inset-0">
						<div className="absolute top-[20%] left-[10%] w-4 h-4 bg-white rounded-full opacity-20 animate-pulse" />
						<div className="absolute top-[40%] right-[20%] w-6 h-6 bg-white rounded-full opacity-30 animate-pulse delay-100" />
						<div className="absolute bottom-[30%] left-[30%] w-3 h-3 bg-white rounded-full opacity-25 animate-pulse delay-200" />
						<div className="absolute top-[60%] right-[40%] w-5 h-5 bg-white rounded-full opacity-20 animate-pulse delay-300" />
					</div>
				</ParallaxLayer>
			</ParallaxGroup>
		</main>
	);
}