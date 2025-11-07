"use node";

import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

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
        const result = await ctx.runMutation(api.mutations.chefs.createCuisine, {
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

        const chefId = await ctx.runMutation(api.mutations.chefs.createChef, {
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
        
        const mealId = await ctx.runMutation(api.mutations.meals.createMeal, {
          chefId: assignedChefId as string,
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

      console.log("Seed data injection completed successfully!");
      return {
        success: true,
        message: "All home screen sections seeded successfully",
        customerUserId,
        chefIds,
        mealIds,
        cuisineIds,
        offerIds,
        totalChefs: chefIds.length,
        totalMeals: mealIds.length,
        totalCuisines: cuisineIds.length,
        totalOffers: offerIds.length,
      };
    } catch (error) {
      console.error("Error seeding data:", error);
      throw error;
    }
  },
});

// Keep old function name for backward compatibility
export const seedOrderAgainData = seedAllHomeScreenData;

