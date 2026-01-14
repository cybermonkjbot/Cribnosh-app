"use client";

import { GlassCard } from '@/components/ui/glass-card';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Download,
  ExternalLink,
  Globe,
  Monitor,
  Settings,
  Shield,
  Terminal
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ActivityWatchSetupGuideProps {
  staffEmail?: string;
  onComplete?: () => void;
}

type SetupStep = 'overview' | 'download' | 'install' | 'configure' | 'verify' | 'complete';

export function ActivityWatchSetupGuide({ staffEmail, onComplete }: ActivityWatchSetupGuideProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>('overview');
  const [completedSteps, setCompletedSteps] = useState<Set<SetupStep>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  const steps: { key: SetupStep; title: string; description: string; icon: any }[] = [
    {
      key: 'overview',
      title: 'Start',
      description: 'Understand how ActivityWatch works with our time tracking system',
      icon: Monitor
    },
    {
      key: 'download',
      title: 'Download',
      description: 'Get ActivityWatch for your operating system',
      icon: Download
    },
    {
      key: 'install',
      title: 'Install',
      description: 'Install and start ActivityWatch on your machine',
      icon: Settings
    },
    {
      key: 'configure',
      title: 'Configure',
      description: 'Set up ActivityWatch to sync with CribNosh',
      icon: Code
    },
    {
      key: 'verify',
      title: 'Verify',
      description: 'Test that everything is working correctly',
      icon: CheckCircle
    },
    {
      key: 'complete',
      title: 'Complete',
      description: 'You\'re all set up for automatic time tracking',
      icon: Clock
    }
  ];

  const handleStepComplete = (step: SetupStep) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(step);
    setCompletedSteps(newCompleted);

    if (step === 'complete' && onComplete) {
      onComplete();
    }
  };

  const getDownloadLinks = () => ({
    windows: 'https://github.com/ActivityWatch/activitywatch/releases/latest/download/activitywatch-v0.13.0-windows-x86_64.zip',
    macos: 'https://github.com/ActivityWatch/activitywatch/releases/latest/download/activitywatch-v0.13.0-macos-x86_64.dmg',
    linux: 'https://github.com/ActivityWatch/activitywatch/releases/latest/download/activitywatch-v0.13.0-linux-x86_64.tar.gz'
  });

  const renderStepContent = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-asgard text-gray-900 mb-2">ActivityWatch Integration</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                ActivityWatch automatically tracks your computer usage and syncs with CribNosh for accurate time tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Privacy First</h4>
                <p className="text-sm text-gray-600">All data stays on your machine and is only synced when you choose</p>
              </GlassCard>

              <GlassCard className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Automatic Tracking</h4>
                <p className="text-sm text-gray-600">Tracks active windows, applications, and browser tabs automatically</p>
              </GlassCard>

              <GlassCard className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Cross-Platform</h4>
                <p className="text-sm text-gray-600">Works on Windows, macOS, and Linux with consistent tracking</p>
              </GlassCard>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">Important Note</h4>
                  <p className="text-sm text-amber-800">
                    ActivityWatch runs locally on your machine and only syncs data when you manually trigger it or when the sync agent runs.
                    Your privacy is protected as no data is automatically sent to our servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'download':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-asgard text-gray-900 mb-2">Download ActivityWatch</h3>
              <p className="text-gray-600">Choose your operating system to download the latest version</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-6 text-center hover:bg-white/20 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Windows</h4>
                <p className="text-sm text-gray-600 mb-4">Download for Windows 10/11</p>
                <a
                  href={getDownloadLinks().windows}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </GlassCard>

              <GlassCard className="p-6 text-center hover:bg-white/20 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-gray-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">macOS</h4>
                <p className="text-sm text-gray-600 mb-4">Download for macOS 10.15+</p>
                <a
                  href={getDownloadLinks().macos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </GlassCard>

              <GlassCard className="p-6 text-center hover:bg-white/20 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Linux</h4>
                <p className="text-sm text-gray-600 mb-4">Download for Linux distributions</p>
                <a
                  href={getDownloadLinks().linux}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </GlassCard>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Alternative Installation</h4>
                  <p className="text-sm text-blue-800">
                    You can also install ActivityWatch via package managers:
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs ml-2">pip install activitywatch</code> or
                    <code className="bg-blue-100 px-2 py-1 rounded text-xs ml-2">brew install activitywatch</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'install':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-asgard text-gray-900 mb-2">Install ActivityWatch</h3>
              <p className="text-gray-600">Follow these steps to install and start ActivityWatch</p>
            </div>

            <div className="space-y-4">
              <GlassCard className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Terminal className="w-5 h-5 mr-2" />
                  Installation Steps
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Extract the downloaded file</p>
                      <p className="text-sm text-gray-600">Unzip the downloaded archive to a folder of your choice</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Run ActivityWatch</p>
                      <p className="text-sm text-gray-600">Double-click <code className="bg-gray-100 px-1 rounded">aw-qt</code> or run from terminal</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Grant permissions</p>
                      <p className="text-sm text-gray-600">Allow ActivityWatch to monitor your activity when prompted</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Verify it&apos;s running</p>
                      <p className="text-sm text-gray-600">You should see the ActivityWatch icon in your system tray</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Success Indicators</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• ActivityWatch icon appears in system tray</li>
                      <li>• No error messages during startup</li>
                      <li>• Web interface accessible at <code className="bg-green-100 px-1 rounded">http://localhost:5600</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'configure':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-asgard text-gray-900 mb-2">Configure Sync</h3>
              <p className="text-gray-600">Set up ActivityWatch to sync with CribNosh time tracking</p>
            </div>

            <div className="space-y-4">
              <GlassCard className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  Sync Configuration
                </h4>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">1. Create Sync Script</h5>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>{`#!/bin/bash
# ActivityWatch to CribNosh Sync Script
# Save this as sync-activitywatch.sh

EMAIL="${staffEmail || 'your-email@cribnosh.com'}"
API_URL="https://cribnosh.com/api/timelogs"

# Get ActivityWatch data
aw-export --start yesterday --end now --format json > /tmp/aw-export.json

# Send to CribNosh
curl -X POST $API_URL \\
  -H "Content-Type: application/json" \\
  -d "{
    \\"user\\": \\"$EMAIL\\",
    \\"bucket\\": \\"aw-watcher-window_$EMAIL\\",
    \\"logs\\": $(cat /tmp/aw-export.json)
  }"

