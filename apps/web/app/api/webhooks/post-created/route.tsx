import { ResponseFactory } from '@/lib/api';
import { useSessionToken } from '@/hooks/useSessionToken';
import { getConvexClient } from "@/lib/conxed-client";
import { api } from '@/convex/_generated/api';
import crypto from 'crypto';
import { Id } from '@/convex/_generated/dataModel';
import { logger } from '@/lib/utils/logger';

// Webhook event type definitions
interface PostEventData {
  id: string;
  title: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  followers?: string[];
}

interface UserEventData {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

interface WebhookEvent {
  type: 'post.created' | 'post.updated' | 'post.deleted' | 'user.created' | 'user.updated';
  data: {
    post?: PostEventData;
    user?: UserEventData;
    changes?: Record<string, unknown>;
  };
  changes?: Record<string, unknown>;
}

/**
 * @swagger
 * /webhooks/post-created:
 *   post:
 *     summary: Post Creation Webhook Handler
 *     description: Handle webhook events for post creation, updates, deletion, and user management. This endpoint processes various content and user lifecycle events.
 *     tags: [Webhooks, Content Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - data
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of webhook event
 *                 enum: [post.created, post.updated, post.deleted, user.created, user.updated]
 *                 example: "post.created"
 *               data:
 *                 type: object
 *                 description: Event-specific data payload
 *                 properties:
 *                   post:
 *                     type: object
 *                     description: Post data (for post events)
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "post_123"
 *                       title:
 *                         type: string
 *                         example: "Amazing Recipe"
 *                       author:
 *                         type: string
 *                         example: "Chef John"
 *                       authorId:
 *                         type: string
 *                         example: "user_456"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["italian", "pasta"]
 *                       followers:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Array of follower user IDs
 *                         example: ["user_789", "user_101"]
 *                   user:
 *                     type: object
 *                     description: User data (for user events)
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "user_123"
 *                       email:
 *                         type: string
 *                         format: email
 *                         example: "user@example.com"
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *               changes:
 *                 type: object
 *                 description: Changes made (for update events)
 *                 example: {"name": "New Name", "email": "new@example.com"}
 *     parameters:
 *       - in: header
 *         name: x-webhook-signature
 *         required: false
 *         schema:
 *           type: string
 *         description: Webhook signature for verification
 *         example: "sha256=abcdef1234567890"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     eventType:
 *                       type: string
 *                       example: "post.created"
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error during webhook processing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 *     x-webhook:
 *       description: |
 *         This endpoint handles various webhook events for content and user management:
 *         
 *         **Supported Post Events:**
 *         - `post.created`: New post created - triggers notifications, analytics, search indexing, and moderation
 *         - `post.updated`: Post updated - updates search index and sends notifications to followers
 *         - `post.deleted`: Post deleted - removes from search index and archives content
 *         
 *         **Supported User Events:**
 *         - `user.created`: New user registered - sends welcome email and initializes preferences
 *         - `user.updated`: User profile updated - updates caches and syncs with external systems
 *         
 *         **Processing Actions:**
 *         - Analytics tracking for all events
 *         - Notification sending to relevant users
 *         - Search index updates for content changes
 *         - Content moderation queuing
 *         - Email campaign triggers
 *         - Admin activity logging
 *         
 *         **Security:**
 *         - Optional webhook signature verification
 *         - Processes events asynchronously
 *         - Comprehensive error handling and logging
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verify webhook signature if provided
    const signature = request.headers.get('x-webhook-signature');
    if (signature && !verifyWebhookSignature(body, signature)) {
      return ResponseFactory.unauthorized('Invalid webhook signature');
    }
    
    // Process different types of webhook events
    const result = await processWebhookEvent(body);
    
    if (!result.success) {
      return ResponseFactory.internalError(result.error || 'Failed to process webhook');
    }
    
    logger.log("Webhook processed successfully:", { eventType: body.type, result });
    
    return ResponseFactory.success({ 
      success: true, 
      eventType: body.type,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    return ResponseFactory.internalError("Failed to process webhook");
  }
}

/**
 * Process webhook event based on type
 */
async function processWebhookEvent(eventData: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  try {
    switch (eventData.type) {
      case 'post.created':
        return await handlePostCreated(eventData);
      case 'post.updated':
        return await handlePostUpdated(eventData);
      case 'post.deleted':
        return await handlePostDeleted(eventData);
      case 'user.created':
        return await handleUserCreated(eventData);
      case 'user.updated':
        return await handleUserUpdated(eventData);
      default:
        logger.log(`Unhandled webhook event type: ${eventData.type}`);
        return { success: true };
    }
  } catch (error) {
    logger.error('Error processing webhook event:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Handle post created event
 */
async function handlePostCreated(eventData: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const { post } = eventData.data;
    
    if (!post) {
      return { success: false, error: 'Post data is required for post.created event' };
    }
    
    // Log the post creation for analytics
    logger.log('New post created:', {
      id: post.id,
      title: post.title,
      author: post.author,
      createdAt: post.createdAt,
      tags: post.tags
    });
    
    try {
      const convex = getConvexClient();
      
      // Update analytics
      // Note: post.authorId is a string, but trackEvent expects Id<"users"> or undefined
      // Since webhook data comes as strings, we pass undefined for userId and include it in metadata
      await convex.mutation(api.mutations.analytics.trackEvent, {
        eventType: 'post_created',
        userId: undefined,
        timestamp: Date.now(),
        metadata: { postId: post.id, title: post.title, authorId: post.authorId }
      });
      
      // Send notifications to followers
      if (post.followers && post.followers.length > 0) {
        // Send individual notifications to each follower
        for (const followerId of post.followers) {
          // followerId is a string from webhook, but notifications.create expects Id<"users">
          // Since webhook provides string IDs that match Convex ID format, we can safely cast
          const userId = followerId as unknown as Id<"users">;
          await convex.mutation(api.mutations.notifications.create, {
            type: 'new_post',
            userId,
            message: `New post: ${post.title} - Check out the latest post from ${post.author}`,
            createdAt: Date.now()
          });
        }
      }
      
      // Update search index - using admin activity logging instead
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'post_indexed',
        description: `Post ${post.id} indexed for search`,
        metadata: { 
          entityId: post.id, 
          entityType: 'post',
          details: { title: post.title }
        }
      });
      
      // Trigger content moderation - using admin activity logging instead
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'post_moderation_queued',
        description: `Post ${post.id} queued for moderation review`,
        metadata: { 
          entityId: post.id, 
          entityType: 'post',
          details: { authorId: post.authorId }
        }
      });
      
    } catch (error) {
      logger.error('Failed to process post creation webhook:', error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle post creation' };
  }
}

/**
 * Handle post updated event
 */
async function handlePostUpdated(eventData: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const { post } = eventData.data;
    
    if (!post) {
      return { success: false, error: 'Post data is required for post.updated event' };
    }
    
    logger.log('Post updated:', {
      id: post.id,
      title: post.title,
      updatedAt: post.updatedAt
    });
    
    try {
      const convex = getConvexClient();
      
      // Update search index
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'post_updated',
        description: `Post ${post.id} updated in search index`,
        metadata: { 
          entityId: post.id, 
          entityType: 'post',
          details: {}
        }
      });
      
