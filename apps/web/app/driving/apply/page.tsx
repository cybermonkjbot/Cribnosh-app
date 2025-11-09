"use client";

import { MasonryBackground } from '@/components/ui/masonry-background';
import { MobileBackButton } from '@/components/ui/mobile-back-button';
import { ParallaxContent } from '@/components/ui/parallax-section';
import { api } from '@/convex/_generated/api';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useSessionToken } from '@/hooks/useSessionToken';
import { useMutation } from 'convex/react';
import { Bike, Car, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
;

const vehicleTypes = [
  {
    id: 'car',
    label: 'Car',
    icon: <Car className="w-6 h-6" />,
    description: 'Perfect for larger orders and longer distances',
    color: 'from-red-50 to-red-100/50'
  },
  {
    id: 'bike',
    label: 'Bike',
    icon: <Bike className="w-6 h-6" key="bike-icon" />,
    description: 'Ideal for city center deliveries',
    color: 'from-orange-50 to-orange-100/50'
  },
  {
    id: 'scooter',
    label: 'Scooter',
    icon: <Bike className="w-6 h-6" key="scooter-icon" />,
    description: 'Great for quick urban deliveries',
    color: 'from-yellow-50 to-yellow-100/50'
  }
];

export default function DrivingApply() {
  const [form, setForm] = useState({ name: '', email: '', vehicle: '', experience: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const sessionToken = useSessionToken();
  const [step, setStep] = useState<'vehicle' | 'details'>('vehicle');
  const createDriver = useMutation(api.mutations.drivers.createDriver);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVehicleSelect = (vehicleType: string) => {
    setForm(prev => ({ ...prev, vehicle: vehicleType }));
    if (isMobile) {
      setStep('details');
    } else {
      // On desktop, stay on vehicle selection but update the form
      setStep('vehicle');
    }
  };

  const handleBack = () => {
    setStep('vehicle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle) {
      setError('Please select a vehicle type');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setEmailStatus('submitting');
    try {
      // Queue emails for admin and driver
      const res = await fetch('/api/driving/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setEmailStatus('success');
      else setEmailStatus('error');
    } catch {
      setEmailStatus('error');
    }
    try {
      await createDriver({name: form.name,
        email: form.email,
        vehicle: form.vehicle,
        vehicleType: 'car', // Default to car, could be made configurable
        experience: form.experience ? parseInt(form.experience) : undefined,
        createdAt: Date.now(),
        sessionToken: sessionToken || undefined
      });
      setIsSuccess(true);
      setForm({ name: '', email: '', vehicle: '', experience: '' });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const VehicleSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <h2 className="font-asgard text-2xl sm:text-3xl text-gray-900 mb-6">
        Choose Your Vehicle
      </h2>
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
        {vehicleTypes.map((type) => (
          <motion.button
            key={type.id}
            onClick={() => handleVehicleSelect(type.id)}
            className={`w-full text-left ${form.vehicle === type.id ? 'ring-2 ring-[#ff3b30] bg-[#ff3b30]/5' : 'hover:border-[#ff3b30]'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col h-full p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
              <div className={`shrink-0 w-12 h-12 rounded-xl bg-linear-to-br ${type.color} flex items-center justify-center mb-4`}>
                {type.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{type.label}</h3>
              <p className="text-sm text-gray-600">{type.description}</p>
              {form.vehicle === type.id && (
                <div className="mt-2 flex items-center text-[#ff3b30] text-sm font-medium">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Selected
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  const ApplicationForm = () => (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -20 }}
      className="space-y-6"
    >
      {isMobile && (
        <button
          onClick={handleBack}
          className="flex items-center text-sm font-medium text-gray-600 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to vehicle selection
        </button>
      )}
      {!isMobile && form.vehicle && (
        <div className={`shrink-0 w-12 h-12 rounded-xl bg-linear-to-br ${
          vehicleTypes.find(v => v.id === form.vehicle)?.color || 'from-red-50 to-red-100/50'
        } flex items-center justify-center mb-4`}>
          {vehicleTypes.find(v => v.id === form.vehicle)?.icon}
        </div>
      )}
      <h2 className="font-asgard text-2xl sm:text-3xl text-gray-900 mb-6">
        Complete Your Application
      </h2>
      {!isMobile && form.vehicle && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Selected Vehicle:</span> {vehicleTypes.find(v => v.id === form.vehicle)?.label}
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
            required
          />
        </div>
        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-gray-600 mb-2">
            Delivery Experience (years)
          </label>
          <input
            type="number"
            id="experience"
            name="experience"
            value={form.experience}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-3 rounded-lg bg-white/90 border border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff3b30] focus:border-transparent transition-all duration-300"
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm"
          >
            {error}
          </motion.p>
        )}
        <motion.button
          type="submit"
          className="w-full px-6 py-3 bg-[#ff3b30] text-white rounded-lg font-medium hover:bg-[#ff5e54] transition-all duration-300 disabled:opacity-50"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </motion.button>
      </form>
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800"
        >
          <p className="font-medium">Application submitted successfully!</p>
          <p className="text-sm mt-1">We'll be in touch with you soon.</p>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <main className="min-h-screen bg-linear-to-b from-white to-gray-50">
      <MasonryBackground className="z-0" />
      {/* Mobile Back Button - only on mobile, fixed top left */}
      <MobileBackButton />
      
      <div className="relative z-10">
        {/* Hero Section - Hidden on mobile */}
        <div className="hidden sm:block">
          <section className="pt-24 pb-2 sm:pb-4 px-2 sm:px-4 lg:px-6" data-section-theme="light">
            <div className="max-w-4xl mx-auto">
              <ParallaxContent>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1 className="font-asgard text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2 sm:mb-4 bg-clip-text text-transparent bg-linear-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                    Become a Driver
                    <span className="block text-[#ff3b30] text-base sm:text-lg md:text-xl">Deliver Joy to Doorsteps</span>
                  </h1>
                  <p className="font-satoshi text-sm sm:text-base text-gray-600 max-w-2xl mb-2 sm:mb-4">
                    Join our team of delivery drivers and earn on your schedule. Flexible hours, great earnings.
                  </p>
                </motion.div>
              </ParallaxContent>
            </div>
          </section>
        </div>

        {/* Application Form Section */}
        <section className="py-0 sm:py-10 px-2 sm:px-6 lg:px-8 mt-20 sm:mt-0" data-section-theme="light">
          <div className="max-w-4xl mx-auto">
            <ParallaxContent>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 w-full max-w-3xl mx-auto"
              >
                {/* Mobile-only heading and description */}
                <div className="sm:hidden mb-4">
                  <h1 className="font-asgard text-xl mb-1 bg-clip-text text-transparent bg-linear-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                    Become a Driver
                  </h1>
                  <span className="block text-[#ff3b30] text-xs">Deliver Joy to Doorsteps</span>
                  <p className="font-satoshi text-xs text-gray-600 mt-1">
                    Join our team of delivery drivers and earn on your schedule. Flexible hours, great earnings.
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <h2 className="font-asgard text-3xl text-gray-900 mb-4">Application Submitted!</h2>
                      <p className="font-satoshi text-gray-600 mb-4">
                        Thanks for applying! We'll review your application and get back to you soon.
                      </p>
                      {emailStatus === 'submitting' && (
                        <p className="text-amber-600 text-sm">
                          Processing your application...
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      {isMobile ? (
                        <AnimatePresence mode="wait">
                          {step === 'vehicle' ? (
                            <VehicleSelection />
                          ) : (
                            <ApplicationForm />
                          )}
                        </AnimatePresence>
                      ) : (
                        // Desktop layout: show vehicle selection and form side by side
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="lg:col-span-1">
                            <VehicleSelection />
                          </div>
                          <div className="lg:col-span-1">
                            <ApplicationForm />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>
      </div>
    </main>
  );
}