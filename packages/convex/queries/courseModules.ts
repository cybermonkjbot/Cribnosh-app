import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../utils/auth';

/**
 * Get module content for a course
 */
export const getModuleContent = query({
  args: {
    courseId: v.string(),
    moduleId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    await requireAuth(ctx, args.sessionToken);
    
    // Get module content from courseModules table
    const module = await ctx.db
      .query('courseModules')
      .withIndex('by_course_module', q => 
        q.eq('courseId', args.courseId).eq('moduleId', args.moduleId)
      )
      .first();
    
    if (!module) {
      // Return null if module doesn't exist
      return null;
    }
    
    // Enrich videos with storage URLs if they have storage IDs
    const enrichedVideos = await Promise.all(
      (module.videos || []).map(async (video) => {
        let videoUrl = video.videoUrl;
        
        // If video has storage ID, get URL from storage
        if (video.videoStorageId) {
          try {
            const storageUrl = await ctx.storage.getUrl(video.videoStorageId);
            if (storageUrl) {
              videoUrl = storageUrl;
            }
          } catch (error) {
            console.error(`Error getting video URL for ${video.id}:`, error);
          }
        }
        
        return {
          ...video,
          videoUrl,
        };
      })
    );
    
    return {
      moduleId: module.moduleId,
      moduleName: module.moduleName,
      moduleNumber: module.moduleNumber,
      description: module.description,
      estimatedTime: module.estimatedTime,
      content: module.content,
      videos: enrichedVideos,
      quiz: module.quiz,
      prerequisites: module.prerequisites,
      status: module.status,
    };
  },
});

/**
 * Get all modules for a course
 */
export const getModulesByCourse = query({
  args: {
    courseId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    await requireAuth(ctx, args.sessionToken);
    
    // Get all modules for the course, sorted by module number
    const modules = await ctx.db
      .query('courseModules')
      .withIndex('by_course', q => q.eq('courseId', args.courseId))
      .filter(q => q.eq(q.field('status'), 'published'))
      .collect();
    
    // Sort by module number
    modules.sort((a, b) => a.moduleNumber - b.moduleNumber);
    
    // Enrich videos with storage URLs
    const enrichedModules = await Promise.all(
      modules.map(async (module) => {
        const enrichedVideos = await Promise.all(
          (module.videos || []).map(async (video) => {
            let videoUrl = video.videoUrl;
            
            if (video.videoStorageId) {
              try {
                const storageUrl = await ctx.storage.getUrl(video.videoStorageId);
                if (storageUrl) {
                  videoUrl = storageUrl;
                }
              } catch (error) {
                console.error(`Error getting video URL:`, error);
              }
            }
            
            return {
              ...video,
              videoUrl,
            };
          })
        );
        
        return {
          ...module,
          videos: enrichedVideos,
        };
      })
    );
    
    return enrichedModules;
  },
});

