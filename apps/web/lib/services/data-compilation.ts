import { api } from '@/convex/_generated/api';
import { getConvexClient, getConvexClientFromRequest } from '@/lib/conxed-client';
import { ConvexHttpClient } from 'convex/browser';
import { NextRequest } from 'next/server';
import { sendDataDownloadEmail } from './email-service';

import { Id } from '@/convex/_generated/dataModel';

export async function compileUserData(
  userId: Id<'users'>, 
  sessionToken?: string | null,
  convexClient?: ConvexHttpClient
): Promise<{
  user: unknown;
  orders: unknown[];
  paymentMethods: unknown[];
  preferences: unknown;
  allergies: unknown[];
  reviews: unknown[];
  supportCases: unknown[];
}> {
  const convex = convexClient || getConvexClient();

  // Fetch all user data
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const user = await convex.query(api.queries.users.getById, { 
    userId,
    sessionToken: sessionToken || undefined
  }).catch(() => null); // Return null on error
  const userIdString = user?._id || userId as unknown as string;
  
  const [orders, paymentMethods, preferences, allergies, reviews, supportCases] = await Promise.all([
    convex.query(api.queries.orders.listByCustomer, { 
      customer_id: userIdString,
      sessionToken: sessionToken || undefined 
    }).catch(() => []), // Return empty array on error
    convex.query(api.queries.paymentMethods.getByUserId, { userId }).catch(() => []),
    convex.query(api.queries.dietaryPreferences.getByUserId, { userId }).catch(() => null),
    convex.query(api.queries.allergies.getByUserId, { userId }).catch(() => []),
    convex.query(api.queries.reviews.getByUserId, { userId }).catch(() => []),
    convex.query(api.queries.supportCases.getByUserId, { userId }).catch(() => []),
  ]);

  return {
    user,
    orders: orders || [],
    paymentMethods: paymentMethods || [],
    preferences,
    allergies: allergies || [],
    reviews: reviews || [],
    supportCases: supportCases || [],
  };
}

export async function generateDataDownload(
  userId: Id<'users'>, 
  downloadToken: string, 
  expiresAt: number, 
  sessionToken?: string | null,
  request?: NextRequest
) {
  // Get Convex client with request context if available
  const convexClient = request ? getConvexClientFromRequest(request) : undefined;
  
  // Compile all user data
  const userData = await compileUserData(userId, sessionToken, convexClient);

  // Convert to JSON
  const jsonData = JSON.stringify(userData, null, 2);

  // In production, this would:
  // 1. Store the file in Convex storage or S3
  // 2. Generate a secure download URL
  // 3. Update the dataDownloads record with the URL
  
  // For now, we'll store the token and update status
  // The actual file generation would happen in a background job
  
  // Get user email
  const user = userData.user as { email?: string } | null | undefined;
  if (user && typeof user === 'object' && 'email' in user && typeof user.email === 'string') {
    const downloadUrl = `https://cribnosh.com/api/customer/account/download-data/${downloadToken}`;
    
    // Send email when ready (this would be async in production)
    await sendDataDownloadEmail(
      user.email,
      downloadUrl,
      new Date(expiresAt).toISOString()
    ).catch(console.error);
  }

  return {
    downloadUrl: `https://cribnosh.com/api/customer/account/download-data/${downloadToken}`,
    status: 'processing',
  };
}

