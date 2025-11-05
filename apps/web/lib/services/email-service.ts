import { EmailService } from '@/lib/email/email.service';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const emailService = new EmailService({
  resend: {
    apiKey: RESEND_API_KEY,
  },
});

export async function sendAccountDeletionEmail(email: string, deletionDate: string) {
  try {
    const html = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: 'Account Deletion Request Received',
      message: `Your account deletion request has been received. Your account will be permanently deleted on ${deletionDate}. If you change your mind, please contact support within 7 days.`,
    });

    await emailService.send({
      to: email,
      subject: 'Account Deletion Request Confirmed',
      html,
      from: 'noreply@cribnosh.com',
    });
  } catch (error) {
    console.error('Failed to send account deletion email:', error);
  }
}

export async function sendDataDownloadEmail(email: string, downloadUrl: string, expiresAt: string) {
  try {
    const html = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: 'Your Data Download is Ready',
      message: `Your data download is ready. Click here to download: ${downloadUrl}. This link expires on ${expiresAt}.`,
    });

    await emailService.send({
      to: email,
      subject: 'Your Data Download is Ready',
      html,
      from: 'noreply@cribnosh.com',
    });
  } catch (error) {
    console.error('Failed to send data download email:', error);
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
    const html = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: 'Family Profile Invitation',
      message: `${inviterName} has invited you to join their family profile on CribNosh. Click here to accept: ${acceptUrl}`,
    });

    await emailService.send({
      to: email,
      subject: 'You\'ve been invited to join a family profile',
      html,
      from: 'noreply@cribnosh.com',
    });
  } catch (error) {
    console.error('Failed to send family invitation email:', error);
  }
}

export async function sendSupportCaseNotification(supportCaseRef: string, customerEmail: string, subject: string) {
  try {
    // Send to support team
    const supportHtml = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: 'New Support Case',
      message: `New support case ${supportCaseRef}: ${subject}`,
    });

    await emailService.send({
      to: 'support@cribnosh.com',
      subject: `New Support Case: ${supportCaseRef}`,
      html: supportHtml,
      from: 'noreply@cribnosh.com',
    });

    // Send confirmation to customer
    const customerHtml = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: 'Support Case Created',
      message: `Your support case ${supportCaseRef} has been created. We'll get back to you soon.`,
    });

    await emailService.send({
      to: customerEmail,
      subject: `Support Case Created: ${supportCaseRef}`,
      html: customerHtml,
      from: 'support@cribnosh.com',
    });
  } catch (error) {
    console.error('Failed to send support case notifications:', error);
  }
}

export async function sendReviewNotification(chefEmail: string, customerName: string, rating: number, review?: string) {
  try {
    const reviewText = review ? `Review: ${review}` : 'No written review provided';
    const html = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: 'New Review Received',
      message: `${customerName} left you a ${rating}-star rating. ${reviewText}`,
    });

    await emailService.send({
      to: chefEmail,
      subject: `New ${rating}-Star Review from ${customerName}`,
      html,
      from: 'noreply@cribnosh.com',
    });
  } catch (error) {
    console.error('Failed to send review notification:', error);
  }
}

