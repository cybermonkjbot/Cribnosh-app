"use client";

import { GlassLinkPreview } from "./glass-link-preview";

const categoryData = {
  "Vibrant Flavors": {
    description: "Experience the bold and diverse tastes that make every meal an adventure",
    imageSrc: "/backgrounds/masonry-1.jpg"
  },
  "Hygienic Standards": {
    description: "Our commitment to cleanliness and food safety in every kitchen",
    imageSrc: "/backgrounds/masonry-2.jpg"
  },
  "Cultural Roots": {
    description: "Celebrating the rich heritage behind every authentic recipe",
    imageSrc: "/backgrounds/masonry-3.jpg"
  },
  "Family Traditions": {
    description: "Preserving cherished recipes passed down through generations",
    imageSrc: "/backgrounds/masonry-1.jpg"
  },
  "Healthy Choices": {
    description: "Nutritious and delicious options for mindful eating",
    imageSrc: "/backgrounds/masonry-2.jpg"
  },
  "Sustainable Practices": {
    description: "Our dedication to eco-friendly cooking and responsible sourcing",
    imageSrc: "/backgrounds/masonry-3.jpg"
  }
};

interface CategoryPreviewProps {
  category: keyof typeof categoryData;
}

export function CategoryPreview({ category }: CategoryPreviewProps) {
  const data = categoryData[category];
  
  return (
    <GlassLinkPreview
      title={category}
      description={data.description}
      imageSrc={data.imageSrc}
      imageAlt={`${category} preview`}
    />
  );
} 