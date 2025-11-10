import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { sendDataDownloadEmail } from './email-service';

import { Id } from '@/convex/_generated/dataModel';

export async function compileUserData(userId: Id<'users'>, sessionToken?: string | null): Promise<{
  user: unknown;
  orders: unknown[];
  paymentMethods: unknown[];
  preferences: unknown;
  allergies: unknown[];
  reviews: unknown[];
  supportCases: unknown[];
}> {
  const convex = getConvexClient();

  // Fetch all user data
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const user = await convex.query(api.queries.users.getById, { 
    userId,
    sessionToken: sessionToken || undefined
  });
  const userIdString = user?._id || userId as unknown as string;
  
  const [orders, paymentMethods, preferences, allergies, reviews, supportCases] = await Promise.all([
    convex.query(api.queries.orders.listByCustomer, { customer_id: userIdString }),
    convex.query(api.queries.paymentMethods.getByUserId, { userId }),
    convex.query(api.queries.dietaryPreferences.getByUserId, { userId }),
    convex.query(api.queries.allergies.getByUserId, { userId }),
    convex.query(api.queries.reviews.getAll, {}).then((reviews: unknown[]) => {
      const typedReviews = reviews as Array<{ user_id?: Id<'users'> }>;
      return typedReviews.filter((r) => r.user_id === userId);
    }),
    convex.query(api.queries.supportCases.getByUserId, { userId }),
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

export async function generateDataDownload(userId: Id<'users'>, downloadToken: string, expiresAt: number, sessionToken?: string | null) {
  // Compile all user data
  const userData = await compileUserData(userId, sessionToken);

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

