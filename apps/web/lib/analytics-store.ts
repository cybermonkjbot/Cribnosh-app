// Simple file-based analytics store for demo (replace with DB for production)
import fs from 'fs/promises';
import path from 'path';
import { ErrorFactory, ErrorCode } from '@/lib/errors';

const DATA_DIR = path.resolve(process.cwd(), 'analytics-data');
const EVENTS_FILE = (page: string) => path.join(DATA_DIR, `${encodeURIComponent(page)}.json`);

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveAnalyticsEvent(event: any) {
  await ensureDir();
  const { page } = event;
  if (!page) throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Missing page');
  const file = EVENTS_FILE(page);
  let events = [];
  try {
    const raw = await fs.readFile(file, 'utf-8');
    events = JSON.parse(raw);
  } catch {}
  events.push({ ...event, timestamp: Date.now() });
  await fs.writeFile(file, JSON.stringify(events), 'utf-8');
}

export async function getHeatmapData(page: string) {
  await ensureDir();
  const file = EVENTS_FILE(page);
  let events = [];
  try {
    const raw = await fs.readFile(file, 'utf-8');
    events = JSON.parse(raw);
  } catch {}
  // Aggregate mousemove/click events for heatmap
  const points: Record<string, number> = {};
  for (const e of events) {
    if (e.type === 'mousemove' || e.type === 'click') {
      const key = `${Math.round(e.x)},${Math.round(e.y)}`;
      points[key] = (points[key] || 0) + 1;
    }
  }
  return points;
}
