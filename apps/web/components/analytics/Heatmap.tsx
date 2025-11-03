import React, { useEffect, useRef } from 'react';

interface HeatmapProps {
  page: string;
  width: number;
  height: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ page, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/analytics/heatmap?page=${encodeURIComponent(page)}`, {
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
      });
      const { data } = await res.json();
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Draw heatmap points
      Object.entries(data).forEach(([key, count]) => {
        const [x, y] = key.split(',').map(Number);
        const intensity = Math.min(1, (count as number) / 20);
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 59, 48, ${intensity * 0.5})`;
        ctx.fill();
      });
    }
    fetchData();
  }, [page, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 100 }}
    />
  );
};
