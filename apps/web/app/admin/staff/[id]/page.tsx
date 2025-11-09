'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAdminUser } from '@/app/admin/AdminUserProvider';

type Session = {
  _id: Id<'workSessions'>;
  staffId: Id<'users'>;
  clockInTime: number;
  clockOutTime?: number;
  status: 'active' | 'completed' | 'paused' | 'adjusted';
  notes?: string;
};

function startOfDay(ts: number) { const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function endOfDay(ts: number) { const d = new Date(ts); d.setHours(23,59,59,999); return d.getTime(); }

export default function AdminStaffDetailPage() {
  const params = useParams();
  const { sessionToken } = useAdminUser();
  const staffId = (params?.id as string) as Id<'users'>;
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const monthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const rangeStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getTime();
  const rangeEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

  const sessions = useQuery(
    api.queries.workSessions.listSessionsAdmin,
    sessionToken ? {
      staffId,
      startDate: rangeStart,
      endDate: rangeEnd,
      limit: 1000,
      sessionToken,
    } : "skip"
  );

  const days = useMemo(() => {
    const firstDay = new Date(rangeStart);
    const lastDay = new Date(rangeEnd);
    const result: Array<{ date: number; sessions: Session[] }> = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      result.push({ date: d.getTime(), sessions: [] });
    }
    const byDay = new Map<number, Session[]>();
    for (const s of sessions?.results || []) {
      const dayKey = startOfDay(s.clockInTime);
      if (!byDay.has(dayKey)) byDay.set(dayKey, []);
      byDay.get(dayKey)!.push(s);
    }
    return result.map((d) => ({ ...d, sessions: byDay.get(startOfDay(d.date)) || [] }));
  }, [sessions, rangeStart, rangeEnd]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-asgard">Staff Details</h1>
      <div className="border-b">
        <nav className="flex gap-4 text-sm">
          <a className="px-3 py-2 border-b-2 border-transparent hover:border-gray-300" href="#profile">Profile</a>
          <a className="px-3 py-2 border-b-2 border-transparent hover:border-gray-300" href="#documents">Documents</a>
          <a className="px-3 py-2 border-b-2 border-primary-600 text-primary-700" href="#time">Time Tracking</a>
        </nav>
      </div>

      <section id="time" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-asgard">Active Sessions Calendar</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded" onClick={() => setMonthOffset((m) => m - 1)}>Prev</button>
            <span className="text-sm text-gray-600">{monthDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
            <button className="px-3 py-1 border rounded" onClick={() => setMonthOffset((m) => m + 1)}>Next</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="text-xs text-gray-600 text-center py-1">{d}</div>
          ))}
          {days.map((d, idx) => {
            const date = new Date(d.date);
            return (
              <div key={idx} className="border rounded p-2 min-h-[90px] bg-white">
                <div className="text-xs text-gray-500 mb-1">{date.getDate()}</div>
                <div className="space-y-1">
                  {d.sessions.length === 0 ? (
                    <div className="text-[10px] text-gray-400">—</div>
                  ) : (
                    d.sessions.map((s) => (
                      <div key={s._id} className="text-[10px] px-1 py-0.5 rounded border flex items-center justify-between">
                        <span>{new Date(s.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{s.clockOutTime ? `–${new Date(s.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                        <span className={
                          s.status === 'active' ? 'text-yellow-600' : s.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                        }>{s.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}


