"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CookieSettingsPopup({ isOpen, onClose }: CookieSettingsPopupProps) {
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true, // Always true and disabled
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Load saved settings when popup opens
    if (isOpen) {
      const savedSettings = localStorage.getItem("cookieSettings");
      if (savedSettings) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings({ ...JSON.parse(savedSettings), necessary: true });
      }
    }
  }, [isOpen]);

  const handleSettingChange = (setting: keyof CookieSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setSettings(allAccepted);
    localStorage.setItem("cookieSettings", JSON.stringify(allAccepted));
    onClose();
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookieSettings", JSON.stringify(settings));
    onClose();
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45]"
            onClick={onClose}
          />

          {/* Cookie Settings Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 w-full h-[90vh] max-h-[600px] sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl z-[46] p-0 sm:p-6 rounded-t-2xl sm:rounded-2xl bg-white shadow-xl flex flex-col"
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 sm:p-0"
                data-cursor-text="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-8 pb-4 sm:px-0 sm:pt-0 sm:pb-0">
              <h2 className="text-2xl font-bold mb-4 font-['Asgard']">Cookie Settings</h2>
              <p className="text-gray-600 mb-6 font-['Satoshi']">
                We use cookies to enhance your browsing experience and analyze our traffic. Please select your preferences below.
              </p>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium font-['Satoshi']">Necessary Cookies</h3>
                    <p className="text-sm text-gray-500">Required for the website to function properly</p>
                  </div>
                  <Toggle checked={settings.necessary} disabled />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium font-['Satoshi']">Analytics Cookies</h3>
                    <p className="text-sm text-gray-500">Help us improve our website by collecting usage information</p>
                  </div>
                  <Toggle
                    checked={settings.analytics}
                    onChange={(checked) => handleSettingChange('analytics', checked)}
                  />
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium font-['Satoshi']">Marketing Cookies</h3>
                    <p className="text-sm text-gray-500">Allow us to personalize your experience and send relevant content</p>
                  </div>
                  <Toggle
                    checked={settings.marketing}
                    onChange={(checked) => handleSettingChange('marketing', checked)}
                  />
                </div>

                {/* Preferences Cookies */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium font-['Satoshi']">Preferences Cookies</h3>
                    <p className="text-sm text-gray-500">Remember your settings and preferences for a better experience</p>
                  </div>
                  <Toggle
                    checked={settings.preferences}
                    onChange={(checked) => handleSettingChange('preferences', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:gap-4 sm:mt-8 border-t border-gray-100 bg-white rounded-b-2xl">
              <button
                onClick={handleAcceptAll}
                className="w-full sm:flex-1 px-6 py-3 bg-[#ff3b30] text-white rounded-xl font-medium hover:bg-[#ff5e54] transition-colors font-['Satoshi'] text-base"
                data-cursor-text="Accept All"
              >
                Accept All
              </button>
              <button
                onClick={handleSavePreferences}
                className="w-full sm:flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-medium hover:bg-gray-200 transition-colors font-['Satoshi'] text-base"
                data-cursor-text="Save Preferences"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange?: (checked: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange?.(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#ff3b30]' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    disabled={disabled}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
        }`}
    />
  </button>
); 