echo "Sync completed at $(date)"`}</pre>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">2. Set up Auto-Sync (Optional)</h5>
                    <p className="text-sm text-gray-600 mb-3">
                      To automatically sync every hour, add this to your crontab:
                    </p>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                      <code>0 * * * * /path/to/sync-activitywatch.sh</code>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Manual Sync Option</h4>
                    <p className="text-sm text-amber-800">
                      You can also manually sync your data through the ActivityWatch web interface at
                      <code className="bg-amber-100 px-1 rounded ml-1">http://localhost:5600</code> and export data as needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-asgard text-gray-900 mb-2">Verify Setup</h3>
              <p className="text-gray-600">Test that ActivityWatch is working correctly</p>
            </div>

            <div className="space-y-4">
              <GlassCard className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verification Checklist
                </h4>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-gray-900">ActivityWatch is running (icon in system tray)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-gray-900">Web interface accessible at localhost:5600</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-gray-900">Data is being collected (check web interface)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-gray-900">Sync script runs without errors</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-gray-900">Data appears in CribNosh time tracking</span>
                  </label>
                </div>
              </GlassCard>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Need Help?</h4>
                    <p className="text-sm text-blue-800">
                      Visit the <a href="https://activitywatch.net/docs/" target="_blank" rel="noopener noreferrer" className="underline">ActivityWatch documentation</a> or
                      contact your IT administrator for assistance with setup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <div>
              <h3 className="text-2xl font-asgard text-gray-900 mb-2">Setup Complete!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                ActivityWatch is now configured and will automatically track your work activity.
                Your time tracking data will be synced with CribNosh for accurate reporting.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-md mx-auto">
              <h4 className="font-semibold text-green-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-green-800 space-y-1 text-left">
                <li>• ActivityWatch runs in the background</li>
                <li>• Data syncs automatically (if configured) or manually</li>
                <li>• View your tracked time in the time tracking dashboard</li>
                <li>• Generate reports and insights from your activity data</li>
              </ul>
            </div>

            {/* Finish Setup Button (moved here) */}
            <button
              onClick={handleFinishSetup}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Finish Setup
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const handleFinishSetup = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activityWatchSetupComplete', 'true');
      router.push('/staff/time-tracking');
    }
  };

  return (
    <GlassCard className="p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Monitor className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-asgard text-gray-900 mb-2">Setup Instructions</h2>
        <p className="text-gray-600">
          Set up automatic time tracking with ActivityWatch integration
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.key)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${currentStep === step.key
                    ? 'bg-blue-100 text-blue-700'
                    : completedSteps.has(step.key)
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.key === currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].key);
            }
          }}
          disabled={currentStep === 'overview'}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex items-center space-x-2">
          {currentStep !== 'complete' && (
            <button
              onClick={() => handleStepComplete(currentStep)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark Complete
            </button>
          )}

          {currentStep !== 'complete' && (
            <button
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.key === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].key);
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default ActivityWatchSetupGuide; 