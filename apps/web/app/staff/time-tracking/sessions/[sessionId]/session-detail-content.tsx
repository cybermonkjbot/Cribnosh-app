'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, CheckCircle2, Clock3, Clock12 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SessionDetailContentProps {
  session: {
    id: string;
    status: 'active' | 'completed';
    clockInTime: number;
    clockOutTime?: number;
    duration?: number;
    location?: {
      address?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    notes?: string;
  };
}

export default function SessionDetailContent({ session }: SessionDetailContentProps) {
  const router = useRouter();

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const formatDuration = (ms: number) => {
    if (!ms) return 'In Progress';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sessions
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {formatDate(session.clockInTime)}
              </h2>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1.5" />
                {formatTime(session.clockInTime)} - {session.clockOutTime ? formatTime(session.clockOutTime) : 'In Progress'}
              </div>
            </div>
            <Badge 
              variant={session.status === 'completed' ? 'default' : 'outline'}
              className={session.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
            >
              {session.status === 'completed' ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Time Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                  <Clock12 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Clock In</p>
                  <p className="text-sm font-medium">{formatTime(session.clockInTime)}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                  {session.clockOutTime ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock3 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Clock Out</p>
                  <p className="text-sm font-medium">
                    {session.clockOutTime ? formatTime(session.clockOutTime) : 'Still clocked in'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Time</p>
                  <p className="text-sm font-medium">
                    {formatDuration(session.duration || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          {session.location && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                Location
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900">
                  {session.location.address || 'No address available'}
                </p>
                {session.location.coordinates && (
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {session.location.coordinates.latitude.toFixed(4)}, {session.location.coordinates.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Session Notes */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Notes</h3>
            <div className="bg-gray-50 p-4 rounded-lg min-h-24">
              {session.notes ? (
                <p className="text-sm text-gray-700 whitespace-pre-line">{session.notes}</p>
              ) : (
                <p className="text-sm text-gray-500 italic">No notes for this session</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