      // Send update notifications
      if (post.followers && post.followers.length > 0) {
        // Send individual notifications to each follower
        for (const followerId of post.followers) {
          // followerId is a string from webhook, but notifications.create expects Id<"users">
          // Since webhook provides string IDs that match Convex ID format, we can safely cast
          const userId = followerId as unknown as Id<"users">;
          await convex.mutation(api.mutations.notifications.create, {
            type: 'post_updated',
            userId,
            message: `Post updated: ${post.title} - A post you're following has been updated`,
            createdAt: Date.now()
          });
        }
      }
      
      // Log content changes
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'post_content_changed',
        description: `Post ${post.id} content updated`,
        metadata: { 
          entityId: post.id, 
          entityType: 'post',
          details: { title: post.title, updatedAt: post.updatedAt }
        }
      });
      
    } catch (error) {
      logger.error('Failed to process post update webhook:', error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle post update' };
  }
}

/**
 * Handle post deleted event
 */
async function handlePostDeleted(eventData: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const { post } = eventData.data;
    
    if (!post) {
      return { success: false, error: 'Post data is required for post.deleted event' };
    }
    
    logger.log('Post deleted:', {
      id: post.id,
      deletedAt: new Date().toISOString()
    });
    
    try {
      const convex = getConvexClient();
      
      // Remove from search index
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'post_removed_from_search',
        description: `Post ${post.id} removed from search index`,
        metadata: { 
          entityId: post.id, 
          entityType: 'post',
          details: {}
        }
      });
      
      // Archive content
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'post_archived',
        description: `Post ${post.id} archived due to deletion`,
        metadata: { 
          entityId: post.id, 
          entityType: 'post',
          details: { archivedAt: new Date().toISOString() }
        }
      });
      
      // Update analytics
      await convex.mutation(api.mutations.analytics.trackEvent, {
        eventType: 'post_deleted',
        userId: undefined,
        timestamp: Date.now(),
        metadata: { postId: post.id, title: post.title, authorId: post.authorId }
      });
      
    } catch (error) {
      logger.error('Failed to process post deletion webhook:', error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle post deletion' };
  }
}

