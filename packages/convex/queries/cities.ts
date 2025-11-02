import { query } from "../_generated/server";
import { v } from "convex/values";

export const getCities = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let cities = await ctx.db.query("cities").collect();
    
    if (args.status) {
      cities = cities.filter((city: any) => city.status === args.status);
    }
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      cities = cities.filter((city: any) => 
        city.name.toLowerCase().includes(searchLower) ||
        city.state?.toLowerCase().includes(searchLower) ||
        city.country.toLowerCase().includes(searchLower)
      );
    }
    
    return cities.map((city: any) => ({
      _id: city._id,
      name: city.name,
      state: city.state,
      country: city.country,
      status: city.status as 'active' | 'inactive' | 'coming_soon',
      serviceArea: city.serviceArea || [],
      deliveryFee: city.deliveryFee || 0,
      minOrderAmount: city.minOrderAmount || 0,
      estimatedDeliveryTime: city.estimatedDeliveryTime || '30-45 min',
      chefCount: Math.floor(Math.random() * 50) + 5, // Mock data
      orderCount: Math.floor(Math.random() * 1000) + 100, // Mock data
      createdAt: city.createdAt,
      updatedAt: city.updatedAt
    }));
  },
});

export const getCityStats = query({
  args: {},
  handler: async (ctx: any) => {
    const cities = await ctx.db.query("cities").collect();
    const active = cities.filter((city: any) => city.status === 'active').length;
    const inactive = cities.filter((city: any) => city.status === 'inactive').length;
    const comingSoon = cities.filter((city: any) => city.status === 'coming_soon').length;
    
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
  handler: async (ctx: any) => {
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
