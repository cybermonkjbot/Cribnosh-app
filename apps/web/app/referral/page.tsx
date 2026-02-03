import { redirect } from 'next/navigation';

export const dynamic = "force-dynamic";

export default function ReferralIndex() {
  redirect('/referral/landing');
  return null;
} 