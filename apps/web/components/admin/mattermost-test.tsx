'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';

interface CollaborationSuiteStatus {
  configured: boolean;
  webhook: boolean;
  api: boolean;
  channel?: string;
  team?: string;
}

export function CollaborationSuiteTest() {
  const [status, setStatus] = useState<CollaborationSuiteStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mattermost', {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check Collaboration Suite status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async (type: 'test' | 'custom' | 'system-health') => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const payload: any = { type };
      
      if (type === 'custom' && message) {
        payload.message = message;
      }
      
      if (channel) {
        payload.channel = channel;
      }

      const response = await fetch('/api/mattermost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      setTestResult({
        success: response.ok,
        message: result.message || result.error || 'Unknown response',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send test message',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
            <GlassCard className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white border border-[#F23E2E]/20 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg sm:text-xl font-asgard text-gray-900 break-words">Collaboration Suite Integration</h3>
        </div>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-3 sm:px-4 py-2 bg-[#F23E2E] hover:bg-[#F23E2E]/90 disabled:opacity-50 rounded-lg text-white font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.configured ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-900">Configured: {status.configured ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.webhook ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-gray-900">Webhook: {status.webhook ? 'Available' : 'Not set'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${status.api ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span className="text-gray-900">API: {status.api ? 'Available' : 'Not set'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {status.channel && (
              <div className="text-gray-900">
                <span className="font-medium">Channel:</span> {status.channel}
              </div>
            )}
            {status.team && (
              <div className="text-gray-900">
                <span className="font-medium">Team:</span> {status.team}
              </div>
            )}
          </div>
        </div>
      )}

              <div className="border-t border-[#F23E2E]/20 pt-6">
        <h4 className="text-lg font-asgard text-gray-900 mb-4">Test Notifications</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-full overflow-hidden">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Custom Message
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter custom message..."
                className="w-full px-3 py-2 bg-[#F23E2E]/10 border border-[#F23E2E]/20 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Channel (optional)
              </label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="Enter channel name..."
                className="w-full px-3 py-2 bg-[#F23E2E]/10 border border-[#F23E2E]/20 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={() => sendTestMessage('test')}
              disabled={loading || !status?.configured}
              className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              Send Test Message
            </button>
            
            <button
              onClick={() => sendTestMessage('custom')}
              disabled={loading || !status?.configured || !message}
              className="px-3 sm:px-4 py-2 bg-[#F23E2E] hover:bg-[#F23E2E]/90 disabled:opacity-50 rounded-lg text-white font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              Send Custom Message
            </button>
            
            <button
              onClick={() => sendTestMessage('system-health')}
              disabled={loading || !status?.configured}
              className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              Send System Health
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
              <div className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.success ? 'Success' : 'Error'}
              </div>
              <div className="text-gray-800 text-sm mt-1">{testResult.message}</div>
            </div>
          )}
        </div>
      </div>

              <div className="border-t border-[#F23E2E]/20 pt-6">
        <h4 className="text-lg font-asgard text-gray-900 mb-4">Environment Variables</h4>
        <div className="bg-primary-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="text-gray-800">
            <span className="font-mono">MATTERMOST_WEBHOOK_URL</span> - Webhook URL for simple notifications
          </div>
          <div className="text-gray-800">
            <span className="font-mono">MATTERMOST_BOT_TOKEN</span> - Bot token for API access
          </div>
          <div className="text-gray-800">
            <span className="font-mono">MATTERMOST_SERVER_URL</span> - Collaboration Suite server URL
          </div>
          <div className="text-gray-800">
            <span className="font-mono">MATTERMOST_CHANNEL_ID</span> - Default channel ID
          </div>
          <div className="text-gray-800">
            <span className="font-mono">MATTERMOST_TEAM_ID</span> - Default team ID
          </div>
        </div>
      </div>
    </GlassCard>
  );
} 