import { Id } from '@/convex/_generated/dataModel';

export interface LiveSession {
  _id: Id<"liveSessions">;
  _creationTime: number;
  channelName: string;
  chefId: Id<"chefs">;
  title: string;
  description: string;
  mealId: Id<"meals">;
  isActive: boolean;
  startedAt: number;
  endedAt?: number;
  endReason?: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  thumbnailUrl?: string;
  tags: string[];
  viewerCount: number;
  peakViewers: number;
  userId?: Id<"users">;
}

