import nodemailer from 'nodemailer';
import { EmailProvider, EmailPayload, EmailResult } from '../types';
import { logger } from '@/lib/utils/logger';

export class SMTPProvider implements EmailProvider {
  private transporter!: nodemailer.Transporter;
  private isInitialized: boolean = false;

  constructor(
    private config: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    }
  ) {}

  private async initialize() {
    if (this.isInitialized) return;

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
    });

    this.isInitialized = true;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('SMTP provider verification failed:', error);
      return false;
    }
  }

  async send(payload: EmailPayload): Promise<EmailResult> {
    try {
      await this.initialize();

      const result = await this.transporter.sendMail({
        from: payload.from,
        to: Array.isArray(payload.to) ? payload.to.join(',') : payload.to,
        cc: payload.cc ? (Array.isArray(payload.cc) ? payload.cc.join(',') : payload.cc) : undefined,
        bcc: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc.join(',') : payload.bcc) : undefined,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments: payload.attachments,
        replyTo: payload.replyTo,
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        provider: 'smtp',
      };
    }
  }
} 