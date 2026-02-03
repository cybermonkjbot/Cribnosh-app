import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';
import SessionDetailContent from './session-detail-content';


interface PageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  // Get the session ID from the URL
  const resolvedParams = await params;
  const sessionId = resolvedParams?.sessionId;

  if (!sessionId || typeof sessionId !== 'string') {
    notFound();
  }

  let workSession;

  try {
    // Fetch the work session data using the Convex client
    workSession = await fetchQuery(api.queries.workSessions.getWorkSessionById, {
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    notFound();
  }

  if (!workSession) {
    notFound();
  }

  // Transform the data for the client component
  const sessionData = {
    id: workSession._id,
    status: (workSession.status === 'active' || workSession.status === 'completed') ? workSession.status : 'active',
    clockInTime: workSession.clockInTime,
    clockOutTime: workSession.clockOutTime,
    duration: workSession.duration,
    location: workSession.location ? {
      address: workSession.location,
      coordinates: undefined
    } : undefined,
    notes: workSession.notes,
  };

  return <SessionDetailContent session={sessionData} />;
}
