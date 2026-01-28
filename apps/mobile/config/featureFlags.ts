/**
 * Feature Flags Configuration
 * Strategy: "Built -> Published"
 * 
 * Defines the rollout state for advanced features.
 * All advanced features default to FALSE for Day 1 stability.
 * Controlled rollouts (Day 30, Day 60) can be managed here or remotely.
 */

export const FEATURE_FLAGS = {
    // Phase 1 (Day 1 - Core)
    // These are implicitly TRUE in code, but listed here for completeness if we ever need to kill-switch.
    ENABLE_CHEF_BOOKING: true,
    ENABLE_SENTIMENT_UI: true,
    ENABLE_SHAKE_TO_DECIDE: true,

    // Phase 2 (Day 30 - Data/AI Layer)
    // Hold back until AI cold-start data is sufficient.
    ENABLE_AI_FEED: false, // "Quiet AI" recommendations
    ENABLE_EMOTION_SEARCH: false, // "Emotion Engine"

    // Phase 3 (Day 60 - Social Layer)
    // Hold back until user density prevents "Empty Room" effect.
    ENABLE_LIVE_STREAMING: false, // #OnTheStove Live
    ENABLE_COMMUNITY_FEED: false, // Social feeds/comments
    ENABLE_GROUP_CART: false, // Complex group ordering

    // Phase 4 (Day 90 - Ecosystem)
    // Hold back for operational maturity.
    ENABLE_KITCHEN_MARKETPLACE: false, // Shared Kitchens
    ENABLE_WASTE_REDUCTION: false, // Too Good To Go internal logic
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (key: FeatureFlagKey): boolean => {
    // extended logic: could check remote config or user beta status here
    return FEATURE_FLAGS[key];
};
