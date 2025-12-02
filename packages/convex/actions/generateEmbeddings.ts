"use node";

import { action } from '../_generated/server';
import { v } from 'convex/values';
import { internal, api } from '../_generated/api';
import OpenAI from 'openai';
import type { Id } from '../_generated/dataModel';

// Initialize OpenAI client lazily
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Helper function to retry OpenAI API calls with exponential backoff
 * Specifically handles 429 rate limit errors
 */
async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      const isRateLimit = 
        error?.status === 429 ||
        error?.response?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('rate limit');
      
      // If it's not a rate limit error or we've exhausted retries, throw
      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay with jitter
      const baseDelay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 0.3 * baseDelay; // Add up to 30% jitter
      const delay = baseDelay + jitter;
      
      console.log(`Rate limit hit (429), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Generate embedding for a single meal
 */
export const generateMealEmbedding = action({
  args: {
    mealId: v.id('meals'),
  },
  handler: async (ctx, args) => {
    // Get the meal
    const meal = await ctx.runQuery(internal.queries.meals.getMealById, {
      mealId: args.mealId,
    });

    if (!meal) {
      throw new Error(`Meal ${args.mealId} not found`);
    }

    // Build text to embed: name, description, cuisine, dietary tags
    const textToEmbed = [
      meal.name,
      meal.description,
      ...(meal.cuisine || []),
      ...(meal.dietary || []),
      ...(meal.ingredients?.map((ing: { name: string }) => ing.name) || []),
    ].filter(Boolean).join(' ');

    // Generate embedding using OpenAI with exponential backoff for rate limits
    const openai = getOpenAI();
    const response = await withExponentialBackoff(async () => {
      return await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: textToEmbed,
      });
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    // Update meal with embedding
    await ctx.runMutation(internal.mutations.meals.updateMealEmbedding, {
      mealId: args.mealId,
      embedding,
    });

    return { success: true, mealId: args.mealId };
  },
});

/**
 * Generate embedding for a query string (for vector search)
 */
export const generateQueryEmbedding = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate embedding using OpenAI with exponential backoff for rate limits
    const openai = getOpenAI();
    const response = await withExponentialBackoff(async () => {
      return await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: args.query,
      });
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    return { embedding };
  },
});

/**
 * Generate embeddings for all meals that don't have embeddings yet
 * Processes in batches to avoid rate limits
 */
export const generateAllMealEmbeddings = action({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 10;
    
    // Get all meals without embeddings
    const mealsWithoutEmbeddings = await ctx.runQuery(
      internal.queries.meals.getMealsWithoutEmbeddings,
      {}
    );

    const results = [];
    const errors = [];

    // Process in batches
    for (let i = 0; i < mealsWithoutEmbeddings.length; i += batchSize) {
      const batch = mealsWithoutEmbeddings.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (meal: { _id: Id<'meals'> }) => {
          try {
            const result = await ctx.runAction(api.actions.generateEmbeddings.generateMealEmbedding, {
              mealId: meal._id,
            });
            results.push(result);
          } catch (error: any) {
            errors.push({
              mealId: meal._id,
              error: error?.message || 'Unknown error',
            });
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < mealsWithoutEmbeddings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: true,
      processed: results.length,
      errors: errors.length,
      errorDetails: errors,
    };
  },
});

