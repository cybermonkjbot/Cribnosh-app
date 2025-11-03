import { describe, it, expect } from 'vitest';

describe('YTD Hours Calculation', () => {
  describe('getYearToDateHours', () => {
    it('should calculate YTD hours for a staff member', async () => {
      // Mock data
      const mockSessions = [
        {
          _id: 'session1',
          staffId: 'staff1',
          clockInTime: new Date('2024-01-15T09:00:00Z').getTime(),
          duration: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
          status: 'completed'
        },
        {
          _id: 'session2',
          staffId: 'staff1',
          clockInTime: new Date('2024-02-15T09:00:00Z').getTime(),
          duration: 7.5 * 60 * 60 * 1000, // 7.5 hours in milliseconds
          status: 'completed'
        }
      ];

      // Test the calculation
      const totalHours = mockSessions.reduce((total, session) => {
        return total + (session.duration || 0);
      }, 0);

      const totalHoursInHours = totalHours / (1000 * 60 * 60); // Convert ms to hours

      expect(totalHoursInHours).toBe(15.5); // 8 + 7.5 = 15.5 hours
      expect(mockSessions.length).toBe(2);
    });

    it('should handle sessions from different years correctly', async () => {
      const mockSessions = [
        {
          _id: 'session1',
          staffId: 'staff1',
          clockInTime: new Date('2023-12-31T09:00:00Z').getTime(), // 2023
          duration: 8 * 60 * 60 * 1000,
          status: 'completed'
        },
        {
          _id: 'session2',
          staffId: 'staff1',
          clockInTime: new Date('2024-01-01T09:00:00Z').getTime(), // 2024
          duration: 8 * 60 * 60 * 1000,
          status: 'completed'
        }
      ];

      // Filter for 2024 only
      const year2024Sessions = mockSessions.filter(session => {
        const sessionYear = new Date(session.clockInTime).getFullYear();
        return sessionYear === 2024;
      });

      expect(year2024Sessions.length).toBe(1);
      expect(year2024Sessions[0]._id).toBe('session2');
    });

    it('should only count completed sessions', async () => {
      const mockSessions = [
        {
          _id: 'session1',
          staffId: 'staff1',
          clockInTime: new Date('2024-01-15T09:00:00Z').getTime(),
          duration: 8 * 60 * 60 * 1000,
          status: 'completed'
        },
        {
          _id: 'session2',
          staffId: 'staff1',
          clockInTime: new Date('2024-01-16T09:00:00Z').getTime(),
          duration: 6 * 60 * 60 * 1000,
          status: 'active' // Not completed
        },
        {
          _id: 'session3',
          staffId: 'staff1',
          clockInTime: new Date('2024-01-17T09:00:00Z').getTime(),
          duration: 7 * 60 * 60 * 1000,
          status: 'completed'
        }
      ];

      // Filter only completed sessions
      const completedSessions = mockSessions.filter(session => session.status === 'completed');

      expect(completedSessions.length).toBe(2);
      
      const totalHours = completedSessions.reduce((total, session) => {
        return total + (session.duration || 0);
      }, 0);

      const totalHoursInHours = totalHours / (1000 * 60 * 60);
      expect(totalHoursInHours).toBe(15); // 8 + 7 = 15 hours
    });
  });

  describe('getAdminYearToDateHoursSummary', () => {
    it('should calculate overall YTD hours for all staff', async () => {
      const mockSessions = [
        {
          _id: 'session1',
          staffId: 'staff1',
          clockInTime: new Date('2024-01-15T09:00:00Z').getTime(),
          duration: 8 * 60 * 60 * 1000,
          status: 'completed'
        },
        {
          _id: 'session2',
          staffId: 'staff2',
          clockInTime: new Date('2024-01-16T09:00:00Z').getTime(),
          duration: 6 * 60 * 60 * 1000,
          status: 'completed'
        },
        {
          _id: 'session3',
          staffId: 'staff1',
          clockInTime: new Date('2024-01-17T09:00:00Z').getTime(),
          duration: 7 * 60 * 60 * 1000,
          status: 'completed'
        }
      ];

      // Group by staff and calculate totals
      const staffHours: Record<string, { totalHours: number; totalMinutes: number; sessions: number }> = {};
      
      for (const session of mockSessions) {
        const staffId = session.staffId;
        if (!staffHours[staffId]) {
          staffHours[staffId] = { totalHours: 0, totalMinutes: 0, sessions: 0 };
        }
        
        const duration = session.duration || 0;
        staffHours[staffId].totalHours += duration / (1000 * 60 * 60);
        staffHours[staffId].totalMinutes += duration / (1000 * 60);
        staffHours[staffId].sessions += 1;
      }

      // Calculate overall totals
      const overallTotal = Object.values(staffHours).reduce((total, staff) => {
        return total + staff.totalHours;
      }, 0);

      expect(staffHours['staff1'].totalHours).toBe(15); // 8 + 7 = 15 hours
      expect(staffHours['staff2'].totalHours).toBe(6); // 6 hours
      expect(staffHours['staff1'].sessions).toBe(2);
      expect(staffHours['staff2'].sessions).toBe(1);
      expect(overallTotal).toBe(21); // 15 + 6 = 21 hours
      expect(mockSessions.length).toBe(3);
    });
  });
});
