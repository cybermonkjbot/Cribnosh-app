import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { logger } from '@/lib/utils/logger';

export async function sendAccountDeletionEmail(email: string, deletionDate: string) {
  try {
    const httpClient = getConvexClient();
    await httpClient.action(api.actions.resend.sendTemplateEmail, {
      emailType: 'account_deletion',
      to: email,
      variables: {
        deletionDate,
        userName: 'Customer', // Simplified for now
      },
    });
  } catch (error) {
    logger.error('Failed to send account deletion email:', error);
  }
}

export async function sendDataDownloadEmail(email: string, downloadUrl: string, expiresAt: string) {
  try {
    const httpClient = getConvexClient();
    await httpClient.action(api.actions.resend.sendTemplateEmail, {
      emailType: 'data_download',
      to: email,
      variables: {
        downloadUrl,
        expiresAt,
        userName: 'Customer',
      },
    });
  } catch (error) {
    logger.error('Failed to send data download email:', error);
  }
}

export async function sendFamilyInvitationEmail(
  email: string,
  inviterName: string,
  familyProfileId: string,
  invitationToken?: string
) {
  try {
    const acceptUrl = invitationToken
      ? `https://cribnosh.com/family/accept?token=${invitationToken}`
      : `https://cribnosh.com/family/accept?profile=${familyProfileId}`;

    const httpClient = getConvexClient();
    await httpClient.action(api.actions.resend.sendTemplateEmail, {
      emailType: 'family_invitation',
      to: email,
      variables: {
        inviterName,
        acceptUrl,
        userName: 'Valued Guest',
      },
    });
  } catch (error) {
    logger.error('Failed to send family invitation email:', error);
  }
}

export async function sendSupportCaseNotification(supportCaseRef: string, customerEmail: string, subject: string) {
  try {
    const httpClient = getConvexClient();
    // Send to support team
    await httpClient.action(api.actions.resend.sendTemplateEmail, {
      emailType: 'support_case',
      to: 'support@cribnosh.com',
      variables: {
        supportCaseRef,
        subject,
        userName: 'Support Team',
      },
    });

    // Send confirmation to customer
    await httpClient.action(api.actions.resend.sendTemplateEmail, {
      emailType: 'support_case',
      to: customerEmail,
      variables: {
        supportCaseRef,
        subject,
        userName: 'Valued Customer',
      },
    });
  } catch (error) {
    logger.error('Failed to send support case notifications:', error);
  }
}

export async function sendReviewNotification(chefEmail: string, customerName: string, rating: number, review?: string) {
  try {
    const reviewText = review ? review : 'No written review provided';
    const httpClient = getConvexClient();
    await httpClient.action(api.actions.resend.sendTemplateEmail, {
      emailType: 'review_received',
      to: chefEmail,
      variables: {
        customerName,
        rating: rating.toString(),
        reviewText,
        userName: 'Chef',
      },
    });
  } catch (error) {
    logger.error('Failed to send review notification:', error);
  }
}

