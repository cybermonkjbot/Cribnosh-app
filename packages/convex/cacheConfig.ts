/**
 * Centralized configuration for Action Cache TTLs (Time To Live).
 * 
 * Defines how long different types of data should remain in the cache before expiring.
 * Values are in milliseconds.
 */

export const CACHE_TTL = {
    // Weather data: 30 minutes
    // Weather changes, but usually not drastically within 30 mins
    WEATHER: 30 * 60 * 1000,

    // Address Validation (Stuart): 30 days
    // Physical addresses are valid/invalid permanently usually, but coverage zones might change
    STUART_VALIDATION: 30 * 24 * 60 * 60 * 1000,

    // Emotions Context: 5 minutes
    // User context (location, time, mood) changes relatively frequently
    EMOTIONS_CONTEXT: 5 * 60 * 1000,

    // Embeddings: 7 days
    // Embeddings for a specific text string are constant, but we might change the model
    // or want to clean up unused queries
    EMBEDDINGS: 7 * 24 * 60 * 60 * 1000,
};
