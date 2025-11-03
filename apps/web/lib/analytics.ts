// Analytics client for sending events to backend
type AnalyticsEvent = {
  type: 'pageview' | 'click' | 'mousemove';
  page: string;
  x?: number;
  y?: number;
  extra?: Record<string, any>;
  timestamp?: number;
};

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 2000; // Flush every 2 seconds
const MAX_QUEUE_SIZE = 20; // Maximum events to batch

function flushEvents() {
  if (eventQueue.length === 0) return;
  
  const events = [...eventQueue];
  eventQueue = [];
  
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: events.map(event => ({
        ...event,
        timestamp: event.timestamp || Date.now()
      }))
    }),
  });
}

function queueEvent(event: AnalyticsEvent) {
  event.timestamp = Date.now();
  eventQueue.push(event);

  // Flush if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    if (flushTimeout) clearTimeout(flushTimeout);
    flushEvents();
    return;
  }

  // Schedule flush
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTimeout = null;
      flushEvents();
    }, FLUSH_INTERVAL);
  }
}

// Ensure events are sent before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushEvents);
}

// Helper to track page views - these should be sent immediately
export function trackPageView(page: string) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: [{
        type: 'pageview',
        page,
        timestamp: Date.now()
      }]
    }),
    keepalive: true
  });
}

// Throttle function
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Debounce function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Helper to track clicks (debounced)
export const trackClick = debounce((page: string, x: number, y: number, extra?: Record<string, any>) => {
  queueEvent({ type: 'click', page, x, y, extra });
}, 250);

// Helper to track mouse moves (throttled)
export const trackMouseMove = throttle((page: string, x: number, y: number) => {
  queueEvent({ type: 'mousemove', page, x, y });
}, 500);
