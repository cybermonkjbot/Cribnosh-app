export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: string;
  category: string;
  actionUrl?: string;
  metadata?: any;
}

