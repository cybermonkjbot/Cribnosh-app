import { CheckCircle, XCircle, Clock } from 'lucide-react';
import React from 'react';

interface RequestStatusProps {
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: number;
  reviewNotes?: string;
  approvedEmail?: string;
  type: 'workEmail' | 'leave';
}

export const RequestStatus: React.FC<RequestStatusProps> = ({ status, reviewedAt, reviewNotes, approvedEmail, type }) => {
  let icon, color, label;
  if (status === 'approved') {
    icon = <CheckCircle className="w-5 h-5 text-green-600" />;
    color = 'bg-green-100 text-green-800';
    label = 'Approved';
  } else if (status === 'rejected') {
    icon = <XCircle className="w-5 h-5 text-red-600" />;
    color = 'bg-red-100 text-red-800';
    label = 'Rejected';
  } else {
    icon = <Clock className="w-5 h-5 text-amber-500" />;
    color = 'bg-amber-100 text-amber-800';
    label = 'Pending';
  }
  return (
    <div className={`flex flex-col gap-1 font-satoshi`}>
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${color}`}
        aria-label={`Request status: ${label}`}
      >
        {icon} {label}
      </span>
      {status !== 'pending' && (
        <span className="text-xs text-gray-500">
          {status === 'approved' && approvedEmail && type === 'workEmail' && (
            <span>Assigned: <span className="font-semibold text-green-700">{approvedEmail}</span></span>
          )}
          {reviewedAt && (
            <span> {status === 'approved' ? 'on' : 'at'} {new Date(reviewedAt).toLocaleString()}</span>
          )}
        </span>
      )}
      {status === 'rejected' && reviewNotes && (
        <span className="text-xs text-red-700">Reason: {reviewNotes}</span>
      )}
    </div>
  );
}; 