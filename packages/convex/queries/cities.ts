import { query, QueryCtx } from "../_generated/server";
import { v } from "convex/values";

export const getCities = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx: QueryCtx, args) => {
    let cities = await ctx.db.query("cities").collect();
    
    if (args.status) {
      cities = cities.filter((city) => city.status === args.status);
    }
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      cities = cities.filter((city) => 
        city.name.toLowerCase().includes(searchLower) ||
        city.state?.toLowerCase().includes(searchLower) ||
        city.country.toLowerCase().includes(searchLower)
      );
    }
    
    // Get real chef and order counts from database
    const chefs = await ctx.db.query("chefs").collect();
    const orders = await ctx.db.query("orders").collect();
    
    // Count chefs and orders per city
    const chefCountsByCity = new Map<string, number>();
    const orderCountsByCity = new Map<string, number>();
    
    chefs.forEach((chef) => {
      const cityName = (chef.location as { city?: string } | undefined)?.city || (chef as { city?: string }).city;
      if (cityName) {
        chefCountsByCity.set(cityName, (chefCountsByCity.get(cityName) || 0) + 1);
      }
    });
    
    orders.forEach((order) => {
      const cityName = (order.delivery_address as { city?: string } | undefined)?.city;
      if (cityName) {
        orderCountsByCity.set(cityName, (orderCountsByCity.get(cityName) || 0) + 1);
      }
    });
    
    return cities.map((city) => ({
      _id: city._id,
      name: city.name,
      state: city.state,
      country: city.country,
      status: city.status as 'active' | 'inactive' | 'coming_soon',
      serviceArea: city.serviceArea || [],
      deliveryFee: city.deliveryFee || 0,
      minOrderAmount: city.minOrderAmount || 0,
      estimatedDeliveryTime: city.estimatedDeliveryTime || '30-45 min',
      chefCount: chefCountsByCity.get(city.name) || 0,
      orderCount: orderCountsByCity.get(city.name) || 0,
      createdAt: city.createdAt,
      updatedAt: city.updatedAt
    }));
  },
});

export const getCityStats = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const cities = await ctx.db.query("cities").collect();
    const active = cities.filter((city) => city.status === 'active').length;
    const inactive = cities.filter((city) => city.status === 'inactive').length;
    const comingSoon = cities.filter((city) => city.status === 'coming_soon').length;
    
    return {
      total: cities.length,
      active,
      inactive,
      comingSoon
    };
  },
});

// Additional functions needed by frontend
export const getCountries = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return [
      { code: 'US', name: 'United States' },
      { code: 'UK', name: 'United Kingdom' },
      { code: 'CA', name: 'Canada' },
      { code: 'AU', name: 'Australia' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'GH', name: 'Ghana' },
      { code: 'KE', name: 'Kenya' },
    ];
  },
});
