// @ts-nocheck
"use node";

import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

/**
 * Seed data for all home screen sections
 * This action creates sample users, chefs, meals, cuisines, special offers, and orders
 */
export const seedAllHomeScreenData = action({
  args: {},
  handler: async (ctx) => {
    console.log("Starting comprehensive seed data injection for all home screen sections...");

    // Define cuisines to create
    const cuisinesToCreate = [
      { name: "Italian", description: "Authentic Italian cuisine with pasta, pizza, and more", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop" },
      { name: "Indian", description: "Spicy and flavorful Indian dishes", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop" },
      { name: "Japanese", description: "Fresh sushi, ramen, and traditional Japanese cuisine", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop" },
      { name: "Chinese", description: "Classic Chinese dishes and dim sum", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop" },
      { name: "Mexican", description: "Tacos, burritos, and authentic Mexican flavors", image: "https://images.unsplash.com/photo-1565299585323-38174c3d1e3d?w=400&h=400&fit=crop" },
      { name: "Nigerian", description: "Traditional Nigerian dishes and flavors", image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop" },
      { name: "Thai", description: "Spicy and aromatic Thai cuisine", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop" },
      { name: "Mediterranean", description: "Fresh Mediterranean dishes with olive oil and herbs", image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=400&fit=crop" },
      { name: "American", description: "Classic American comfort food", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop" },
      { name: "British", description: "Traditional British pub food and classics", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop" },
      { name: "French", description: "Elegant French cuisine and pastries", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop" },
      { name: "Korean", description: "Korean BBQ and traditional dishes", image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop" },
      { name: "Kebab", description: "Delicious kebabs and grilled meats", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop" },
      { name: "Caribbean", description: "Authentic island flavors, jerk, and curries", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop" },
    ];

    // Sample dishes - expanded list
    const sampleDishes = [
      {
        name: "Hosomaki roll",
        description: "Fresh salmon hosomaki rolls with avocado and cucumber",
        price: 1900, // £19.00 in pence
        cuisine: ["Japanese", "Sushi"],
        dietary: ["Pescatarian"],
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=120&h=120&fit=crop",
        rating: 4.8,
      },
      {
        name: "Chicken Tikka Masala",
        description: "Creamy tomato-based curry with tender chicken pieces",
        price: 1599, // £15.99 in pence
        cuisine: ["Indian"],
        dietary: ["Gluten-free"],
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=120&h=120&fit=crop",
        rating: 4.6,
      },
      {
        name: "Margherita Pizza",
        description: "Classic Italian pizza with fresh mozzarella and basil",
        price: 1299, // £12.99 in pence
        cuisine: ["Italian"],
        dietary: ["Vegetarian"],
        image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=120&h=120&fit=crop",
        rating: 4.7,
      },
      {
        name: "Beef Burger",
        description: "Juicy beef patty with lettuce, tomato, and special sauce",
        price: 1499, // £14.99 in pence
        cuisine: ["American"],
        dietary: [],
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
        rating: 4.5,
      },
      {
        name: "Pad Thai",
        description: "Stir-fried rice noodles with shrimp, tofu, and peanuts",
        price: 1399, // £13.99 in pence
        cuisine: ["Thai"],
        dietary: ["Pescatarian"],
        image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=120&h=120&fit=crop",
        rating: 4.9,
      },
      // Additional meals for variety
      { name: "Spaghetti Carbonara", description: "Creamy pasta with bacon and parmesan", price: 1299, cuisine: ["Italian"], dietary: [], image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=120&h=120&fit=crop", rating: 4.6 },
      { name: "Butter Chicken", description: "Creamy tomato curry with tender chicken", price: 1699, cuisine: ["Indian"], dietary: ["Gluten-free"], image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&h=120&fit=crop", rating: 4.8 },
      { name: "Chicken Katsu Curry", description: "Breaded chicken with Japanese curry", price: 1499, cuisine: ["Japanese"], dietary: [], image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=120&h=120&fit=crop", rating: 4.7 },
      { name: "Sweet and Sour Chicken", description: "Crispy chicken in tangy sauce", price: 1399, cuisine: ["Chinese"], dietary: [], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", rating: 4.5 },
      { name: "Chicken Tacos", description: "Soft tortillas with spiced chicken", price: 1199, cuisine: ["Mexican"], dietary: [], image: "https://images.unsplash.com/photo-1565299585323-38174c3d1e3d?w=120&h=120&fit=crop", rating: 4.6 },
      { name: "Jollof Rice", description: "Traditional Nigerian rice dish", price: 1299, cuisine: ["Nigerian"], dietary: [], image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=120&h=120&fit=crop", rating: 4.8 },
      { name: "Green Curry", description: "Spicy Thai green curry with vegetables", price: 1399, cuisine: ["Thai"], dietary: ["Vegetarian"], image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=120&h=120&fit=crop", rating: 4.7 },
      { name: "Greek Salad", description: "Fresh Mediterranean salad with feta", price: 1099, cuisine: ["Mediterranean"], dietary: ["Vegetarian"], image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=120&h=120&fit=crop", rating: 4.5 },
      { name: "BBQ Ribs", description: "Slow-cooked ribs with BBQ sauce", price: 1899, cuisine: ["American"], dietary: [], image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop", rating: 4.6 },
      { name: "Fish and Chips", description: "Classic British battered fish with chips", price: 1499, cuisine: ["British"], dietary: ["Pescatarian"], image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=120&h=120&fit=crop", rating: 4.7 },
      { name: "Coq au Vin", description: "French chicken braised in wine", price: 1799, cuisine: ["French"], dietary: [], image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=120&h=120&fit=crop", rating: 4.8 },
      { name: "Bulgogi", description: "Korean marinated beef", price: 1699, cuisine: ["Korean"], dietary: [], image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=120&h=120&fit=crop", rating: 4.7 },
      { name: "Chicken Doner Kebab", description: "Tender chicken kebab with fresh vegetables", price: 1199, cuisine: ["Kebab"], dietary: [], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", rating: 4.6 },
      { name: "Lamb Shish Kebab", description: "Grilled lamb skewers with herbs", price: 1599, cuisine: ["Kebab"], dietary: [], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", rating: 4.8 },
      { name: "Mixed Kebab Platter", description: "Assorted kebabs with rice and salad", price: 1899, cuisine: ["Kebab"], dietary: [], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", rating: 4.9 },
      { name: "Vegetable Kebab", description: "Grilled vegetables with herbs", price: 1099, cuisine: ["Kebab"], dietary: ["Vegetarian"], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", rating: 4.5 },
      // Additional meals for takeaway section
      { name: "Takeaway Chicken Curry", description: "Spicy chicken curry perfect for takeaway", price: 1299, cuisine: ["Indian"], dietary: [], image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&h=120&fit=crop", rating: 4.6 },
      { name: "Takeaway Pad Thai", description: "Classic Thai noodles for takeaway", price: 1199, cuisine: ["Thai"], dietary: [], image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=120&h=120&fit=crop", rating: 4.7 },
      { name: "Takeaway Pizza Margherita", description: "Fresh pizza ready for takeaway", price: 1099, cuisine: ["Italian"], dietary: ["Vegetarian"], image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=120&h=120&fit=crop", rating: 4.5 },
      { name: "Takeaway Beef Burger", description: "Juicy burger perfect for takeaway", price: 1399, cuisine: ["American"], dietary: [], image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop", rating: 4.6 },
      // Additional meals for too-fresh section (sustainability)
      { name: "Fresh Salmon Fillet", description: "Freshly caught salmon, sustainably sourced", price: 1899, cuisine: ["Mediterranean"], dietary: ["Pescatarian"], image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=120&h=120&fit=crop", rating: 4.8 },
      { name: "Organic Parsley Bunch", description: "Fresh organic herbs, locally sourced", price: 399, cuisine: ["Mediterranean"], dietary: ["Vegetarian"], image: "https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=120&h=120&fit=crop", rating: 4.5 },
      { name: "Premium Beef Cut", description: "Grass-fed beef, sustainably raised", price: 2199, cuisine: ["American"], dietary: [], image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=120&h=120&fit=crop", rating: 4.7 },
      { name: "Artisan Bread Loaf", description: "Freshly baked bread, made daily", price: 599, cuisine: ["British"], dietary: ["Vegetarian"], image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120&h=120&fit=crop", rating: 4.6 },
      { name: "Fresh Berries Mix", description: "Organic mixed berries, locally grown", price: 799, cuisine: ["Mediterranean"], dietary: ["Vegetarian"], image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=120&h=120&fit=crop", rating: 4.8 },
      // More kebab variations
      { name: "Beef Doner Kebab", description: "Tender beef doner with fresh vegetables", price: 1299, cuisine: ["Kebab"], dietary: [], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", rating: 4.7 },
      { name: "Chicken Shish Kebab", description: "Marinated chicken skewers", price: 1399, cuisine: ["Kebab"], dietary: [], image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop", rating: 4.8 },
      // UK Marketing Specifics (Caribbean & Roast)
      { name: "Jerk Chicken", description: "Spicy grilled chicken with rice and peas", price: 1450, cuisine: ["Caribbean"], dietary: ["Halal"], image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=120&h=120&fit=crop", rating: 4.9, packagingType: "eco_friendly" },
      { name: "Sunday Roast Beef", description: "Roast beef with Yorkshire pudding and gravy", price: 1899, cuisine: ["British"], dietary: [], image: "https://images.unsplash.com/photo-1582234057039-2a132cb07185?w=120&h=120&fit=crop", rating: 4.8, packagingType: "recyclable" },
    ];

    try {
      // 1. Create a test customer user
      console.log("Creating test customer user...");
      const customerUserId = await ctx.runMutation(api.mutations.users.create, {
        name: "Test Customer",
        email: `test-customer-${Date.now()}@example.com`,
        password: "hashed_password_placeholder", // In production, this should be properly hashed
        roles: ["customer"],
        status: "active",
      });
      console.log(`Created customer user: ${customerUserId}`);

      // 1a. Create cuisines
      console.log("Creating cuisines...");
      const cuisineIds: Id<"cuisines">[] = [];
      for (const cuisine of cuisinesToCreate) {
        const result = await ctx.runMutation(internal.mutations.chefs.createCuisineForSeed, {
          name: cuisine.name,
          description: cuisine.description,
          status: "approved",
          createdBy: customerUserId,
          image: cuisine.image,
        });
        cuisineIds.push(result.cuisineId);
        console.log(`Created cuisine: ${cuisine.name} (${result.cuisineId})`);
      }

      // 2. Create multiple chef users and profiles
      console.log("Creating chef users and profiles...");
      const chefsToCreate = [
        { name: "Amara's Kitchen", bio: "Passionate chef specializing in fusion cuisine", specialties: ["Japanese", "Indian", "Italian"], lat: 51.5074, lng: -0.1278, rating: 4.7 },
        { name: "Marco's Italian", bio: "Authentic Italian cuisine from Naples", specialties: ["Italian"], lat: 51.5150, lng: -0.1300, rating: 4.8 },
        { name: "Spice Route", bio: "Traditional Indian dishes with modern twists", specialties: ["Indian"], lat: 51.5000, lng: -0.1250, rating: 4.6 },
        { name: "Tokyo Express", bio: "Fresh sushi and Japanese street food", specialties: ["Japanese"], lat: 51.5100, lng: -0.1200, rating: 4.9 },
        { name: "Dragon Palace", bio: "Classic Chinese cuisine and dim sum", specialties: ["Chinese"], lat: 51.5050, lng: -0.1150, rating: 4.5 },
        { name: "Taco Fiesta", bio: "Authentic Mexican street food", specialties: ["Mexican"], lat: 51.5120, lng: -0.1100, rating: 4.7 },
        { name: "Kebab House", bio: "Traditional kebabs and grilled meats", specialties: ["Kebab"], lat: 51.5080, lng: -0.1050, rating: 4.8 },
        { name: "Nigerian Delights", bio: "Traditional Nigerian cuisine", specialties: ["Nigerian"], lat: 51.5030, lng: -0.1000, rating: 4.6 },
        { name: "Mama's Caribbean", bio: "Authentic Jamaican and Trinidadian dishes", specialties: ["Caribbean"], lat: 51.5040, lng: -0.0900, rating: 4.9, fsaRating: 5 },
        { name: "The Roast Club", bio: "Best Sunday Roasts in London", specialties: ["British"], lat: 51.5160, lng: -0.1200, rating: 4.7, fsaRating: 5 },
      ];

      const chefIds: Id<"chefs">[] = [];
      for (const chefData of chefsToCreate) {
        const chefUserId = await ctx.runMutation(api.mutations.users.create, {
          name: chefData.name,
          email: `chef-${chefData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@example.com`,
          password: "hashed_password_placeholder",
          roles: ["chef"],
          status: "active",
        });

        const chefId = await ctx.runMutation(internal.mutations.chefs.createChefForSeed, {
          userId: chefUserId,
          name: chefData.name,
          bio: chefData.bio,
          specialties: chefData.specialties,
          location: {
            lat: chefData.lat,
            lng: chefData.lng,
            city: "London",
          },
          rating: chefData.rating,
          status: "active",
        });
        chefIds.push(chefId);
        console.log(`Created chef: ${chefData.name} (${chefId})`);
      }

      // Use first chef as primary chef
      const chefId = chefIds[0];

      // 4. Create meals - distribute across chefs
      console.log("Creating meals...");
      const mealIds: Id<"meals">[] = [];
      const mealToChefMap: Map<Id<"meals">, Id<"chefs">> = new Map();

      // Create a map of cuisine to chef index
      const cuisineToChefIndex: Record<string, number> = {
        "Japanese": 3, // Tokyo Express
        "Indian": 2, // Spice Route
        "Italian": 1, // Marco's Italian
        "Chinese": 4, // Dragon Palace
        "Mexican": 5, // Taco Fiesta
        "Kebab": 6, // Kebab House
        "Nigerian": 7, // Nigerian Delights
        "Caribbean": 8, // Mama's Caribbean
        "British": 9, // The Roast Club
      };

      for (let i = 0; i < sampleDishes.length; i++) {
        const dish = sampleDishes[i];
        // Assign meal to chef based on cuisine match
        let assignedChefId = chefId; // Default to first chef
        const primaryCuisine = dish.cuisine[0];
        if (cuisineToChefIndex[primaryCuisine] !== undefined) {
          const chefIndex = cuisineToChefIndex[primaryCuisine];
          if (chefIndex < chefIds.length) {
            assignedChefId = chefIds[chefIndex];
          }
        }

        const mealId = await ctx.runMutation(internal.mutations.meals.createMealForSeed, {
          chefId: assignedChefId,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          cuisine: dish.cuisine,
          dietary: dish.dietary,
          status: "available",
          images: [dish.image],
          rating: dish.rating,
        });
        mealIds.push(mealId);
        mealToChefMap.set(mealId, assignedChefId);
        console.log(`Created meal: ${dish.name} (${mealId}) for chef ${assignedChefId}`);
      }

      // 5. Create special offers
      console.log("Creating special offers...");
      const now = Date.now();
      const offersToCreate = [
        {
          title: "Weekend Special",
          description: "Get 20% off on all orders this weekend",
          call_to_action_text: "Order Now",
          offer_type: "limited_time" as const,
          discount_type: "percentage" as const,
          discount_value: 20,
          target_audience: "all" as const,
          status: "active" as const,
          starts_at: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          ends_at: now + 5 * 24 * 60 * 60 * 1000, // 5 days from now
          background_image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop",
        },
        {
          title: "New User Bonus",
          description: "First order gets 15% discount",
          call_to_action_text: "Get Started",
          offer_type: "promotional" as const,
          discount_type: "percentage" as const,
          discount_value: 15,
          target_audience: "new_users" as const,
          status: "active" as const,
          starts_at: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
          ends_at: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          background_image_url: "https://images.unsplash.com/photo-1565958911770-bed387754dfa?w=400&h=300&fit=crop",
        },
        {
          title: "Free Delivery",
          description: "Free delivery on orders over £25",
          call_to_action_text: "Order Now",
          offer_type: "promotional" as const,
          discount_type: "free_delivery" as const,
          discount_value: 0,
          target_audience: "all" as const,
          status: "active" as const,
          min_order_amount: 2500, // £25 in pence
          starts_at: now,
          ends_at: now + 14 * 24 * 60 * 60 * 1000, // 14 days from now
          background_image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
        },
        {
          title: "Happy Hour Deal",
          description: "Special prices from 3PM to 6PM",
          call_to_action_text: "Order Now",
          offer_type: "limited_time" as const,
          discount_type: "percentage" as const,
          discount_value: 25,
          target_audience: "all" as const,
          status: "active" as const,
          starts_at: now,
          ends_at: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
          background_image_url: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400&h=300&fit=crop",
        },
        {
          title: "Kebab Special",
          description: "Get £5 off on all kebab orders",
          call_to_action_text: "Order Kebabs",
          offer_type: "promotional" as const,
          discount_type: "fixed_amount" as const,
          discount_value: 500, // £5 in pence
          target_audience: "all" as const,
          status: "active" as const,
          starts_at: now - 1 * 24 * 60 * 60 * 1000,
          ends_at: now + 10 * 24 * 60 * 60 * 1000,
          background_image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
        },
      ];

      const offerIds: Id<"special_offers">[] = [];
      for (const offer of offersToCreate) {
        const offerId = await ctx.runMutation(api.mutations.specialOffers.createSpecialOffer, offer);
        offerIds.push(offerId);
        console.log(`Created offer: ${offer.title} (${offerId})`);
      }

      // 6. Create orders with order_items
      console.log("Creating orders...");
      const ordersToCreate = [
        {
          items: [
            { mealId: mealIds[0], quantity: 2, name: sampleDishes[0].name, price: sampleDishes[0].price },
            { mealId: mealIds[1], quantity: 1, name: sampleDishes[1].name, price: sampleDishes[1].price },
          ],
          daysAgo: 2, // Order from 2 days ago
          chefId: mealToChefMap.get(mealIds[0]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[2], quantity: 1, name: sampleDishes[2].name, price: sampleDishes[2].price },
          ],
          daysAgo: 5, // Order from 5 days ago
          chefId: mealToChefMap.get(mealIds[2]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[3], quantity: 1, name: sampleDishes[3].name, price: sampleDishes[3].price },
            { mealId: mealIds[4], quantity: 1, name: sampleDishes[4].name, price: sampleDishes[4].price },
          ],
          daysAgo: 7, // Order from 7 days ago
          chefId: mealToChefMap.get(mealIds[3]) || chefId,
        },
        // Additional orders for popular/recommended sections
        {
          items: [
            { mealId: mealIds[5], quantity: 1, name: sampleDishes[5].name, price: sampleDishes[5].price },
            { mealId: mealIds[6], quantity: 2, name: sampleDishes[6].name, price: sampleDishes[6].price },
          ],
          daysAgo: 1,
          chefId: mealToChefMap.get(mealIds[5]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[7], quantity: 1, name: sampleDishes[7].name, price: sampleDishes[7].price },
          ],
          daysAgo: 3,
          chefId: mealToChefMap.get(mealIds[7]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[8], quantity: 1, name: sampleDishes[8].name, price: sampleDishes[8].price },
            { mealId: mealIds[9], quantity: 1, name: sampleDishes[9].name, price: sampleDishes[9].price },
          ],
          daysAgo: 4,
          chefId: mealToChefMap.get(mealIds[8]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[10], quantity: 1, name: sampleDishes[10].name, price: sampleDishes[10].price },
          ],
          daysAgo: 6,
          chefId: mealToChefMap.get(mealIds[10]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[11], quantity: 2, name: sampleDishes[11].name, price: sampleDishes[11].price },
          ],
          daysAgo: 8,
          chefId: mealToChefMap.get(mealIds[11]) || chefId,
        },
        // Kebab orders for TopKebabs section
        {
          items: [
            { mealId: mealIds[12], quantity: 1, name: sampleDishes[12].name, price: sampleDishes[12].price },
          ],
          daysAgo: 1,
          chefId: mealToChefMap.get(mealIds[12]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[13], quantity: 1, name: sampleDishes[13].name, price: sampleDishes[13].price },
          ],
          daysAgo: 2,
          chefId: mealToChefMap.get(mealIds[13]) || chefId,
        },
        {
          items: [
            { mealId: mealIds[14], quantity: 1, name: sampleDishes[14].name, price: sampleDishes[14].price },
          ],
          daysAgo: 3,
          chefId: mealToChefMap.get(mealIds[14]) || chefId,
        },
      ];

      for (const orderData of ordersToCreate) {
        const orderDate = new Date(now - orderData.daysAgo * 24 * 60 * 60 * 1000);
        const totalAmount = orderData.items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Use internal mutation for seeding to avoid region check issues
        const orderDocId = await ctx.runMutation(internal.mutations.orders.createOrderForSeed, {
          customer_id: customerUserId,
          chef_id: orderData.chefId,
          order_items: orderData.items.map((item) => ({
            dish_id: item.mealId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
          total_amount: totalAmount,
          order_date: orderDate.toISOString(),
          createdAt: orderDate.getTime(),
        });

        // Get the order document to retrieve its order_id string
        // We'll query by customer to find the most recent order
        const recentOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
          customer_id: customerUserId as string,
          status: "all",
          order_type: "all",
        });

        // Find the order we just created (most recent one)
        const orderDoc = recentOrders
          .filter((o: any) => o._id === orderDocId)
          .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))[0];

        // Update order status to completed
        if (orderDoc && orderDoc.order_id) {
          await ctx.runMutation(api.mutations.orders.updateStatus, {
            order_id: orderDoc.order_id,
            status: "completed",
          });

          // Mark as paid
          await ctx.runMutation(api.mutations.orders.markPaid, {
            order_id: orderDoc.order_id,
            paymentIntentId: `payment_${Date.now()}`,
          });
        }

        console.log(`Created order: ${orderDocId} (${orderData.daysAgo} days ago)`);
      }

      // 7. Create recipes for Nosh Heaven
      console.log("Creating recipes...");
      const recipesToCreate = [
        {
          title: "Classic Chicken Tikka Masala",
          description: "A creamy, aromatic curry that's a British favorite. Tender chicken pieces in a rich tomato-based sauce with Indian spices.",
          ingredients: [
            { name: "chicken breast", amount: "500", unit: "g" },
            { name: "plain yogurt", amount: "200", unit: "ml" },
            { name: "garlic", amount: "4", unit: "cloves" },
            { name: "ginger", amount: "2", unit: "cm piece" },
            { name: "ground cumin", amount: "1", unit: "tsp" },
            { name: "ground coriander", amount: "1", unit: "tsp" },
            { name: "turmeric", amount: "0.5", unit: "tsp" },
            { name: "tomatoes", amount: "400", unit: "g" },
            { name: "double cream", amount: "200", unit: "ml" },
            { name: "butter", amount: "50", unit: "g" },
            { name: "onion", amount: "1", unit: "large" },
            { name: "garam masala", amount: "1", unit: "tsp" },
          ],
          instructions: [
            "Cut chicken into bite-sized pieces and marinate in yogurt, half the garlic, half the ginger, cumin, coriander, and turmeric for at least 2 hours.",
            "Heat butter in a large pan and cook the marinated chicken until golden brown. Remove and set aside.",
            "In the same pan, sauté the onion until soft, then add remaining garlic and ginger.",
            "Add tomatoes and cook until they break down into a sauce.",
            "Return chicken to the pan, add cream and garam masala, and simmer for 15 minutes.",
            "Season with salt and serve with basmati rice or naan bread.",
          ],
          prepTime: 30,
          cookTime: 45,
          servings: 4,
          difficulty: "medium" as const,
          cuisine: "Indian",
          dietary: ["Gluten-free"],
          author: "Chef Priya",
          featuredImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
        },
        {
          title: "Perfect Margherita Pizza",
          description: "The classic Italian pizza with fresh mozzarella, basil, and a simple tomato sauce. Simple ingredients, incredible flavor.",
          ingredients: [
            { name: "strong bread flour", amount: "500", unit: "g" },
            { name: "active dry yeast", amount: "7", unit: "g" },
            { name: "salt", amount: "10", unit: "g" },
            { name: "olive oil", amount: "2", unit: "tbsp" },
            { name: "warm water", amount: "325", unit: "ml" },
            { name: "canned tomatoes", amount: "400", unit: "g" },
            { name: "fresh mozzarella", amount: "250", unit: "g" },
            { name: "fresh basil", amount: "20", unit: "leaves" },
            { name: "garlic", amount: "2", unit: "cloves" },
          ],
          instructions: [
            "Mix flour, yeast, and salt in a large bowl. Make a well and add warm water and olive oil.",
            "Knead for 10 minutes until smooth and elastic. Place in oiled bowl, cover, and rise for 1 hour.",
            "For the sauce, blend tomatoes with garlic and a pinch of salt until smooth.",
            "Preheat oven to 250°C (or as high as it goes) with a pizza stone if you have one.",
            "Divide dough into 2-3 balls. Roll out one ball on a floured surface.",
            "Spread sauce thinly, top with torn mozzarella, and bake for 8-10 minutes until golden.",
            "Remove from oven, top with fresh basil leaves, and drizzle with olive oil.",
          ],
          prepTime: 90,
          cookTime: 15,
          servings: 2,
          difficulty: "medium" as const,
          cuisine: "Italian",
          dietary: ["Vegetarian"],
          author: "Chef Marco",
          featuredImage: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=600&fit=crop",
        },
        {
          title: "Homemade Sushi Rolls",
          description: "Learn to make perfect sushi rolls at home. Fresh salmon, avocado, and cucumber wrapped in seasoned rice and nori.",
          ingredients: [
            { name: "sushi rice", amount: "300", unit: "g" },
            { name: "rice vinegar", amount: "60", unit: "ml" },
            { name: "sugar", amount: "2", unit: "tbsp" },
            { name: "salt", amount: "1", unit: "tsp" },
            { name: "nori sheets", amount: "6", unit: "sheets" },
            { name: "fresh salmon", amount: "200", unit: "g" },
            { name: "avocado", amount: "1", unit: "ripe" },
            { name: "cucumber", amount: "0.5", unit: "medium" },
            { name: "wasabi", amount: "1", unit: "tsp" },
            { name: "soy sauce", amount: "50", unit: "ml" },
          ],
          instructions: [
            "Rinse rice until water runs clear. Cook according to package instructions.",
            "Mix rice vinegar, sugar, and salt. Gently fold into warm rice and let cool.",
            "Cut salmon into thin strips. Slice avocado and cucumber into matchsticks.",
            "Place nori sheet shiny side down on a bamboo mat. Spread rice evenly, leaving 1cm at top.",
            "Add salmon, avocado, and cucumber in a line near the bottom edge.",
            "Roll tightly using the mat, wetting the top edge to seal.",
            "Cut into 6-8 pieces with a sharp, wet knife. Serve with wasabi and soy sauce.",
          ],
          prepTime: 60,
          cookTime: 20,
          servings: 3,
          difficulty: "hard" as const,
          cuisine: "Japanese",
          dietary: ["Pescatarian"],
          author: "Chef Yuki",
          featuredImage: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",
        },
        {
          title: "Authentic Jollof Rice",
          description: "The ultimate West African one-pot dish. Fragrant rice cooked in a rich tomato and pepper sauce with spices.",
          ingredients: [
            { name: "long grain rice", amount: "400", unit: "g" },
            { name: "tomatoes", amount: "4", unit: "large" },
            { name: "red bell peppers", amount: "2", unit: "large" },
            { name: "onion", amount: "1", unit: "large" },
            { name: "garlic", amount: "4", unit: "cloves" },
            { name: "ginger", amount: "2", unit: "cm piece" },
            { name: "tomato paste", amount: "2", unit: "tbsp" },
            { name: "chicken stock", amount: "500", unit: "ml" },
            { name: "curry powder", amount: "1", unit: "tsp" },
            { name: "thyme", amount: "1", unit: "tsp" },
            { name: "bay leaves", amount: "2", unit: "leaves" },
            { name: "vegetable oil", amount: "3", unit: "tbsp" },
          ],
          instructions: [
            "Blend tomatoes, peppers, onion, garlic, and ginger until smooth.",
            "Heat oil in a large pot and fry the blended mixture for 10 minutes until reduced.",
            "Add tomato paste, curry powder, and thyme. Cook for 2 more minutes.",
            "Add rice and stir to coat. Pour in stock and add bay leaves.",
            "Bring to boil, then reduce heat, cover, and simmer for 25-30 minutes.",
            "Remove from heat and let steam for 10 minutes. Fluff with fork and serve.",
          ],
          prepTime: 20,
          cookTime: 45,
          servings: 6,
          difficulty: "medium" as const,
          cuisine: "Nigerian",
          dietary: ["Vegetarian", "Vegan"],
          author: "Chef Amara",
          featuredImage: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop",
        },
        {
          title: "Pad Thai Noodles",
          description: "The iconic Thai street food dish. Sweet, sour, and savory flavors in every bite with perfectly balanced noodles.",
          ingredients: [
            { name: "rice noodles", amount: "200", unit: "g" },
            { name: "shrimp", amount: "200", unit: "g" },
            { name: "firm tofu", amount: "150", unit: "g" },
            { name: "eggs", amount: "2", unit: "large" },
            { name: "bean sprouts", amount: "100", unit: "g" },
            { name: "garlic chives", amount: "50", unit: "g" },
            { name: "tamarind paste", amount: "2", unit: "tbsp" },
            { name: "fish sauce", amount: "2", unit: "tbsp" },
            { name: "palm sugar", amount: "2", unit: "tbsp" },
            { name: "lime", amount: "1", unit: "juice" },
            { name: "peanuts", amount: "50", unit: "g" },
            { name: "red chili", amount: "1", unit: "small" },
          ],
          instructions: [
            "Soak rice noodles in warm water for 30 minutes until pliable but not soft.",
            "Mix tamarind paste, fish sauce, and palm sugar to make the sauce.",
            "Heat oil in a wok and scramble eggs. Push to one side.",
            "Add shrimp and tofu, cook until shrimp is pink.",
            "Add noodles and sauce. Toss everything together for 2-3 minutes.",
            "Add bean sprouts and chives. Toss once more.",
            "Serve immediately with lime wedges, crushed peanuts, and chili flakes.",
          ],
          prepTime: 40,
          cookTime: 10,
          servings: 2,
          difficulty: "medium" as const,
          cuisine: "Thai",
          dietary: ["Pescatarian"],
          author: "Chef Somchai",
          featuredImage: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop",
        },
        {
          title: "Beef Bulgogi",
          description: "Korean marinated beef that's sweet, savory, and incredibly tender. Perfect for grilling or pan-frying.",
          ingredients: [
            { name: "ribeye steak", amount: "500", unit: "g" },
            { name: "soy sauce", amount: "60", unit: "ml" },
            { name: "pear", amount: "0.5", unit: "medium" },
            { name: "onion", amount: "0.5", unit: "medium" },
            { name: "garlic", amount: "4", unit: "cloves" },
            { name: "ginger", amount: "2", unit: "cm piece" },
            { name: "brown sugar", amount: "2", unit: "tbsp" },
            { name: "sesame oil", amount: "1", unit: "tbsp" },
            { name: "black pepper", amount: "0.5", unit: "tsp" },
            { name: "spring onions", amount: "3", unit: "stalks" },
          ],
          instructions: [
            "Slice beef very thinly against the grain. Freeze for 30 minutes first to make slicing easier.",
            "Blend pear, onion, garlic, and ginger until smooth.",
            "Mix with soy sauce, sugar, sesame oil, and pepper to make marinade.",
            "Marinate beef for at least 2 hours, or overnight for best results.",
            "Heat a large pan or grill to high heat. Cook beef in batches for 2-3 minutes per side.",
            "Garnish with sliced spring onions and serve with rice and kimchi.",
          ],
          prepTime: 30,
          cookTime: 10,
          servings: 4,
          difficulty: "easy" as const,
          cuisine: "Korean",
          dietary: [],
          author: "Chef Min-jun",
          featuredImage: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop",
        },
        {
          title: "Chicken Doner Kebab",
          description: "Tender, spiced chicken cooked on a vertical rotisserie, served in warm pita with fresh vegetables and sauces.",
          ingredients: [
            { name: "chicken thighs", amount: "600", unit: "g" },
            { name: "plain yogurt", amount: "150", unit: "ml" },
            { name: "olive oil", amount: "3", unit: "tbsp" },
            { name: "lemon juice", amount: "2", unit: "tbsp" },
            { name: "garlic", amount: "4", unit: "cloves" },
            { name: "paprika", amount: "1", unit: "tsp" },
            { name: "cumin", amount: "1", unit: "tsp" },
            { name: "coriander", amount: "1", unit: "tsp" },
            { name: "oregano", amount: "1", unit: "tsp" },
            { name: "pita bread", amount: "4", unit: "pieces" },
            { name: "lettuce", amount: "100", unit: "g" },
            { name: "tomatoes", amount: "2", unit: "medium" },
            { name: "red onion", amount: "0.5", unit: "medium" },
            { name: "tzatziki", amount: "100", unit: "ml" },
          ],
          instructions: [
            "Cut chicken into thin strips and mix with yogurt, oil, lemon, garlic, and all spices.",
            "Marinate for at least 4 hours, preferably overnight.",
            "Thread chicken onto skewers or stack for vertical cooking.",
            "Cook on high heat, turning regularly, until golden and cooked through (15-20 minutes).",
            "Warm pita bread. Slice cooked chicken thinly.",
            "Fill pita with chicken, lettuce, tomatoes, onion, and tzatziki.",
            "Serve immediately while hot.",
          ],
          prepTime: 20,
          cookTime: 20,
          servings: 4,
          difficulty: "easy" as const,
          cuisine: "Kebab",
          dietary: [],
          author: "Chef Mehmet",
          featuredImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
        },
        {
          title: "Spaghetti Carbonara",
          description: "The authentic Roman pasta dish. Creamy, rich, and made without cream - just eggs, cheese, and pancetta.",
          ingredients: [
            { name: "spaghetti", amount: "400", unit: "g" },
            { name: "pancetta", amount: "200", unit: "g" },
            { name: "eggs", amount: "4", unit: "large" },
            { name: "pecorino romano", amount: "100", unit: "g" },
            { name: "black pepper", amount: "1", unit: "tsp" },
            { name: "garlic", amount: "2", unit: "cloves" },
          ],
          instructions: [
            "Cook spaghetti in salted boiling water until al dente. Reserve a cup of pasta water.",
            "Cut pancetta into small cubes and fry until crispy. Remove from pan.",
            "Whisk eggs with grated pecorino and black pepper in a bowl.",
            "Drain pasta and immediately add to the pan with pancetta (off heat).",
            "Quickly toss pasta, then add egg mixture, stirring constantly.",
            "Add pasta water a little at a time until creamy. Serve immediately with extra cheese.",
          ],
          prepTime: 10,
          cookTime: 15,
          servings: 4,
          difficulty: "medium" as const,
          cuisine: "Italian",
          dietary: [],
          author: "Chef Marco",
          featuredImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
        },
      ];

      const recipeIds: Id<"recipes">[] = [];
      for (const recipeData of recipesToCreate) {
        const recipeId = await ctx.runMutation(internal.mutations.recipes.createRecipeForSeed, {
          ...recipeData,
          status: "published" as const,
        });
        recipeIds.push(recipeId);
        console.log(`Created recipe: ${recipeData.title} (${recipeId})`);
      }

      // Create sample blog posts (stories) with images
      const blogPostsToCreate = [
        {
          title: "The Art of Perfect Pasta",
          content: "<p>Discover the secrets to making perfect pasta at home. From choosing the right flour to mastering the dough, this guide covers everything you need to know.</p>",
          excerpt: "Learn the techniques that professional chefs use to create perfect pasta every time.",
          body: [
            "Pasta making is both an art and a science. The key is in the ingredients and technique.",
            "Start with high-quality flour and fresh eggs for the best results.",
            "Kneading the dough properly is crucial for developing the right texture.",
          ],
          author: {
            name: "Chef Marco",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          },
          categories: ["Cooking", "Italian"],
          date: "January 2025",
          coverImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
          featuredImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
          tags: ["pasta", "cooking", "italian"],
          status: "published" as const,
        },
        {
          title: "Exploring Street Food Culture",
          content: "<p>Street food is more than just quick meals - it's a window into the culture and traditions of a place. Join us as we explore the vibrant street food scenes around the world.</p>",
          excerpt: "A journey through the world's most exciting street food destinations and their unique flavors.",
          body: [
            "Street food offers an authentic taste of local culture.",
            "From Bangkok's night markets to Mexico City's taco stands, each destination has its own character.",
            "The best street food vendors have been perfecting their recipes for generations.",
          ],
          author: {
            name: "Food Explorer",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
          },
          categories: ["Travel", "Food Culture"],
          date: "January 2025",
          coverImage: "https://images.unsplash.com/photo-1565299585323-38174c3d1e3d?w=800&h=600&fit=crop",
          featuredImage: "https://images.unsplash.com/photo-1565299585323-38174c3d1e3d?w=800&h=600&fit=crop",
          tags: ["street food", "travel", "culture"],
          status: "published" as const,
        },
        {
          title: "Sustainable Cooking Practices",
          content: "<p>Learn how to reduce food waste and cook more sustainably. Small changes in the kitchen can make a big impact on the environment.</p>",
          excerpt: "Practical tips for reducing waste and making your cooking more environmentally friendly.",
          body: [
            "Sustainable cooking starts with mindful shopping and meal planning.",
            "Using every part of the ingredient reduces waste and adds flavor.",
            "Composting and proper storage extend the life of your ingredients.",
          ],
          author: {
            name: "Eco Chef",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
          },
          categories: ["Sustainability", "Tips"],
          date: "January 2025",
          coverImage: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=600&fit=crop",
          featuredImage: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=600&fit=crop",
          tags: ["sustainability", "eco-friendly", "tips"],
          status: "published" as const,
        },
        {
          title: "The Science of Flavor Pairing",
          content: "<p>Understanding flavor chemistry can help you create more exciting and balanced dishes. Discover the principles behind successful flavor combinations.</p>",
          excerpt: "Explore the science behind why certain flavors work so well together.",
          body: [
            "Flavor pairing is based on shared chemical compounds between ingredients.",
            "Understanding these connections can help you create unexpected but harmonious combinations.",
            "Experimentation is key to discovering your own favorite pairings.",
          ],
          author: {
            name: "Chef Scientist",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
          },
          categories: ["Science", "Cooking"],
          date: "January 2025",
          coverImage: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",
          featuredImage: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",
          tags: ["flavor", "science", "cooking"],
          status: "published" as const,
        },
        {
          title: "Mastering the Art of Fermentation",
          content: "<p>Fermentation is one of the oldest food preservation techniques, and it's making a comeback. Learn how to ferment vegetables, make sourdough, and more.</p>",
          excerpt: "A beginner's guide to fermentation and how it can transform your cooking.",
          body: [
            "Fermentation adds complex flavors and beneficial probiotics to your food.",
            "Starting with simple ferments like sauerkraut is a great way to begin.",
            "Patience and proper technique are essential for successful fermentation.",
          ],
          author: {
            name: "Fermentation Expert",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          },
          categories: ["Techniques", "Preservation"],
          date: "January 2025",
          coverImage: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop",
          featuredImage: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop",
          tags: ["fermentation", "preservation", "techniques"],
          status: "published" as const,
        },
      ];

      const blogPostIds: Id<"blogPosts">[] = [];
      for (const postData of blogPostsToCreate) {
        const postId = await ctx.runMutation(internal.mutations.blog.createBlogPostForSeed, postData);
        blogPostIds.push(postId);
        console.log(`Created blog post: ${postData.title} (${postId})`);
      }

      // 8. Create videos for Nosh Heaven
      console.log("Creating videos for Nosh Heaven...");
      const videosToCreate = [
        {
          title: "How to Make Perfect Pasta Carbonara",
          description: "Learn the authentic Italian technique for making creamy carbonara without cream. This classic Roman dish is simpler than you think!",
          tags: ["pasta", "italian", "carbonara", "cooking", "tutorial"],
          cuisine: "Italian",
          difficulty: "intermediate" as const,
          duration: 300, // 5 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
        },
        {
          title: "Chicken Tikka Masala from Scratch",
          description: "Master this British-Indian favorite with tender chicken in a rich, creamy tomato sauce. Perfect for dinner parties!",
          tags: ["chicken", "indian", "curry", "tikka", "masala"],
          cuisine: "Indian",
          difficulty: "intermediate" as const,
          duration: 420, // 7 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
        },
        {
          title: "Homemade Sushi Rolls Tutorial",
          description: "Step-by-step guide to making perfect sushi rolls at home. Fresh salmon, avocado, and perfectly seasoned rice.",
          tags: ["sushi", "japanese", "seafood", "healthy", "tutorial"],
          cuisine: "Japanese",
          difficulty: "advanced" as const,
          duration: 600, // 10 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",
        },
        {
          title: "Authentic Jollof Rice Recipe",
          description: "The ultimate West African one-pot dish. Fragrant rice cooked in a rich tomato and pepper sauce with spices.",
          tags: ["jollof", "nigerian", "rice", "african", "one-pot"],
          cuisine: "Nigerian",
          difficulty: "intermediate" as const,
          duration: 480, // 8 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop",
        },
        {
          title: "Pad Thai Street Food Style",
          description: "Recreate the iconic Thai street food at home. Sweet, sour, and savory flavors in every bite.",
          tags: ["pad thai", "thai", "noodles", "street food", "stir-fry"],
          cuisine: "Thai",
          difficulty: "intermediate" as const,
          duration: 360, // 6 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop",
        },
        {
          title: "Perfect Margherita Pizza",
          description: "The classic Italian pizza with fresh mozzarella, basil, and simple tomato sauce. Simple ingredients, incredible flavor.",
          tags: ["pizza", "italian", "margherita", "vegetarian", "baking"],
          cuisine: "Italian",
          difficulty: "intermediate" as const,
          duration: 540, // 9 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800&h=600&fit=crop",
        },
        {
          title: "Korean Bulgogi Beef",
          description: "Sweet, savory, and incredibly tender marinated beef. Perfect for grilling or pan-frying.",
          tags: ["bulgogi", "korean", "beef", "bbq", "marinated"],
          cuisine: "Korean",
          difficulty: "beginner" as const,
          duration: 300, // 5 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop",
        },
        {
          title: "Chicken Doner Kebab",
          description: "Tender, spiced chicken cooked on a vertical rotisserie, served in warm pita with fresh vegetables and sauces.",
          tags: ["kebab", "chicken", "middle eastern", "street food", "wrap"],
          cuisine: "Kebab",
          difficulty: "beginner" as const,
          duration: 450, // 7.5 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
        },
        {
          title: "Classic Fish and Chips",
          description: "Crispy battered fish with golden chips. The ultimate British comfort food, made at home.",
          tags: ["fish", "chips", "british", "fried", "comfort food"],
          cuisine: "British",
          difficulty: "intermediate" as const,
          duration: 480, // 8 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop",
        },
        {
          title: "Spicy Green Curry",
          description: "Aromatic Thai green curry with vegetables. Learn the secret to balancing heat and flavor.",
          tags: ["curry", "thai", "green curry", "vegetarian", "spicy"],
          cuisine: "Thai",
          difficulty: "beginner" as const,
          duration: 360, // 6 minutes
          thumbnailUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&h=600&fit=crop",
        },
      ];

      const videoIds: Id<"videoPosts">[] = [];

      // Helper function to upload a placeholder file and get storage ID
      const uploadPlaceholderFile = async (contentType: string, fileName: string): Promise<Id<"_storage">> => {
        // Generate upload URL
        const uploadUrl = await ctx.storage.generateUploadUrl();

        // Create a minimal placeholder file
        // For videos, we'll use a very small test video file
        // For thumbnails, we'll use a 1x1 pixel PNG
        let fileContent: Buffer;
        if (contentType.startsWith('video/')) {
          // Use a minimal MP4 file (1 second of black video)
          // In a real scenario, you'd download a test video or create one
          // For now, we'll create a minimal valid MP4 header
          // This is a very basic approach - in production you'd use actual video files
          fileContent = Buffer.from([
            0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
            0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
            0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
            0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
            0x6D, 0x64, 0x61, 0x74, 0x00, 0x00, 0x00, 0x00
          ]);
        } else {
          // 1x1 pixel transparent PNG
          fileContent = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
            0x42, 0x60, 0x82
          ]);
        }

        // Upload the file
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': contentType,
          },
          body: fileContent,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${fileName}: ${uploadResponse.statusText}`);
        }

        const result = await uploadResponse.json();
        if (!result.storageId) {
          throw new Error(`No storageId in upload response for ${fileName}`);
        }

        return result.storageId as Id<"_storage">;
      };

      for (const videoData of videosToCreate) {
        try {
          // Assign video to a random chef
          const randomChefIndex = Math.floor(Math.random() * chefIds.length);
          const chefId = chefIds[randomChefIndex];

          // Get the chef's user ID
          const chef = await ctx.runQuery(api.queries.chefs.getChefById, { chefId });
          if (!chef || !chef.userId) {
            console.warn(`Skipping video ${videoData.title} - chef not found`);
            continue;
          }

          // Upload placeholder video and thumbnail
          const videoStorageId = await uploadPlaceholderFile('video/mp4', `video-${Date.now()}.mp4`);
          const thumbnailStorageId = await uploadPlaceholderFile('image/png', `thumbnail-${Date.now()}.png`);

          // Create video post using mutation that accepts userId
          const videoId = await ctx.runMutation(api.mutations.videoPosts.createVideoPostByUserId, {
            userId: chef.userId,
            title: videoData.title,
            description: videoData.description,
            videoStorageId,
            thumbnailStorageId,
            duration: videoData.duration,
            fileSize: 5 * 1024 * 1024, // 5MB placeholder
            resolution: {
              width: 1920,
              height: 1080,
            },
            tags: videoData.tags,
            cuisine: videoData.cuisine,
            difficulty: videoData.difficulty,
            visibility: "public",
            isLive: false,
          });

          // Publish the video using internal mutation (bypasses auth)
          await ctx.runMutation(internal.mutations.videoPosts.publishVideoPostForSeed, {
            videoId,
          });

          // Note: Engagement metrics (likes, views, comments, shares) start at 0
          // They will be updated as users interact with the videos

          videoIds.push(videoId);
          console.log(`Created video: ${videoData.title} (${videoId})`);
        } catch (error) {
          console.error(`Error creating video ${videoData.title}:`, error);
          // Continue with other videos
        }
      }

      console.log("Seed data injection completed successfully!");
      return {
        success: true,
        message: "All home screen sections seeded successfully",
        customerUserId,
        chefIds,
        mealIds,
        cuisineIds,
        offerIds,
        recipeIds,
        blogPostIds,
        videoIds,
        totalChefs: chefIds.length,
        totalMeals: mealIds.length,
        totalCuisines: cuisineIds.length,
        totalOffers: offerIds.length,
        totalRecipes: recipeIds.length,
        totalBlogPosts: blogPostIds.length,
        totalVideos: videoIds.length,
      };
    } catch (error) {
      console.error("Error seeding data:", error);
      throw error;
    }
  },
});

// Keep old function name for backward compatibility
export const seedOrderAgainData = seedAllHomeScreenData;

