import { FC } from 'react';

type WorkEmailRequest = {
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
};

type LeaveRequest = {
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
};

type RequestHistoryProps = {
  type: 'workEmail' | 'leave';
  requests: (WorkEmailRequest | LeaveRequest)[];
};

declare const RequestHistory: FC<RequestHistoryProps>;
export { RequestHistory }; 