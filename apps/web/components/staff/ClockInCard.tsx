"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { GlassCard } from '@/components/ui/glass-card';

import { Clock, Play, Square, Timer, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Id } from '@/convex/_generated/dataModel';

interface ClockInCardProps {
  staffId: Id<"users">;
  staffName: string;
}

export function ClockInCard({ staffId, staffName }: ClockInCardProps) {
  const [notes, setNotes] = useState('');
  const [endOfDayNotes, setEndOfDayNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shouldShake, setShouldShake] = useState(false);
  const MIN_NOTES_LENGTH = 10; // Minimum 10 characters for notes
  const [showClockInConfirm, setShowClockInConfirm] = useState(false);
  const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);

  const clockIn = useMutation(api.mutations.workSessions.clockIn);
  const clockOut = useMutation(api.mutations.workSessions.clockOut);
  const activeSession = useQuery(api.queries.workSessions.getActiveSession, { 
    staffId 
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleConfirmClockIn = async () => {
    setShowClockInConfirm(false);
    setIsLoading(true);
    try {
      const result = await clockIn({
        staffId,
        notes: notes.trim(),
        location: 'Office', // Could be made configurable
      });

      if (result.status === 'success') {
        setNotes('');
        // Show success message
      } else {
        alert(result.error || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Clock in error:', error);
      alert('Failed to clock in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmClockOut = async () => {
    setShowClockOutConfirm(false);
    setIsLoading(true);
    try {
      const result = await clockOut({
        staffId,
        notes: notes.trim(),
      });

      if (result.status === 'success') {
        setNotes('');
        // Show success message
      } else {
        alert(result.error || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      alert('Failed to clock out');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isClockedIn = !!activeSession;

  const handleClockIn = () => {
    if (notes.trim().length >= MIN_NOTES_LENGTH) {
      setShowClockInConfirm(true);
    } else {
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 500);
  };

  const handleClockOut = () => {
    if (endOfDayNotes.trim().length >= MIN_NOTES_LENGTH) {
      setShowClockOutConfirm(true);
    } else {
      triggerShake();
    }
  };

  return (
    <GlassCard className="p-6 sm:p-8 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-amber-50/30 pointer-events-none" />
      
      {/* Header section with improved layout */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-start justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-asgard text-gray-900 mb-1">Time Tracking</h2>
            <p className="text-xs sm:text-sm text-gray-600 flex items-center space-x-2">
              <span>Welcome back, {staffName}</span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{currentTime.toLocaleDateString()}</span>
              </span>
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right bg-white/40 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-sm border border-white/20 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="text-2xl sm:text-3xl font-mono text-gray-900 mb-1 tracking-wider">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Current Time</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isClockedIn ? (
          <motion.div
            key="clock-in"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 space-y-6"
          >
            <div className="text-center">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Clock className="w-10 h-10 text-gray-600" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Ready to Start Work?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                Click the button below to clock in and start tracking your work hours for today
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">
                  What are you working on today? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Give us a highlight of what you are working on today (minimum ${MIN_NOTES_LENGTH} characters)`}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 backdrop-blur-sm border ${
                    notes.trim() && notes.trim().length < MIN_NOTES_LENGTH 
                      ? 'border-amber-500' 
                      : 'border-white/30'
                  } rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm transition-all duration-200 text-sm sm:text-base`}
                  rows={3}
                />
                {notes.trim() && notes.trim().length < MIN_NOTES_LENGTH && (
                  <p className="text-xs text-amber-600 mt-1">
                    Please enter at least {MIN_NOTES_LENGTH} characters
                  </p>
                )}
              </div>
            </div>

            <motion.button
              onClick={handleClockIn}
              disabled={isLoading || !notes.trim()}
              className={`w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base sm:text-lg ${
                shouldShake && (!notes.trim() || notes.trim().length < MIN_NOTES_LENGTH) ? 'animate-shake' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={shouldShake && (!notes.trim() || notes.trim().length < MIN_NOTES_LENGTH) ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <Play className="w-5 h-5" />
                <span>Clock In</span>
              </div>
            </motion.button>

            {/* Clock In Confirmation Modal */}
            {showClockInConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Clock In</h3>
                  <p className="text-gray-700 mb-6">
                    By clocking in, you acknowledge that your device activity will be monitored during work hours to ensure productive use of company time. This helps maintain work efficiency and security.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowClockInConfirm(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmClockIn}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Clocking In...' : 'Confirm Clock In'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="clock-out"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 space-y-6"
          >
            <div className="text-center">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                animate={{ 
                  boxShadow: ["0 4px 6px -1px rgba(0, 0, 0, 0.1)", "0 10px 15px -3px rgba(0, 0, 0, 0.1)", "0 4px 6px -1px rgba(0, 0, 0, 0.1)"]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Timer className="w-10 h-10 text-green-600" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Currently Working</h3>
              
              {/* Enhanced duration display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-4 border border-green-200/50">
                <div className="text-4xl font-mono text-green-600 mb-2 tracking-wider">
                  {activeSession && formatDuration(activeSession.clockInTime)}
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Started at {activeSession && new Date(activeSession.clockInTime).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">
                  End of Day Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={endOfDayNotes}
                  onChange={(e) => setEndOfDayNotes(e.target.value)}
                  placeholder={`Summarize your work session, accomplishments, or any important notes... (minimum ${MIN_NOTES_LENGTH} characters)`}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/50 backdrop-blur-sm border ${
                    endOfDayNotes.trim() && endOfDayNotes.trim().length < MIN_NOTES_LENGTH 
                      ? 'border-amber-500' 
                      : 'border-white/30'
                  } rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none shadow-sm transition-all duration-200 text-sm sm:text-base`}
                  rows={3}
                />
                {endOfDayNotes.trim() && endOfDayNotes.trim().length < MIN_NOTES_LENGTH && (
                  <p className="text-xs text-amber-600 mt-1">
                    Please enter at least {MIN_NOTES_LENGTH} characters
                  </p>
                )}
              </div>
            </div>

            <motion.button
              onClick={handleClockOut}
              disabled={isLoading || !endOfDayNotes.trim()}
              className={`w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 sm:py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base sm:text-lg ${
                shouldShake && (!endOfDayNotes.trim() || endOfDayNotes.trim().length < MIN_NOTES_LENGTH) ? 'animate-shake' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={shouldShake && (!endOfDayNotes.trim() || endOfDayNotes.trim().length < MIN_NOTES_LENGTH) ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <Square className="w-5 h-5" />
                <span>Clock Out</span>
              </div>
            </motion.button>

            {/* Clock Out Confirmation Modal */}
            {showClockOutConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Clock Out</h3>
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to clock out? This will end your work session and stop ActivityWatch monitoring for this session.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowClockOutConfirm(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmClockOut}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Clocking Out...' : 'Confirm Clock Out'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}