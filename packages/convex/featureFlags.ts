import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: {
        group: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.group) {
            return await ctx.db
                .query("featureFlags")
                .withIndex("by_group", (q) => q.eq("group", args.group!))
                .collect();
        }
        return await ctx.db.query("featureFlags").collect();
    },
});

export const updateFlag = mutation({
    args: {
        id: v.id("featureFlags"),
        value: v.boolean(),
    },
    handler: async (ctx, args) => {
        // In a real app, you might want to check for admin permissions here
        // const identity = await ctx.auth.getUserIdentity();
        // if (!identity) throw new Error("Unauthenticated");

        await ctx.db.patch(args.id, {
            value: args.value,
            lastUpdated: Date.now(),
            // updatedBy: identity.subject ... 
        });
    },
});

export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        const flags = [
            // Web Home Screen
            {
                key: 'home_hero_brand',
                label: 'Hero Brand (Logo)',
                description: 'Top branding section with logo',
                value: true,
                group: 'web_home'
            },
            {
                key: 'home_hero_geometric',
                label: 'Hero Section (Geometric)',
                description: 'The main hero section with geometric background',
                value: true,
                group: 'web_home'
            },
            {
                key: 'home_features',
                label: 'Features Section',
                description: 'Features swap and doom scroll section',
                value: true,
                group: 'web_home'
            },
            {
                key: 'home_how_it_works',
                label: 'How It Works',
                description: 'Explanation of how the service works',
                value: true,
                group: 'web_home'
            },
            {
                key: 'home_cities',
                label: 'Cities',
                description: 'List of available cities',
                value: true,
                group: 'web_home'
            },
            {
                key: 'home_sustainability',
                label: 'Sustainability',
                description: 'Sustainability commitment section',
                value: true,
                group: 'web_home'
            },
            {
                key: 'home_community',
                label: 'Community Spotlight',
                description: 'Community spotlight section',
                value: true,
                group: 'web_home'
            },
            {
                key: 'home_app_store',
                label: 'App Store CTA',
                description: 'Call to action to download the app',
                value: true,
                group: 'web_home'
            },
            // Mobile Home Screen
            {
                key: 'mobile_cuisine_categories_section',
                label: 'Cuisine Categories',
                description: 'Horizontal scroll of cuisine categories',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_featured_kitchens_section',
                label: 'Featured Kitchens',
                description: 'Highlight of featured kitchens',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_popular_meals_section',
                label: 'Popular Meals',
                description: 'List of popular meals',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_special_offers_section',
                label: 'Special Offers',
                description: 'Special offers & discounts',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_cuisines_section',
                label: 'Cuisines List',
                description: 'Full list of cuisines',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_order_again_section',
                label: 'Order Again',
                description: 'Quick re-order section',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_kitchens_near_me',
                label: 'Kitchens Near Me',
                description: 'Nearby kitchens based on location',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_top_kebabs',
                label: 'Top Kebabs',
                description: 'Top rated kebab places',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_takeaways',
                label: 'Takeaways',
                description: 'Available takeaways',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_too_fresh_to_waste',
                label: 'Too Fresh to Waste',
                description: 'Discounted items to prevent waste',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_event_banner',
                label: 'Event Banner',
                description: 'Banner for special events',
                value: true,
                group: 'mobile_home'
            },


            // Global
            {
                key: 'global_maintenance_mode',
                label: 'Maintenance Mode',
                description: 'Enable maintenance mode for the entire system',
                value: false,
                group: 'system'
            },
            // Web Extended
            {
                key: 'web_careers',
                label: 'Careers Page',
                description: 'Enable public access to careers page',
                value: true,
                group: 'web_home'
            },
            {
                key: 'web_waitlist',
                label: 'Waitlist',
                description: 'Enable waitlist signup',
                value: true,
                group: 'web_home'
            },
            // Mobile Extended
            {
                key: 'mobile_live_sessions',
                label: 'Live Sessions',
                description: 'Enable live cooking sessions feature',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_referrals',
                label: 'Referrals',
                description: 'Enable user referral system',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_nosh_points',
                label: 'Nosh Points',
                description: 'Enable rewards program visibility',
                value: true,
                group: 'mobile_home'
            },
            {
                key: 'mobile_chef_applications',
                label: 'Chef Applications',
                description: 'Enable in-app chef applications',
                value: true,
                group: 'mobile_home'
            },
        ];

        for (const flag of flags) {
            const existing = await ctx.db
                .query("featureFlags")
                .withIndex("by_key", (q) => q.eq("key", flag.key))
                .first();

            if (!existing) {
                await ctx.db.insert("featureFlags", {
                    ...flag,
                    lastUpdated: Date.now(),
                });
            }
        }
    },
});
