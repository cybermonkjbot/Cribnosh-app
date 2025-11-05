import { Clock, BarChart3 } from 'lucide-react';
import TimelogsViewer from '@/components/admin/TimelogsViewer';

export default function AdminTimelogsPage() {
  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3 flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
            Time Logs Management
          </h1>
          <p className="text-gray-700 font-satoshi text-lg">
            Monitor and analyze staff time tracking and work patterns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium font-satoshi text-primary-700">Analytics Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timelogs Viewer Component */}
      <TimelogsViewer />
    </div>
  );
} 