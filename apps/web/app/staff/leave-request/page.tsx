"use client";
import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RequestHistory } from '@/components/ui/request-history';
import { ArrowLeft, Calendar, Info, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Id } from '@/convex/_generated/dataModel';
import { AnimatePresence, motion } from 'motion/react';

const leaveTypes = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'bereavement', label: 'Bereavement Leave' },
  { value: 'other', label: 'Other' },
];

const steps = [
  { id: 1, label: 'Type & Dates', icon: Calendar },
  { id: 2, label: 'Details', icon: Info },
  { id: 3, label: 'Review', icon: CheckCircle },
];

export default function LeaveRequestPage() {
  const [form, setForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    totalDays: 1,
    reason: '',
    emergencyContact: '',
    isHalfDay: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [staffEmail, setStaffEmail] = useState<string | null | undefined>(undefined);
  const [step, setStep] = useState(1);
  const endDateRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStaffEmail(localStorage.getItem('staffEmail'));
    }
  }, []);
  const profile = useQuery(api.queries.users.getUserByEmail, staffEmail ? { email: staffEmail } : 'skip');
  const userId = profile?._id as Id<'users'> | undefined;
  const createRequest = useMutation(api.mutations.staff.createLeaveRequest);
  const requests = useQuery(api.queries.staff.getLeaveRequestsByUser, userId ? { userId } : 'skip');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let checked: boolean | undefined = undefined;
    if (type === 'checkbox') {
      checked = (e.target as HTMLInputElement).checked;
    }
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    if (newForm.startDate && newForm.endDate) {
      const start = new Date(newForm.startDate);
      const end = new Date(newForm.endDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      newForm.totalDays = diff > 0 ? diff : 1;
    }
    setForm(newForm);
    setError('');
    // Auto-focus end date after picking start date
    if (name === 'startDate' && endDateRef.current) {
      endDateRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason) {
      setError('All required fields must be filled.');
      return;
    }
    if (!userId) {
      setError('User not found. Please log in again.');
      return;
    }
    try {
      await createRequest({
        userId: userId as Id<'users'>,
        leaveType: form.leaveType as 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other',
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays: form.totalDays,
        reason: form.reason,
        emergencyContact: form.emergencyContact,
        isHalfDay: form.isHalfDay,
      });
      setSuccess(true);
      setForm({ ...form, leaveType: '', startDate: '', endDate: '', totalDays: 1, reason: '', emergencyContact: '', isHalfDay: false });
      setStep(1);
    } catch (err) {
      setError('Failed to submit request.');
    }
  };

  // Progress bar
  const Progress = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex flex-col items-center flex-1">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${step >= s.id ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}> 
            <s.icon className="w-5 h-5" />
          </div>
          <span className={`mt-1 text-xs font-satoshi ${step === s.id ? 'text-amber-700 font-bold' : 'text-gray-500'}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  if (staffEmail === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Loading...</div>
      </div>
    );
  }
  if (staffEmail === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Back Button */}
        <div className="w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-700 font-satoshi mb-6">You need to be signed in to request leave.</p>
            <div className="space-y-3">
              <Link href="/staff/login">
                <button className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-satoshi font-medium transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/staff/portal">
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-satoshi font-medium hover:bg-gray-50 transition-colors">
                  Return to Portal
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Back Button */}
        <div className="w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Loading Profile</h2>
            <p className="text-gray-700 font-satoshi">Please wait while we retrieve your profile information...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (profile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Back Button */}
        <div className="w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-700 font-satoshi mb-6">We couldn't find your profile information. This might be due to a system error or your account may need to be set up.</p>
            <div className="space-y-3">
              <Link href="/staff/portal">
                <button className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-satoshi font-medium transition-colors">
                  Return to Portal
                </button>
              </Link>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-satoshi font-medium hover:bg-gray-50 transition-colors">
                Contact HR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/staff/portal" className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-asgard text-gray-900">Request Leave</h1>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <GlassCard className="p-4 sm:p-8">
          <Progress />
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 sm:space-y-6"
                onSubmit={e => { e.preventDefault(); setStep(2); }}
              >
                <div>
                  <label htmlFor="leaveType" className="block text-sm font-satoshi text-gray-700 mb-1">Leave Type</label>
                  <select
                    id="leaveType"
                    name="leaveType"
                    value={form.leaveType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-400 font-satoshi bg-white/80 text-sm sm:text-base"
                    required
                  >
                    <option value="">Select leave type</option>
                    {leaveTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-satoshi text-gray-700 mb-1">Start Date</label>
                    <div className="relative group">
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={form.startDate}
                        onChange={handleDateChange}
                        className={`w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg border font-satoshi bg-white/80 text-sm sm:text-base appearance-none pr-10 focus:ring-2 focus:ring-amber-400 ${form.startDate && form.endDate && form.endDate < form.startDate ? 'border-red-400' : 'border-amber-200'}`}
                        required
                        aria-describedby="startDateHelp"
                        onClick={e => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 pointer-events-none" />
                    </div>
                    <div id="startDateHelp" className="text-xs text-gray-400 mt-1">Tap to select start date</div>
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-satoshi text-gray-700 mb-1">End Date</label>
                    <div className="relative group">
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={form.endDate}
                        onChange={handleDateChange}
                        className={`w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg border font-satoshi bg-white/80 text-sm sm:text-base appearance-none pr-10 focus:ring-2 focus:ring-amber-400 ${form.startDate && form.endDate && form.endDate < form.startDate ? 'border-red-400' : 'border-amber-200'}`}
                        required
                        aria-describedby="endDateHelp"
                        min={form.startDate || undefined}
                        ref={endDateRef}
                        onClick={e => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 pointer-events-none" />
                    </div>
                    <div id="endDateHelp" className="text-xs text-gray-400 mt-1">Tap to select end date</div>
                    {form.startDate && form.endDate && form.endDate < form.startDate && (
                      <div className="text-xs text-red-500 mt-1">End date cannot be before start date.</div>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="totalDays" className="block text-sm font-satoshi text-gray-700 mb-1">Total Days</label>
                  <input
                    id="totalDays"
                    name="totalDays"
                    type="number"
                    value={form.totalDays}
                    readOnly
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-amber-200 font-satoshi bg-gray-100 cursor-not-allowed text-sm sm:text-base"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-amber-600 text-white font-asgard text-base shadow hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    Next
                  </button>
                </div>
              </motion.form>
            )}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 sm:space-y-6"
                onSubmit={e => { e.preventDefault(); setStep(3); }}
              >
                <div>
                  <label htmlFor="reason" className="block text-sm font-satoshi text-gray-700 mb-1">Reason</label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-400 font-satoshi bg-white/80 text-sm sm:text-base"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-satoshi text-gray-700 mb-1">Emergency Contact <span className="text-xs text-gray-400">(optional)</span></label>
                  <input
                    id="emergencyContact"
                    name="emergencyContact"
                    type="text"
                    value={form.emergencyContact}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-400 font-satoshi bg-white/80 text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="isHalfDay"
                    name="isHalfDay"
                    type="checkbox"
                    checked={form.isHalfDay}
                    onChange={handleChange}
                    className="mr-2 rounded border-amber-200 focus:ring-amber-400"
                  />
                  <label htmlFor="isHalfDay" className="text-sm font-satoshi text-gray-700">Half-day leave</label>
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-satoshi text-base hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-amber-600 text-white font-asgard text-base shadow hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    Next
                  </button>
                </div>
              </motion.form>
            )}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-6"
              >
                <div className="bg-amber-50 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <span className="font-satoshi text-sm text-gray-800">{leaveTypes.find(t => t.value === form.leaveType)?.label || ', '}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-amber-400" />
                    <span className="font-satoshi text-sm text-gray-800">{form.startDate} â†’ {form.endDate} ({form.totalDays} days)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-amber-400" />
                    <span className="font-satoshi text-sm text-gray-800">Reason: {form.reason}</span>
                  </div>
                  {form.emergencyContact && (
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-amber-400" />
                      <span className="font-satoshi text-sm text-gray-800">Emergency: {form.emergencyContact}</span>
                    </div>
                  )}
                  {form.isHalfDay && (
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-amber-400" />
                      <span className="font-satoshi text-sm text-gray-800">Half-day leave</span>
                    </div>
                  )}
                </div>
                {error && <div className="text-red-600 font-satoshi text-sm">{error}</div>}
                {success && <div className="text-green-600 font-satoshi text-sm">Request submitted successfully!</div>}
                <div className="flex justify-between sticky bottom-0 bg-white/80 py-3 rounded-b-lg z-10">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-satoshi text-base hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-amber-600 text-white font-asgard text-base shadow hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    Submit Request
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </GlassCard>
        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg font-asgard text-gray-900 mb-2">Your Previous Leave Requests</h2>
          <div className="rounded-lg border border-amber-100 bg-white/70 overflow-x-auto">
            <RequestHistory type="leave" requests={requests || []} />
          </div>
        </div>
      </div>
    </div>
  );
} 
