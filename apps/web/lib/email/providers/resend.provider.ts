import { Resend } from 'resend';
import { EmailProvider, EmailPayload, EmailResult } from '../types';

export class ResendProvider implements EmailProvider {
  private client: Resend;

  constructor(private apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple API call to check if the API key is valid
      await this.client.emails.get('dummy-id');
      return true;
    } catch (error) {
      const err = error as any;
      // Return true if we get an expected error (invalid ID)
      // Return false for authentication errors
      return err?.statusCode === 404;
    }
  }

  async send(payload: EmailPayload): Promise<EmailResult> {
    try {
      const result = await this.client.emails.send({
        from: payload.from,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        text: payload.text || payload.html?.replace(/<[^>]*>/g, '') || 'No content provided',
        html: payload.html,
        cc: payload.cc ? (Array.isArray(payload.cc) ? payload.cc : [payload.cc]) : undefined,
        bcc: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc]) : undefined,
        replyTo: payload.replyTo,
        attachments: payload.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          content_type: attachment.contentType,
        })),
      });

      return {
        success: true,
        messageId: result.data?.id,
        provider: 'resend',
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        provider: 'resend',
      };
    }
  }
} 