import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function addToBroadcastList({ email, firstName, lastName }: { email: string, firstName?: string, lastName?: string }) {
  if (!email) return;
  try {
    await resend.contacts.create({
      email,
      firstName,
      lastName,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID || '93c15e49-f327-478e-8fc7-b7846fd19a23',
    });
  } catch (e) {
    console.error('Failed to add to Resend broadcast list:', e);
  }
}
