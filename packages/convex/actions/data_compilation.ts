"use node";
import { action } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Doc, Id } from '../_generated/dataModel';

// Type definitions for query return types based on schema
type User = Doc<'users'>;
type Order = Doc<'orders'>;

// Type definitions matching query return types
type PaymentMethod = {
  id: Id<'paymentMethods'>;
  type: 'card' | 'apple_pay' | 'google_pay';
  is_default: boolean;
  last4: string | null;
  brand: string | null;
  exp_month: number | null;
  exp_year: number | null;
  created_at: string;
};

type DietaryPreferences = {
  preferences: string[];
  religious_requirements: string[];
  health_driven: string[];
  updated_at: string;
};

type Allergy = {
  id: Id<'allergies'>;
  name: string;
  type: 'allergy' | 'intolerance';
  severity: 'mild' | 'moderate' | 'severe';
  created_at: string;
};

type Review = Doc<'reviews'>;
type SupportCase = Doc<'supportCases'>;
type DataDownload = Doc<'dataDownloads'>;

interface CompiledUserData {
  user: {
    id: Id<'users'>;
    name: string | undefined;
    email: string;
    phone_number: string | undefined;
    created_at: string;
  };
  orders: Array<{
    order_id: string;
    total_amount: number;
    order_status: string;
    order_date: string | undefined;
  }>;
  payment_methods: Array<{
    type: 'card' | 'apple_pay' | 'google_pay';
    is_default: boolean;
    last4: string | null;
  }>;
  preferences: DietaryPreferences;
  allergies: Allergy[];
  reviews: Array<{
    _id: Id<'reviews'>;
    rating: number;
    comment: string | undefined;
    createdAt: number;
  }>;
  support_cases: Array<{
    subject: string;
    status: 'open' | 'closed' | 'resolved';
    created_at: string;
  }>;
}

export const compileUserDataAction = action({
  args: {
    userId: v.id('users'),
    downloadToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    dataSize: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; dataSize: number }> => {
    // This action runs in a background context
    // Fetch all user data from queries
    const user: User | null = await ctx.runQuery(api.queries.users.getById, { userId: args.userId });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get orders - need to convert userId to string for listByCustomer
    const userIdString = user._id;
    const ordersResult: Order[] = await ctx.runQuery(api.queries.orders.listByCustomer, { customer_id: userIdString });
    
    // Type-safe queries - using explicit types that match query return types
    // Using module-level query names that TypeScript currently recognizes
    // Once Convex regenerates types, these will use the aliased names from queries/index.ts
    const paymentMethodsResult: PaymentMethod[] = await ctx.runQuery(
      api.queries.paymentMethods.getByUserId,
      { userId: args.userId }
    );
    
    const preferencesResult: DietaryPreferences = await ctx.runQuery(
      api.queries.dietaryPreferences.getByUserId,
      { userId: args.userId }
    );
    
    const allergiesResult: Allergy[] = await ctx.runQuery(
      api.queries.allergies.getByUserId,
      { userId: args.userId }
    );
    
    const allReviews: Review[] = await ctx.runQuery(api.queries.reviews.getAll, {});
    const userReviews: Review[] = allReviews.filter((r: Review) => r.user_id === args.userId);
    
    const supportCasesResult: SupportCase[] = await ctx.runQuery(
      api.queries.supportCases.getByUserId,
      { userId: args.userId }
    );

    // Compile data with proper types
    const compiledData: CompiledUserData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        created_at: new Date(user._creationTime).toISOString(),
      },
      orders: ordersResult.map((order: Order) => ({
        order_id: order.order_id,
        total_amount: order.total_amount,
        order_status: order.order_status,
        order_date: order.order_date,
      })),
      payment_methods: paymentMethodsResult.map((pm: PaymentMethod) => ({
        type: pm.type,
        is_default: pm.is_default,
        last4: pm.last4,
      })),
      preferences: preferencesResult,
      allergies: allergiesResult,
      reviews: userReviews.map((review: Review) => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
      support_cases: supportCasesResult.map((sc: SupportCase) => ({
        subject: sc.subject,
        status: sc.status,
        created_at: new Date(sc.created_at).toISOString(),
      })),
    };

    // Convert to JSON string
    const jsonData: string = JSON.stringify(compiledData, null, 2);

    // In production, upload to storage and get URL
    // For now, we'll just update the download record with status
    // The actual file would be stored in Convex storage or S3
    
    // Update download record status
    const downloads: DataDownload[] = await ctx.runQuery(
      api.queries.dataDownloads.getRecentByUserId,
      {
        userId: args.userId,
        hours: 168, // 7 days
      }
    );
    
    const downloadRecord: DataDownload | undefined = downloads.find(
      (d: DataDownload) => d.download_token === args.downloadToken
    );
    
    if (downloadRecord) {
      // In production, store file and update with URL
      // await ctx.runMutation(api.mutations.dataDownloads.updateStatus, {
      //   downloadId: downloadRecord._id,
      //   status: 'completed',
      //   downloadUrl: fileUrl,
      // });
    }

    return { success: true, dataSize: jsonData.length };
  },
});

