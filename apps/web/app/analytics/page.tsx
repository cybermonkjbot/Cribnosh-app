"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Heatmap } from '@/components/analytics';

const DynamicHeatmap = dynamic(() => import('@/components/analytics/Heatmap').then(m => m.Heatmap), { ssr: false });

export default function AnalyticsDashboard() {
  const [page, setPage] = useState('/');
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Optionally, auto-detect or let user select page and dimensions

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics Heatmap Dashboard</h1>
      <p className="mb-4 text-gray-600">You can use the <code>{'<Heatmap />'}</code> component on any page to visualize user interaction data. Example below shows the chef application page heatmap.</p>
      <div className="mb-4">
        <label className="mr-2">Page:</label>
        <input
          value={page}
          onChange={e => setPage(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>
      <div style={{ position: 'relative', width: dimensions.width, height: dimensions.height, border: '1px solid #eee' }}>
        <DynamicHeatmap page={page} width={dimensions.width} height={dimensions.height} />
      </div>
    </div>
  );
}
