"use client";

import {
  CulinaryBackgroundForm,
  KitchenDetailsForm,
  MenuItemsForm,
  PersonalInfoForm,
  ReviewSubmitForm,
  UploadPhotosForm
} from '@/components/cooking';
import { MasonryBackground } from '@/components/ui/masonry-background';
import { MobileBackButton } from '@/components/ui/mobile-back-button';
import { ParallaxContent } from '@/components/ui/parallax-section';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMutation } from 'convex/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type FormStep = 'personal' | 'kitchen' | 'background' | 'menu' | 'photos' | 'review';

export interface ChefApplicationData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  kitchenDetails: {
    kitchenName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    kitchenType: string;
    postcode: string;
    equipmentDetails: string;
  };
  culinaryBackground: {
    experience: string;
    specialties: string[];
    certifications: string[];
    cuisineTypes: string[];
  };
  menuItems: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    dietaryTags: string[];
  }>;
  photos: {
    kitchen: string[];
    dishes: string[];
  };
  availability: string[];
  businessRegistration: string;
  hasInsurance: boolean;
  geocodedLocation?: { lat: number; lng: number };
  submissionStatus?: {
    status: 'idle' | 'submitting' | 'success' | 'error';
    message: string;
    operationId?: string;
    finalStatus?: 'completed' | 'failed';
    error?: string;
  };
}

const initialFormData: ChefApplicationData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },
  kitchenDetails: {
    kitchenName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    kitchenType: '',
    postcode: '',
    equipmentDetails: ''
  },
  culinaryBackground: {
    experience: '',
    specialties: [],
    certifications: [],
    cuisineTypes: []
  },
  menuItems: [],
  photos: {
    kitchen: [],
    dishes: []
  },
  availability: [],
  businessRegistration: '',
  hasInsurance: false,
  geocodedLocation: undefined,
};

// Export the type using export type to fix isolatedModules error
export type { ChefApplicationData as FormData };

