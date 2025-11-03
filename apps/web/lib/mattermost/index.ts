export { MattermostService, mattermostService } from './mattermost.service';
export type { 
  MattermostMessage, 
  MattermostAttachment, 
  MattermostField, 
  MattermostPost 
} from './mattermost.service';

// Export utility functions
export {
  notifyUserActivity,
  notifySystemEvent,
  notifyBusinessMetrics,
  notifyLocationActivity,
  isMattermostAvailable,
  getMattermostStatus,
} from './utils'; 