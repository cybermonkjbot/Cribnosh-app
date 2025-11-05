// NOTE: This page is accessible to both staff (role: 'staff') and admin (role: 'admin') users.
// All admins are staff, but not all staff are admins.

'use client';

import Link from 'next/link';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Banknote,
  Shield,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Upload 
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface OnboardingData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Employment Information
  position: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary';
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  // Tax Information
  taxInfo: {
    ssn: string;
    filingStatus: 'single' | 'married' | 'head-of-household';
    allowances: number;
  };
  
  // Banking Information
  bankingInfo: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountType: 'checking' | 'savings';
  };
  
  // Benefits
  benefits: {
    healthInsurance: boolean;
    dentalInsurance: boolean;
    visionInsurance: boolean;
    retirementPlan: boolean;
    lifeInsurance: boolean;
  };
  
  // Documents
  documents: {
    idDocument: File | null;
    taxForm: File | null;
    directDepositForm: File | null;
  };
}

const steps = [
  { id: 1, title: 'Personal Information', icon: User },
  { id: 2, title: 'Employment Details', icon: FileText },
  { id: 3, title: 'Emergency Contact', icon: Phone },
  { id: 4, title: 'Tax Information', icon: Banknote },
  { id: 5, title: 'Banking Details', icon: Shield },
  { id: 6, title: 'Benefits Selection', icon: CheckCircle },
  { id: 7, title: 'Document Upload', icon: FileText },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    position: '',
    employmentType: 'full-time',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
    taxInfo: {
      ssn: '',
      filingStatus: 'single',
      allowances: 1,
    },
    bankingInfo: {
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking',
    },
    benefits: {
      healthInsurance: true,
      dentalInsurance: true,
      visionInsurance: false,
      retirementPlan: true,
      lifeInsurance: false,
    },
    documents: {
      idDocument: null,
      taxForm: null,
      directDepositForm: null,
    },
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [onboardingCode, setOnboardingCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeValidated, setCodeValidated] = useState(false);
  const [onboardingEmail, setOnboardingEmail] = useState<string | null>(null);

  const staffEmail = typeof window !== "undefined" ? localStorage.getItem("staffEmail") : null;
  const user = useQuery(api.queries.users.getUserByEmail, staffEmail ? { email: staffEmail } : 'skip');
  const updateOnboarding = useMutation(api.mutations.users.updateUserOnboarding);

  useEffect(() => {
    if (user && user.onboarding) {
      setFormData(user.onboarding);
    }
  }, [user]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  const handleFileUpload = (field: string, file: File) => {
    updateFormData(`documents.${field}`, file);
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user?._id) {
      console.error('User not authenticated');
      return;
    }
    
    setSubmitting(true);
    try {
      await updateOnboarding({ userId: user._id, onboarding: formData });
      setSubmitted(true);
    } catch (e) {
      console.error('Error updating onboarding:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const validateCode = async () => {
    setCodeError(null);
    try {
      const res = await fetch('/api/staff/onboarding/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: onboardingCode }),
      });
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setCodeValidated(true);
        setOnboardingEmail(data.email);
        await fetch('/api/convex/mutation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            mutation: 'markOnboardingCodeUsed', 
            args: { code: onboardingCode } 
          }),
        });
      } else {
        setCodeError('Invalid or expired code. Please check your offer letter or contact HR.');
      }
    } catch (error) {
      setCodeError('An error occurred. Please try again.');
    }
  };

  // If not signed in
  if (!staffEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-asgard text-white mb-4">Authentication Required</h1>
          <p className="text-white/80 mb-6">Please sign in to access the onboarding portal.</p>
          <button 
            type="button"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Sign in
          </button>
        </GlassCard>
      </div>
    );
  }

  // If onboarding is complete
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-asgard text-white mb-4">Onboarding Complete!</h1>
          <p className="text-white/80 mb-6">
            Thank you for completing your onboarding. HR will review your information and contact you soon.
          </p>
          <Link 
            href="/staff/portal" 
            className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Return to Portal
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 pb-24 sm:pb-8">
      {/* Back Button */}
      <div className="w-full mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-3">
        <Link
          href="/staff/portal"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm"
          aria-label="Back to Staff Portal"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-20 px-3 py-2 sm:px-4 sm:py-3">
        <div className="w-full mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-asgard text-gray-900">Onboarding</h1>
            {codeValidated && (
              <p className="text-xs text-gray-700">Step {currentStep} of {steps.length}</p>
            )}
          </div>
        </div>
      </header>

      <div className="w-full mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
        {!codeValidated ? (
          // Code validation screen
          <div className="max-w-md mx-auto">
            <GlassCard className="p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-2xl font-asgard text-gray-900 mb-4">Welcome to CribNosh Onboarding</h2>
              <p className="text-gray-700 mb-6">Please enter your 6-digit onboarding code from your offer letter to begin.</p>
              <input
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                value={onboardingCode}
                onChange={e => setOnboardingCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-4 py-2 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 font-satoshi text-lg tracking-widest text-center mb-4 bg-white text-gray-900 placeholder-gray-500"
                placeholder="000000"
                aria-label="Onboarding code"
              />
              {codeError && <div className="text-red-500 mb-2 font-satoshi">{codeError}</div>}
              <button
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-satoshi text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                onClick={validateCode}
                disabled={onboardingCode.length !== 6}
                type="button"
              >
                Start Onboarding
              </button>
            </GlassCard>
          </div>
        ) : (
          // Main onboarding form
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between overflow-x-auto pb-2 -mx-2 sm:mx-0 sm:pb-0">
                <div className="flex space-x-1 sm:space-x-2 px-2 sm:px-0 min-w-max w-full">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: '60px' }}>
                      <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                        currentStep >= step.id 
                          ? 'bg-amber-600 border-amber-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-500'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <span className="mt-1 text-[10px] sm:text-xs text-center font-medium text-gray-500 truncate w-full px-1">
                        {step.title.split(' ')[0]}
                      </span>
                      {index < steps.length - 1 && (
                        <div className={`hidden sm:block w-8 sm:w-12 h-0.5 mx-1 ${
                          currentStep > step.id ? 'bg-amber-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <GlassCard className="p-4 sm:p-6 md:p-8">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Personal Information</h2>
                    <p className="mt-1 text-sm text-gray-500">Please provide your personal details</p>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => updateFormData('firstName', e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                          required
                          autoComplete="given-name"
                        />
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => updateFormData('lastName', e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                          required
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                        required
                        autoComplete="email"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => updateFormData('phone', e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                          required
                          autoComplete="tel"
                        />
                      </div>

                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                          className="mt-1 block w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                          required
                          autoComplete="bday"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                          <input
                            type="text"
                            value={formData.address.street}
                            onChange={(e) => updateFormData('address.street', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter street address"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={formData.address.city}
                            onChange={(e) => updateFormData('address.city', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter city"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={formData.address.state}
                            onChange={(e) => updateFormData('address.state', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter state"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                          <input
                            type="text"
                            value={formData.address.zipCode}
                            onChange={(e) => updateFormData('address.zipCode', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter ZIP code"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <input
                            type="text"
                            value={formData.address.country}
                            onChange={(e) => updateFormData('address.country', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter country"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Employment Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Employment Details</h2>
                    <p className="mt-1 text-sm text-gray-500">Please provide your employment information</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => updateFormData('position', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your position"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                      <select
                        value={formData.employmentType}
                        onChange={(e) => updateFormData('employmentType', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="temporary">Temporary</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Emergency Contact */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Emergency Contact</h2>
                    <p className="mt-1 text-sm text-gray-500">Please provide emergency contact information</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => updateFormData('emergencyContact.name', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter contact name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.relationship}
                        onChange={(e) => updateFormData('emergencyContact.relationship', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="e.g., Spouse, Parent, Sibling"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => updateFormData('emergencyContact.phone', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={formData.emergencyContact.email}
                        onChange={(e) => updateFormData('emergencyContact.email', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Tax Information */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Tax Information</h2>
                    <p className="mt-1 text-sm text-gray-500">Please provide your tax information</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Social Security Number</label>
                      <input
                        type="text"
                        value={formData.taxInfo.ssn}
                        onChange={(e) => updateFormData('taxInfo.ssn', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="XXX-XX-XXXX"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
                      <select
                        value={formData.taxInfo.filingStatus}
                        onChange={(e) => updateFormData('taxInfo.filingStatus', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="head-of-household">Head of Household</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allowances</label>
                      <input
                        type="number"
                        value={formData.taxInfo.allowances}
                        onChange={(e) => updateFormData('taxInfo.allowances', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Banking Details */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Banking Details</h2>
                    <p className="mt-1 text-sm text-gray-500">Please provide your banking information for direct deposit</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bankingInfo.bankName}
                        onChange={(e) => updateFormData('bankingInfo.bankName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter bank name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                      <select
                        value={formData.bankingInfo.accountType}
                        onChange={(e) => updateFormData('bankingInfo.accountType', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={formData.bankingInfo.accountNumber}
                        onChange={(e) => updateFormData('bankingInfo.accountNumber', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter account number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                      <input
                        type="text"
                        value={formData.bankingInfo.routingNumber}
                        onChange={(e) => updateFormData('bankingInfo.routingNumber', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter routing number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Benefits Selection */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Benefits Selection</h2>
                    <p className="mt-1 text-sm text-gray-500">Please select your benefits preferences</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="healthInsurance"
                        checked={formData.benefits.healthInsurance}
                        onChange={(e) => updateFormData('benefits.healthInsurance', e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="healthInsurance" className="ml-2 block text-sm text-gray-700">
                        Health Insurance
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dentalInsurance"
                        checked={formData.benefits.dentalInsurance}
                        onChange={(e) => updateFormData('benefits.dentalInsurance', e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="dentalInsurance" className="ml-2 block text-sm text-gray-700">
                        Dental Insurance
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="visionInsurance"
                        checked={formData.benefits.visionInsurance}
                        onChange={(e) => updateFormData('benefits.visionInsurance', e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="visionInsurance" className="ml-2 block text-sm text-gray-700">
                        Vision Insurance
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="retirementPlan"
                        checked={formData.benefits.retirementPlan}
                        onChange={(e) => updateFormData('benefits.retirementPlan', e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="retirementPlan" className="ml-2 block text-sm text-gray-700">
                        401(k) Retirement Plan
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="lifeInsurance"
                        checked={formData.benefits.lifeInsurance}
                        onChange={(e) => updateFormData('benefits.lifeInsurance', e.target.checked)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="lifeInsurance" className="ml-2 block text-sm text-gray-700">
                        Life Insurance
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Document Upload */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Document Upload</h2>
                    <p className="mt-1 text-sm text-gray-500">Please upload the required documents</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID Document (Driver's License, Passport, etc.)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="idDocument" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Drop your file here or click to browse
                            </span>
                            <input
                              id="idDocument"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload('idDocument', file);
                              }}
                            />
                          </label>
                        </div>
                        {formData.documents.idDocument && (
                          <p className="mt-2 text-sm text-green-600">
                            ✓ {formData.documents.idDocument.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Form (W-4)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="taxForm" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Drop your file here or click to browse
                            </span>
                            <input
                              id="taxForm"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload('taxForm', file);
                              }}
                            />
                          </label>
                        </div>
                        {formData.documents.taxForm && (
                          <p className="mt-2 text-sm text-green-600">
                            ✓ {formData.documents.taxForm.name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Direct Deposit Form
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="directDepositForm" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Drop your file here or click to browse
                            </span>
                            <input
                              id="directDepositForm"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload('directDepositForm', file);
                              }}
                            />
                          </label>
                        </div>
                        {formData.documents.directDepositForm && (
                          <p className="mt-2 text-sm text-green-600">
                            ✓ {formData.documents.directDepositForm.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {!submitted && (
                  <>
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1 || submitting}
                      className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </button>
                    
                    {currentStep < steps.length ? (
                      <button
                        onClick={nextStep}
                        disabled={submitting}
                        className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                      >
                        {submitting ? 'Submitting...' : 'Submit Onboarding'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}