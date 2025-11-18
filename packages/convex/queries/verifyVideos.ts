import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Verify that published videos have valid video content in storage
 */
export const verifyPublishedVideos = query({
  args: {},
  returns: v.object({
    totalVideos: v.number(),
    videosWithContent: v.number(),
    videosWithoutContent: v.number(),
    results: v.array(v.object({
      id: v.id("videoPosts"),
      title: v.string(),
      videoStorageId: v.id("_storage"),
      hasValidVideo: v.boolean(),
      hasValidThumbnail: v.boolean(),
      videoUrl: v.union(v.string(), v.null()),
      thumbnailUrl: v.union(v.string(), v.null()),
      status: v.string(),
      error: v.optional(v.string()),
    })),
  }),
  handler: async (ctx) => {
    // Get all published videos
    const videos = await ctx.db
      .query("videoPosts")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
    
    const results = await Promise.all(
      videos.map(async (video) => {
        try {
          // Try to get the video URL from storage
          const videoUrl = await ctx.storage.getUrl(video.videoStorageId);
          const thumbnailUrl = video.thumbnailStorageId 
            ? await ctx.storage.getUrl(video.thumbnailStorageId)
            : null;
          
          // Check if URL is valid (not null/undefined)
          const hasValidVideo = !!videoUrl;
          const hasValidThumbnail = !!thumbnailUrl;
          
          return {
            id: video._id,
            title: video.title,
            videoStorageId: video.videoStorageId,
            hasValidVideo,
            hasValidThumbnail,
            videoUrl: videoUrl || null,
            thumbnailUrl: thumbnailUrl || null,
            status: video.status,
          };
        } catch (error: any) {
          return {
            id: video._id,
            title: video.title,
            videoStorageId: video.videoStorageId,
            hasValidVideo: false,
            hasValidThumbnail: false,
            videoUrl: null,
            thumbnailUrl: null,
            status: video.status,
            error: error.message || "Unknown error",
          };
        }
      })
    );
    
    const videosWithContent = results.filter((r) => r.hasValidVideo).length;
    const videosWithoutContent = results.filter((r) => !r.hasValidVideo).length;
    
    return {
      totalVideos: results.length,
      videosWithContent,
      videosWithoutContent,
      results: results,
    };
  },
});

