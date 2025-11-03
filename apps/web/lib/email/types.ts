export interface EmailPayload {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<EmailResult>;
  isAvailable(): Promise<boolean>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  provider: string;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface QueuedEmail {
  id: string;
  payload: EmailPayload;
  attempts: number;
  nextAttempt: Date;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
} 