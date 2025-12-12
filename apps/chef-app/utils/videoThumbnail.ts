import { AVPlaybackStatus, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';

/**
 * Generate a thumbnail from a video file
 * @param videoUri - URI of the video file
 * @param timePosition - Time position in seconds (default: 1 second)
 * @returns URI of the thumbnail image
 */
export async function generateVideoThumbnail(
  videoUri: string,
  timePosition: number = 1
): Promise<string> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: timePosition * 1000, // Convert to milliseconds
      quality: 0.8,
    });
    return uri;
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    throw new Error('Failed to generate video thumbnail');
  }
}

/**
 * Get video metadata (duration, file size, resolution)
 */
export async function getVideoMetadata(videoUri: string): Promise<{
  duration: number;
  fileSize: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = new Video({ source: { uri: videoUri } } as any);
    let resolved = false;

    const cleanup = async () => {
      try {
        await video.unloadAsync();
      } catch {
        // Ignore cleanup errors
      }
    };

    video.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      const anyStatus = status as any;
      if (status.isLoaded && !resolved) {
        resolved = true;
        const fileInfo = FileSystem.getInfoAsync(videoUri).then(info => {
          return {
            duration: status.durationMillis ? status.durationMillis / 1000 : 0,
            fileSize: info.exists && 'size' in info ? info.size : 0,
            width: anyStatus.naturalSize?.width || 1280,
            height: anyStatus.naturalSize?.height || 720,
          };
        });

        fileInfo.then(metadata => {
          cleanup();
          resolve(metadata);
        }).catch(error => {
          cleanup();
          // Return default values if file info fails
          resolve({
            duration: status.durationMillis ? status.durationMillis / 1000 : 0,
            fileSize: 0,
            width: anyStatus.naturalSize?.width || 1280,
            height: anyStatus.naturalSize?.height || 720,
          });
        });
      }
    });

    video.loadAsync({ uri: videoUri }).catch((error) => {
      cleanup();
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('Timeout loading video metadata'));
      }
    }, 10000);
  });
}

