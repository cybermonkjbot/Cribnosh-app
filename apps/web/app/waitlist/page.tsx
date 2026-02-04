"use client";

import { GlassCard } from '@/components/ui/glass-card';
import { MasonryBackground } from '@/components/ui/masonry-background';
import { MobileBackButton } from '@/components/ui/mobile-back-button';
import { ParallaxContent } from '@/components/ui/parallax-section';
import { SocialFollowPromo } from '@/components/ui/social-follow-promo';
import { EmailOTPVerification } from '@/components/waitlist/email-otp-verification';
import { api } from "@/convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { useAction, useQuery } from "convex/react";
import { CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from '../../context/location-context';

type ContactType = 'email' | 'phone' | null;
type WaitlistStep = 'form' | 'otp-verification' | 'success';

interface WaitlistResult {
  success: boolean;
  id: string;
  userId: string;
  isExisting?: boolean;
}

export default function WaitlistPage() {
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState<ContactType>(null);
  const [currentStep, setCurrentStep] = useState<WaitlistStep>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSocialMediaFollowing, setHasSocialMediaFollowing] = useState(false);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const { location } = useLocation();
  const [emailStatus, setEmailStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [alreadySignedUp, setAlreadySignedUp] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [referralRewarded, setReferralRewarded] = useState(false);
  const { isMobile } = useMobileDevice();

  // Helper function to format location data as string
  const formatLocationAsString = (location: any): string | undefined => {
    if (!location) return undefined;
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    return parts.length > 0 ? parts.join(', ') : undefined;
  };

  const addToWaitlist = useAction(api.actions.waitlist.addToWaitlistComplete);

  // Debounced email for query to prevent excessive queries
  const [debouncedEmail, setDebouncedEmail] = useState<string>('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce email input for query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (contactType === 'email' && contact) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedEmail(contact);
      }, 500); // Wait 500ms after user stops typing
    } else {
      setDebouncedEmail('');
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [contact, contactType]);

  // Only query when we have a debounced email
  const waitlistEntry = useQuery(
    api.queries.waitlist.getByEmail,
    debouncedEmail ? { email: debouncedEmail } : 'skip'
  );

  // These are now handled by addToWaitlistComplete action
  // const attributeReferral = useMutation(api.mutations.users.attributeReferral);
  // const generateReferralLink = useMutation(api.mutations.users.generateReferralLink);
  // const setSessionToken = useMutation(api.mutations.users.setSessionToken);

  // Check if already signed up
  useEffect(() => {
    if (waitlistEntry) {
      setAlreadySignedUp(true);
    } else if (debouncedEmail && waitlistEntry === null) {
      // Only set to false if we've actually queried (not skipped)
      setAlreadySignedUp(false);
    }
  }, [waitlistEntry, debouncedEmail]);

  // On mount, read ?ref param and store in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferrerId(ref);
        localStorage.setItem('cribnosh_ref', ref);
      } else {
        const storedRef = localStorage.getItem('cribnosh_ref');
        if (storedRef) setReferrerId(storedRef);
      }
    }
  }, []);

  // After successful signup, fetch/generate referral link for CTA
  useEffect(() => {
    if (isSuccess && contactType === 'email' && contact) {
      // Simulate API call to get referral link (replace with real call)
      // Example: fetch('/api/generate-referral-link', ...)
      // For now, just use a placeholder
      const userId = 'USER_ID'; // Replace with actual user ID from backend
      setReferralLink(`${window.location.origin}/waitlist?ref=${userId}`);
    }
  }, [isSuccess, contactType, contact]);

  // CTA text swap logic
  const ctaOptions = [
    { text: ' Signup to cook instead? →', href: '/work-with-cribnosh' },
    { text: ' Signup to Drive instead? →', href: '/work-with-cribnosh' },
  ];
  const [ctaIndex, setCtaIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCtaIndex((prev) => (prev + 1) % ctaOptions.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const validateContact = useCallback((value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

    if (emailRegex.test(value)) {
      setContactType('email');
      setError('');
      return true;
    } else if (phoneRegex.test(value)) {
      setContactType('phone');
      setError('');
      return true;
    } else {
      setContactType(null);
      setError('Please enter a valid email or phone number');
      return false;
    }
  }, []);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContact(value);
    if (value) validateContact(value);
    else {
      setError('');
      setContactType(null);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSocialMediaFollowing(e.target.checked);
  };

  const handleOTPSuccess = async (token: string, user: any) => {
    try {
      // Store the token and user info
      localStorage.setItem('cribnosh_waitlist_session', token);
      localStorage.setItem('cribnosh_user_id', user.user_id);

      // Add to waitlist with the verified email
      const result = await addToWaitlist({
        email: contact,
        source: hasSocialMediaFollowing ? 'social' : 'organic',
        location: formatLocationAsString(location) || undefined,
        referrerId: referrerId ? (referrerId as Id<'users'>) : undefined,
        deviceId: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        ip: undefined,
      });

      if (result.userId) {
        setUserId(result.userId);

        // Session token and referral link are now returned from the action
        if (result.sessionToken) {
          localStorage.setItem('cribnosh_waitlist_session', result.sessionToken);
        }
        localStorage.setItem('cribnosh_user_id', result.userId);

        if (result.referralLink) {
          setReferralLink(result.referralLink);
        }

        if (result.referralAttributed) {
          setReferralRewarded(true);
        }
      }

      setCurrentStep('success');
      setIsSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      throw err;
    }
  };

  const handleOTPError = (error: string) => {
    setError(error);
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setError('');
    setContact('');
    setContactType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContact(contact)) return;

    // Check if user is already signed up before proceeding
    if (alreadySignedUp) {
      setError('You are already signed up to our waitlist! Check your email for updates.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSyncStatus('pending');
    setEmailStatus('submitting');

    // For email addresses, use OTP verification flow
    if (contactType === 'email') {
      try {
        // Send OTP email
        const response = await fetch('/api/auth/email-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: contact,
            action: 'send',
          }),
        });

        const data = await response.json();

        if (data.success) {
          setCurrentStep('otp-verification');
          setEmailStatus('success');
        } else {
          setError(data.error || 'Failed to send verification email');
          setEmailStatus('error');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        setEmailStatus('error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // For phone numbers, we need to create a temporary email for the waitlist
    const tempEmail = `${contact.replace(/\D/g, '')}@phone.cribnosh.com`;

    try {
      // Call Convex action to add to waitlist and get userId
      const result = await addToWaitlist({
        email: tempEmail,
        source: hasSocialMediaFollowing ? 'social' : 'organic',
        location: formatLocationAsString(location) || undefined, // Attach location context
        referrerId: referrerId ? (referrerId as Id<'users'>) : undefined,
        deviceId: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        ip: undefined,
      });
      setSyncStatus(result.success ? 'success' : 'error');
      setIsSuccess(true);
      setContact('');
      setContactType(null);
      setHasSocialMediaFollowing(false);
      if (result.userId) {
        setUserId(result.userId);
        // Session token and referral link are now returned from the action
        if (result.sessionToken) {
          localStorage.setItem('cribnosh_waitlist_session', result.sessionToken);
        }
        localStorage.setItem('cribnosh_user_id', result.userId);

        if (result.referralLink) {
          setReferralLink(result.referralLink);
        }

        if (result.referralAttributed) {
          setReferralRewarded(true);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setSyncStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const featureFlags = useQuery(api.featureFlags.get, { group: 'web_home' });
  const isFeatureEnabled = (key: string) => {
    if (!featureFlags) return true;
    const flag = featureFlags.find((f: any) => f.key === key);
    return flag ? flag.value : true;
  };

  const isWaitlistEnabled = isFeatureEnabled('web_waitlist');

  if (!isWaitlistEnabled) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <MasonryBackground className="z-0" />
        <div className="relative z-10 text-center p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl max-w-md mx-4">
          <h1 className="font-asgard text-3xl mb-4 text-gray-900">Waitlist Closed</h1>
          <p className="font-satoshi text-gray-600">
            We are currently not accepting new signups for the waitlist. Please check back later or follow us on social media for updates.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            {/* Simple social links or just back to home */}
            <Link href="/" className="px-6 py-2 bg-gray-900 text-white rounded-full font-satoshi hover:bg-gray-800 transition">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Animated CTA - top right on mobile, bottom right on desktop */}
      <div className={`fixed right-6 z-30 ${isMobile ? 'top-6' : 'bottom-6'}`}>
        <Link
          href={ctaOptions[ctaIndex].href}
          className="font-satoshi text-base sm:text-lg px-4 py-2 rounded-full bg-white shadow text-gray-700 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900"
          aria-label={ctaOptions[ctaIndex].text}
        >
          {ctaOptions[ctaIndex].text}
        </Link>
      </div>
      <MasonryBackground className="z-0" />
      {/* Mobile Back Button - only on mobile, fixed top left */}
      <MobileBackButton />
      <div className="relative z-10">
        {/* Hero Section - Hidden on mobile */}
        <div className="hidden sm:block">
          <section className="pt-40 pb-4 sm:pb-10 px-4 sm:px-6 lg:px-8" data-section-theme="light">
            <div className="max-w-7xl mx-auto">
              <ParallaxContent>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center"
                >
                  <h1 className="font-asgard text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-[#ff3b30] to-gray-900 text-center mx-auto">
                    Join Our Waitlist
                  </h1>
                  <p className="font-satoshi text-lg sm:text-xl text-gray-600 max-w-3xl mb-6 sm:mb-8 text-center mx-auto">
                    Enter your email or phone number below to get early access and exclusive perks when we launch in your area.
                  </p>
                </motion.div>
              </ParallaxContent>
            </div>
          </section>
        </div>

        {/* Waitlist Form Section */}
        <section className="py-0 sm:py-10 px-2 sm:px-6 lg:px-8 mt-20 sm:mt-0" data-section-theme="light">
          <div className="max-w-3xl mx-auto">
            <ParallaxContent>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 w-[95%] sm:w-full max-w-md mx-auto"
              >
                {/* Mobile-only heading and description */}
                <div className="sm:hidden mb-8 text-center">
                  <h1 className="font-asgard text-3xl text-gray-900 mb-3 text-center mx-auto">
                    Join Our Waitlist
                  </h1>
                  <p className="font-satoshi text-base text-gray-600 text-center mx-auto">
                    Enter your email or phone number below to get early access and exclusive perks when we launch in your area.
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {!isSuccess && currentStep === 'form' && (
                    <motion.div
                      className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 flex items-center justify-center mb-6"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={contactType || 'default'}
                          initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          {contactType === 'email' ? (
                            <a
                              href="mailto:enquiries@cribnosh.co.uk"
                              className="cursor-pointer hover:scale-110 transition-transform duration-200"
                              title="Contact us at enquiries@cribnosh.co.uk"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </a>
                          ) : contactType === 'phone' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          ) : (
                            <a
                              href="mailto:enquiries@cribnosh.co.uk"
                              className="cursor-pointer hover:scale-110 transition-transform duration-200"
                              title="Contact us at enquiries@cribnosh.co.uk"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </a>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {currentStep === 'otp-verification' ? (
                    <EmailOTPVerification
                      email={contact}
                      onBack={handleBackToForm}
                      onSuccess={handleOTPSuccess}
                      onError={handleOTPError}
                    />
                  ) : isSuccess ? (
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
                      <h2 className="font-asgard text-3xl text-gray-900 mb-4">You&apos;re on the list!</h2>
                      <p className="font-satoshi text-gray-600 mb-4">
                        Thanks for joining our waitlist. We&apos;ll be in touch soon with exciting updates about our launch in your area.
                      </p>
                      {syncStatus === 'pending' && (
                        <p className="text-amber-600 text-sm">
                          Syncing your information...
                        </p>
                      )}
                      {syncStatus === 'success' && (
                        <p className="text-green-600 text-sm">
                          Your information has been successfully synced.
                        </p>
                      )}
                      {syncStatus === 'error' && (
                        <p className="text-red-600 text-sm">
                          There was an issue syncing your information, but don&apos;t worry - you&apos;re still on the list!
                        </p>
                      )}
                      <SocialFollowPromo />
                      <GlassCard className="mt-8 p-6 flex flex-col items-center text-center bg-white/80">
                        <h3 className="font-asgard text-2xl mb-2">Want to earn rewards?</h3>
                        <p className="font-satoshi text-gray-700 mb-4">
                          Join our Referral Program and start earning Forkprints for every friend you invite!
                        </p>
                        <Link
                          href="/referral"
                          className="px-6 py-3 bg-[#ff3b30] text-white rounded-lg font-satoshi text-lg hover:bg-[#ff5e54] transition shadow-lg"
                          aria-label="Join Referral Program"
                        >
                          Start Earning with Referrals
                        </Link>
                      </GlassCard>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >


                      <form onSubmit={handleSubmit} className="space-y-6 w-full">
                        <div>
                          <label htmlFor="contact" className="block font-satoshi text-gray-800 font-semibold text-base mb-2">Email or Phone Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              id="contact"
                              value={contact}
                              onChange={handleContactChange}
                              className={`w-full p-3 rounded-lg shadow-md bg-white focus:bg-white border-2 transition-colors duration-200 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder-gray-400 font-medium text-base outline-none ${error ? 'border-red-500' : contactType ? 'border-green-500' : 'border-gray-300'
                                }`}
                              placeholder="your@email.com or +44 7123 456789"
                              required
                              autoComplete="email"
                            />
                            <AnimatePresence>
                              {contactType && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.5 }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <AnimatePresence>
                            {error && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-red-500 text-sm mt-2 font-semibold"
                              >
                                {error}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          <div className="mt-4 flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="social-media-following"
                                name="social-media-following"
                                type="checkbox"
                                checked={hasSocialMediaFollowing}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 rounded border-gray-300 text-[#ff3b30] focus:ring-[#ff3b30] cursor-pointer"
                              />
                            </div>
                            <label
                              htmlFor="social-media-following"
                              className="ml-3 text-sm font-medium text-gray-700 cursor-pointer select-none"
                            >
                              I have a significant social media following and would be open to receiving a PR package
                            </label>
                          </div>

                          <motion.div
                            className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100"
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <p className="text-sm text-amber-800">
                              By joining our waitlist, you&apos;ll get <Link href="/early-access-perks" className="text-[#ff3b30] font-medium hover:underline">exclusive early access perks</Link> when we launch in your area.
                            </p>
                          </motion.div>
                        </div>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: alreadySignedUp ? 1 : 1.02 }}
                          whileTap={{ scale: alreadySignedUp ? 1 : 0.98 }}
                          disabled={isSubmitting || !contactType || alreadySignedUp}
                          className="w-full px-6 py-3 bg-[#ff3b30] text-white rounded-lg font-satoshi hover:bg-[#ff5e54] transition-all duration-300 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <span className="relative z-10">
                            {isSubmitting ? 'Joining...' : alreadySignedUp ? 'Already Signed Up' : 'Join Waitlist'}
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.button>

                        {alreadySignedUp && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <p className="text-green-800 font-semibold">You&apos;re already on our waitlist!</p>
                            </div>
                            <p className="text-green-700 text-sm">
                              Thanks for your interest! We&apos;ll notify you as soon as we launch in your area.
                              <Link href="/referral" className="text-[#ff3b30] font-medium hover:underline ml-1">
                                Start earning rewards with referrals →
                              </Link>
                            </p>
                          </motion.div>
                        )}
                      </form>
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