export default function ApplicationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [formData, setFormData] = useState<ChefApplicationData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const isMobile = useMediaQuery('(max-width: 768px)');

  const createChef = useMutation(api.mutations.chefs.createChef);
  const createKitchen = useMutation(api.mutations.kitchens.createKitchen);

  // Load saved progress on component mount
  useEffect(() => {
    const saved = localStorage.getItem('chef-application-progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, []);

  // Save progress whenever form data changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem('chef-application-progress', JSON.stringify(formData));
    }
  }, [formData]);

  const updateFormData = (data: Partial<ChefApplicationData>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };

  const steps: FormStep[] = ['personal', 'kitchen', 'background', 'menu', 'photos', 'review'];
  const currentIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };



  const isStepValid = () => {
    switch (currentStep) {
      case 'personal':
        // Only email is truly required for initial signup
        return formData.personalInfo.email.trim() !== '';
      case 'kitchen':
        // Kitchen details are optional - allow skipping
        return true;
      case 'background':
        // Experience is optional - allow skipping
        return true;
      case 'menu':
        // Menu items are optional - allow skipping
        return true;
      case 'photos':
        // Photos are optional - allow skipping
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setFormData(prev => ({
        ...prev,
        submissionStatus: {
          status: 'submitting',
          message: 'Submitting your application...',
        },
      }));

      // Get the current user ID (you'll need to implement this based on your auth system)
      const userId = ''; // Replace with actual user ID from your auth system

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create chef with minimal required fields - make most fields optional
      const chefId = await createChef({
        userId: userId as Id<'users'>,
        name: formData.personalInfo.firstName && formData.personalInfo.lastName
          ? `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`
          : formData.personalInfo.email.split('@')[0], // Use email prefix if no name
        cuisine: formData.culinaryBackground.cuisineTypes.length > 0
          ? formData.culinaryBackground.cuisineTypes
          : ['General'], // Default cuisine if none specified
        location: {
          lat: formData.geocodedLocation?.lat || 0,
          lng: formData.geocodedLocation?.lng || 0,
          city: formData.kitchenDetails.city || 'TBD', // Allow TBD for city
        },
        rating: 0, // Start with 0 rating
        image: formData.photos.kitchen[0] || undefined,
        bio: formData.culinaryBackground.experience || 'Food Creator passionate about creating delicious meals',
        specialties: formData.culinaryBackground.specialties.length > 0
          ? formData.culinaryBackground.specialties
          : ['Home Cooking'], // Default specialty
      });

      // Create kitchen only if basic details are provided
      if (formData.kitchenDetails.address && formData.kitchenDetails.city) {
        await createKitchen({
          owner_id: chefId,
          address: `${formData.kitchenDetails.address}, ${formData.kitchenDetails.city}, ${formData.kitchenDetails.state} ${formData.kitchenDetails.zipCode}`,
          certified: false,
          inspectionDates: [],
          images: formData.photos.kitchen
        });
      }

      // 2. Submit to API for email execution
      // Queue emails for admin and chef
      await fetch('/api/cooking/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify(formData),
      });
      const apiData = {
        formType: 'Food Creator Application',
        fullName: formData.personalInfo.firstName && formData.personalInfo.lastName
          ? `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`
          : 'Food Creator Applicant',
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone || 'Not provided',
        yearsExperience: formData.culinaryBackground.experience
          ? parseInt(formData.culinaryBackground.experience)
          : 0,
        cuisines: formData.culinaryBackground.cuisineTypes.length > 0
          ? formData.culinaryBackground.cuisineTypes
          : ['General'],
        kitchenType: formData.kitchenDetails.kitchenType || 'Not specified',
        availability: formData.availability.length > 0
          ? formData.availability
          : ['Flexible'],
        certifications: formData.culinaryBackground.certifications.length > 0
          ? formData.culinaryBackground.certifications
          : ['None specified'],
        businessRegistration: formData.businessRegistration || 'Not provided',
        hasInsurance: formData.hasInsurance,
        dietarySpecialties: formData.culinaryBackground.specialties.length > 0
          ? formData.culinaryBackground.specialties
          : ['General'],
        preferredZones: formData.kitchenDetails.city
          ? [formData.kitchenDetails.city]
          : ['TBD'],
        languages: ['English'],
      };
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify(apiData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit application');
      setFormData(prev => ({
        ...prev,
        submissionStatus: {
          status: 'success',
          message: 'Application submitted successfully! We will review your application and get back to you soon.',
          operationId: result.operationId,
        },
      }));
      // Send confirmation email
      const emailPayload = {
        to: formData.personalInfo.email,
        from: 'applications@cribnosh.com',
        subject: 'Your CribNosh Food Creator Application',
        html: `
                  <h1>Thanks for Applying to CribNosh!</h1>
                  <p>Hi ${formData.personalInfo.firstName},</p>
                  <p>We've received your application to become a CribNosh food creator. Our team will review your information and get back to you within 2-3 business days.</p>
                  <p>Next steps:</p>
                  <ul>
                    <li>Application review by our team</li>
                    <li>Initial phone screening</li>
                    <li>Kitchen inspection scheduling</li>
                    <li>Documentation verification</li>
                  </ul>
                  <p>If you have any questions in the meantime, feel free to reply to this email.</p>
                  <p>Best regards,<br>The CribNosh Team</p>
                `,
      };
      await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify(emailPayload),
      });

      setTimeout(() => {
        router.push('/cooking/apply/success');
      }, 2000);
    } catch (error) {
      setFormData(prev => ({
        ...prev,
        submissionStatus: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to submit application',
        },
      }));
    }
  };

  const renderFormStep = () => {
    const commonProps = {
      formData,
      updateFormData,
      formErrors,
      setFormErrors,
    };

    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -20 }}
        className="w-full"
      >
        {currentStep === 'personal' && <PersonalInfoForm {...commonProps} />}
        {currentStep === 'kitchen' && <KitchenDetailsForm {...commonProps} />}
        {currentStep === 'background' && <CulinaryBackgroundForm {...commonProps} />}
        {currentStep === 'menu' && <MenuItemsForm {...commonProps} />}
        {currentStep === 'photos' && <UploadPhotosForm {...commonProps} />}
        {currentStep === 'review' && <ReviewSubmitForm {...commonProps} onSubmit={handleSubmit} />}
      </motion.div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
                  <h1 className="font-asgard text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-4 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                    Join Our Kitchen Network
                  </h1>
                  <p className="font-satoshi text-lg sm:text-xl text-gray-600 max-w-3xl mb-6 sm:mb-8 mx-auto">
                    Share your culinary passion with food lovers in your area. Complete the application below to get started.
                  </p>
                </motion.div>
              </ParallaxContent>
            </div>
          </section>
        </div>

        {/* Application Form Section */}
        <section className="py-0 sm:py-10 px-2 sm:px-6 lg:px-8 mt-20 sm:mt-0" data-section-theme="light">
          <div className="max-w-3xl mx-auto">
            <ParallaxContent>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 w-[95%] sm:w-full max-w-2xl mx-auto"
              >
                {/* Mobile-only heading and description */}
                <div className="sm:hidden mb-8 text-center">
                  <h1 className="font-asgard text-3xl text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                    Join Our Kitchen Network
                  </h1>
                  <p className="font-satoshi text-base text-gray-600">
                    Share your culinary passion with food lovers in your area. Complete the application below to get started.
                  </p>
                </div>



                <AnimatePresence mode="wait">
                  {formData.submissionStatus?.status === 'success' ? (
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
                        {formData.submissionStatus.message}
                      </p>
                      {formData.submissionStatus.operationId && (
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
                      className="space-y-6"
                    >
                      {/* Progress Steps */}
                      <div className="flex justify-between items-center mb-8">
                        {steps.map((step, index) => (
                          <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === step ? 'bg-[#ff3b30] text-white' :
                              steps.indexOf(currentStep) > index ? 'bg-green-500 text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                              {steps.indexOf(currentStep) > index ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                index + 1
                              )}
                            </div>
                            {index < steps.length - 1 && (
                              <div className={`h-1 w-16 mx-2 ${steps.indexOf(currentStep) > index ? 'bg-green-500' : 'bg-gray-200'
                                }`} />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Form Content */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStep}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          {renderFormStep()}
                        </motion.div>
                      </AnimatePresence>

                      {/* Navigation Buttons */}
                      <div className="flex justify-between mt-8">
                        {currentIndex > 0 && (
                          <motion.button
                            onClick={handleBack}
                            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ChevronLeft className="w-5 h-5 mr-2" />
                            Back
                          </motion.button>
                        )}
                        {currentIndex < steps.length - 1 ? (
                          <motion.button
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className={`ml-auto flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${isStepValid()
                              ? 'bg-[#ff3b30] text-white hover:bg-[#ff5e54]'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            whileHover={isStepValid() ? { scale: 1.02 } : {}}
                            whileTap={isStepValid() ? { scale: 0.98 } : {}}
                          >
                            Next
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </motion.button>
                        ) : null}
                      </div>
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