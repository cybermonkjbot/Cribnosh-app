import React from 'react';
import { RequestStatus } from './request-status';

interface WorkEmailRequest {
  _id: string;
  requestedEmail: string;
  reason: string;
  department: string;
  position: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewNotes?: string;
  approvedEmail?: string;
}

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewNotes?: string;
  emergencyContact?: string;
  isHalfDay?: boolean;
}

type RequestHistoryProps = {
  type: 'workEmail' | 'leave';
  requests: (WorkEmailRequest | LeaveRequest)[];
};

export const RequestHistory: React.FC<RequestHistoryProps> = ({ type, requests }) => {
  if (!requests || requests.length === 0) {
    return <div className="text-gray-600 font-satoshi text-sm py-4">No previous requests found.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-amber-200 bg-white/80 rounded-lg">
        <thead>
          <tr className="bg-amber-50">
            {type === 'workEmail' ? (
              <>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Requested Email</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Department</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Position</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Submitted</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Status</th>
              </>
            ) : (
              <>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Leave Type</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Start</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">End</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Days</th>
                <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Status</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-amber-100">
          {requests.map((req: any) => (
            <tr key={req._id} className="hover:bg-amber-50 transition-colors">
              {type === 'workEmail' ? (
                <>
                  <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{req.requestedEmail}</td>
                  <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{req.department}</td>
                  <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{req.position}</td>
                  <td className="px-4 py-2 font-satoshi text-xs text-gray-500">{new Date(req.submittedAt).toLocaleString()}</td>
                  <td className="px-4 py-2 font-satoshi text-xs">
                    <RequestStatus status={req.status} reviewedAt={req.reviewedAt} reviewNotes={req.reviewNotes} approvedEmail={req.approvedEmail} type="workEmail" />
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{req.leaveType.charAt(0).toUpperCase() + req.leaveType.slice(1)}</td>
                  <td className="px-4 py-2 font-satoshi text-xs text-gray-500">{req.startDate}</td>
                  <td className="px-4 py-2 font-satoshi text-xs text-gray-500">{req.endDate}</td>
                  <td className="px-4 py-2 font-satoshi text-xs text-gray-900">{req.totalDays}</td>
                  <td className="px-4 py-2 font-satoshi text-xs">
                    <RequestStatus status={req.status} reviewedAt={req.reviewedAt} reviewNotes={req.reviewNotes} type="leave" />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 