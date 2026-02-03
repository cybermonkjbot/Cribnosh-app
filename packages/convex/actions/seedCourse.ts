// @ts-nocheck
"use node";

import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Seed the compliance course with test modules
 * This creates a few test modules for chef onboarding
 */
export const seedComplianceCourse = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("Starting to seed compliance course with test modules...");

    const courseId = "compliance-course-v1";

    // Define test modules (just a few for testing)
    const modules = [
      {
        moduleId: "module-1-food-safety",
        moduleNumber: 1,
        moduleName: "Food Safety & Hygiene",
        description: "Learn the fundamentals of food safety and hygiene practices for home cooking businesses.",
        estimatedTime: 15, // minutes
        content: [
          {
            type: "text" as const,
            title: "Introduction to Food Safety",
            order: 1,
            data: {
              text: "Food safety is critical when preparing meals for others. This module covers the essential practices you need to follow to ensure the food you prepare is safe for consumption. Understanding and implementing proper food safety measures protects your customers and your business.",
              html: "<p>Food safety is critical when preparing meals for others. This module covers the essential practices you need to follow to ensure the food you prepare is safe for consumption. Understanding and implementing proper food safety measures protects your customers and your business.</p>",
            },
          },
          {
            type: "text" as const,
            title: "Key Principles",
            order: 2,
            data: {
              text: "The four main principles of food safety are: 1) Clean - wash hands and surfaces often, 2) Separate - don't cross-contaminate, 3) Cook - cook to the right temperature, 4) Chill - refrigerate promptly. Following these principles helps prevent foodborne illnesses.",
              html: "<p>The four main principles of food safety are:</p><ul><li><strong>Clean</strong> - wash hands and surfaces often</li><li><strong>Separate</strong> - don't cross-contaminate</li><li><strong>Cook</strong> - cook to the right temperature</li><li><strong>Chill</strong> - refrigerate promptly</li></ul><p>Following these principles helps prevent foodborne illnesses.</p>",
            },
          },
        ],
        videos: [
          {
            id: "video-1-food-safety-intro",
            videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            title: "Food Safety Basics",
            description: "Introduction to food safety principles",
            thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
            duration: 300, // 5 minutes in seconds
            order: 1,
          },
        ],
        quiz: {
          questions: [
            {
              questionId: "q1-food-safety",
              question: "What are the four main principles of food safety?",
              type: "multiple_choice" as const,
              options: [
                "Clean, Separate, Cook, Chill",
                "Wash, Store, Heat, Freeze",
                "Sanitize, Organize, Bake, Cool",
                "Clean, Cook, Serve, Store",
              ],
              correctAnswer: "Clean, Separate, Cook, Chill",
              explanation: "The four main principles are Clean (wash hands and surfaces), Separate (prevent cross-contamination), Cook (to proper temperature), and Chill (refrigerate promptly).",
              order: 1,
            },
            {
              questionId: "q2-food-safety",
              question: "You should wash your hands for at least 20 seconds before handling food.",
              type: "true_false" as const,
              correctAnswer: true,
              explanation: "Yes, washing hands for at least 20 seconds with soap and warm water is essential before handling food.",
              order: 2,
            },
            {
              questionId: "q3-food-safety",
              question: "What is the danger zone temperature range for food?",
              type: "multiple_choice" as const,
              options: [
                "0°C to 5°C",
                "5°C to 63°C",
                "63°C to 75°C",
                "Above 75°C",
              ],
              correctAnswer: "5°C to 63°C",
              explanation: "The danger zone is between 5°C and 63°C (41°F to 145°F). Food should not be kept in this temperature range for more than 2 hours.",
              order: 3,
            },
          ],
          passingScore: 80,
          timeLimit: 600, // 10 minutes in seconds
        },
      },
      {
        moduleId: "module-2-uk-regulations",
        moduleNumber: 2,
        moduleName: "UK Food Regulations",
        description: "Understand the UK food safety regulations and legal requirements for home cooking businesses.",
        estimatedTime: 20,
        content: [
          {
            type: "text" as const,
            title: "Food Safety Act 1990",
            order: 1,
            data: {
              text: "The Food Safety Act 1990 is the primary legislation governing food safety in the UK. It makes it an offence to sell food that is not of the nature, substance, or quality demanded by the purchaser, or to sell food that is unfit for human consumption.",
              html: "<p>The Food Safety Act 1990 is the primary legislation governing food safety in the UK. It makes it an offence to sell food that is not of the nature, substance, or quality demanded by the purchaser, or to sell food that is unfit for human consumption.</p>",
            },
          },
          {
            type: "text" as const,
            title: "Registration Requirements",
            order: 2,
            data: {
              text: "If you prepare, cook, store, handle, distribute, supply, or sell food from your home, you must register with your local authority at least 28 days before starting. This is a legal requirement under the Food Hygiene Regulations 2006.",
              html: "<p>If you prepare, cook, store, handle, distribute, supply, or sell food from your home, you must register with your local authority at least 28 days before starting. This is a legal requirement under the Food Hygiene Regulations 2006.</p>",
            },
          },
        ],
        videos: [
          {
            id: "video-2-uk-regulations",
            videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            title: "UK Food Regulations Overview",
            description: "Understanding UK food safety legislation",
            thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
            duration: 420, // 7 minutes
            order: 1,
          },
        ],
        quiz: {
          questions: [
            {
              questionId: "q1-uk-regulations",
              question: "When must you register with your local authority?",
              type: "multiple_choice" as const,
              options: [
                "At least 28 days before starting",
                "Within 28 days after starting",
                "Only if you make over £10,000 per year",
                "You don't need to register",
              ],
              correctAnswer: "At least 28 days before starting",
              explanation: "You must register with your local authority at least 28 days before you start your food business.",
              order: 1,
            },
            {
              questionId: "q2-uk-regulations",
              question: "The Food Safety Act 1990 makes it illegal to sell unfit food.",
              type: "true_false" as const,
              correctAnswer: true,
              explanation: "Yes, the Food Safety Act 1990 makes it an offence to sell food that is unfit for human consumption.",
              order: 2,
            },
          ],
          passingScore: 80,
          timeLimit: 600,
        },
        prerequisites: ["module-1-food-safety"],
      },
      {
        moduleId: "module-3-allergen-management",
        moduleNumber: 3,
        moduleName: "Allergen Management",
        description: "Learn how to identify, manage, and communicate about food allergens to protect customers.",
        estimatedTime: 18,
        content: [
          {
            type: "text" as const,
            title: "The 14 Allergens",
            order: 1,
            data: {
              text: "There are 14 major allergens that must be declared by law: celery, cereals containing gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, peanuts, sesame, soybeans, sulphur dioxide/sulphites, and tree nuts. You must clearly label or inform customers about these allergens in your food.",
              html: "<p>There are 14 major allergens that must be declared by law:</p><ul><li>Celery</li><li>Cereals containing gluten</li><li>Crustaceans</li><li>Eggs</li><li>Fish</li><li>Lupin</li><li>Milk</li><li>Molluscs</li><li>Mustard</li><li>Peanuts</li><li>Sesame</li><li>Soybeans</li><li>Sulphur dioxide/sulphites</li><li>Tree nuts</li></ul><p>You must clearly label or inform customers about these allergens in your food.</p>",
            },
          },
          {
            type: "text" as const,
            title: "Cross-Contamination Prevention",
            order: 2,
            data: {
              text: "Preventing allergen cross-contamination is crucial. Use separate cutting boards, utensils, and storage areas for allergen-free foods. Clean surfaces thoroughly between preparing different dishes. Always wash hands after handling allergens.",
              html: "<p>Preventing allergen cross-contamination is crucial. Use separate cutting boards, utensils, and storage areas for allergen-free foods. Clean surfaces thoroughly between preparing different dishes. Always wash hands after handling allergens.</p>",
            },
          },
        ],
        videos: [
          {
            id: "video-3-allergen-management",
            videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
            title: "Managing Food Allergens",
            description: "How to identify and manage food allergens",
            thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
            duration: 360, // 6 minutes
            order: 1,
          },
        ],
        quiz: {
          questions: [
            {
              questionId: "q1-allergen",
              question: "How many major allergens must be declared by law?",
              type: "multiple_choice" as const,
              options: ["10", "12", "14", "16"],
              correctAnswer: "14",
              explanation: "There are 14 major allergens that must be declared by law in the UK.",
              order: 1,
            },
            {
              questionId: "q2-allergen",
              question: "You should use separate utensils for allergen-free foods.",
              type: "true_false" as const,
              correctAnswer: true,
              explanation: "Yes, using separate cutting boards, utensils, and storage areas helps prevent cross-contamination of allergens.",
              order: 2,
            },
            {
              questionId: "q3-allergen",
              question: "Which of the following is NOT one of the 14 major allergens?",
              type: "multiple_choice" as const,
              options: ["Peanuts", "Sesame", "Garlic", "Eggs"],
              correctAnswer: "Garlic",
              explanation: "Garlic is not one of the 14 major allergens that must be declared. The 14 allergens include peanuts, sesame, and eggs.",
              order: 3,
            },
          ],
          passingScore: 80,
          timeLimit: 600,
        },
        prerequisites: ["module-1-food-safety"],
      },
    ];

    const results = [];

    // Create each module
    for (const module of modules) {
      try {
        console.log(`Creating module ${module.moduleNumber}: ${module.moduleName}...`);

        const moduleId = await ctx.runMutation(internal.mutations.courseModules.upsertModuleForSeed, {
          courseId,
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          moduleNumber: module.moduleNumber,
          description: module.description,
          estimatedTime: module.estimatedTime,
          content: module.content,
          videos: module.videos,
          quiz: module.quiz,
          prerequisites: module.prerequisites,
          status: "published",
        });

        results.push({
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          created: true,
          id: moduleId,
        });

        console.log(`✓ Created module: ${module.moduleName} (${moduleId})`);
      } catch (error) {
        console.error(`✗ Error creating module ${module.moduleName}:`, error);
        results.push({
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          created: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    console.log("Course seeding completed!");
    return {
      success: true,
      courseId,
      modulesCreated: results.filter((r) => r.created).length,
      totalModules: modules.length,
      results,
    };
  },
});