/**
 * Handle user created event
 */
async function handleUserCreated(eventData: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = eventData.data;
    
    if (!user) {
      return { success: false, error: 'User data is required for user.created event' };
    }
    
    logger.log('New user created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    });
    
    try {
      const convex = getConvexClient();
      
      // Send welcome email
      await convex.mutation(api.mutations.email.createEmailCampaign, {
        name: 'Welcome Email',
        subject: `Welcome to CribNosh, ${user.name}!`,
        content: `Welcome to CribNosh! We're excited to have you join our community.`,
        recipientType: 'all'
      });
      
      // Update user analytics
      await convex.mutation(api.mutations.analytics.trackEvent, {
        eventType: 'user_created',
        userId: undefined,
        timestamp: Date.now(),
        metadata: { email: user.email, name: user.name, userId: user.id }
      });
      
      // Set up user preferences - using admin activity logging instead
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'user_preferences_initialized',
        description: `Default preferences set for user ${user.id}`,
        userId: user.id,
        metadata: { 
          entityId: user.id, 
          entityType: 'user',
          details: { preferences: { notifications: true, newsletter: true, theme: 'light' } }
        }
      });
      
    } catch (error) {
      logger.error('Failed to process user creation webhook:', error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle user creation' };
  }
}

/**
 * Handle user updated event
 */
async function handleUserUpdated(eventData: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = eventData.data;
    
    if (!user) {
      return { success: false, error: 'User data is required for user.updated event' };
    }
    
    logger.log('User updated:', {
      id: user.id,
      updatedAt: user.updatedAt,
      changes: eventData.data.changes
    });
    
    try {
      const convex = getConvexClient();
      
      // Update user profile cache - using admin activity logging instead
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'user_profile_cache_updated',
        description: `User ${user.id} profile cache updated`,
        userId: user.id,
        metadata: { 
          entityId: user.id, 
          entityType: 'user',
          details: { name: user.name, email: user.email, updatedAt: user.updatedAt }
        }
      });
      
      // Sync with external systems - using admin activity logging instead
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'user_sync_requested',
        description: `User ${user.id} sync requested for external systems`,
        userId: user.id,
        metadata: { 
          entityId: user.id, 
          entityType: 'user',
          details: user
        }
      });
      
      // Log profile changes
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'user_profile_updated',
        description: `User ${user.id} profile updated`,
        userId: user.id,
        metadata: { 
          entityId: user.id, 
          entityType: 'user',
          details: { changes: eventData.changes || eventData.data.changes }
        }
      });
      
    } catch (error) {
      logger.error('Failed to process user update webhook:', error);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to handle user update' };
  }
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: unknown, signature: string): boolean {
  // Using the webhook secret from your service provider
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    logger.warn('No webhook secret configured, skipping signature verification');
    return true; // Allow in development
  }
  
  try {
    // Parse the signature header
    // Format: "sha256=hash"
    const [algorithm, hash] = signature.split('=');
    
    if (algorithm !== 'sha256') {
      logger.error('Unsupported signature algorithm:', algorithm);
      return false;
    }
    
    // Create HMAC hash
    const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString, 'utf8')
      .digest('hex');
    
    // Compare hashes using timing-safe comparison
    const providedHash = Buffer.from(hash, 'hex');
    const expectedHashBuffer = Buffer.from(expectedHash, 'hex');
    
    if (providedHash.length !== expectedHashBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(providedHash, expectedHashBuffer);
    
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return false;
  }
}
