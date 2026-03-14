/**
 * Analytics tracking utility
 * Simple event tracking for user behavior analysis
 */

// Analytics event types
export type AnalyticsEvent =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'spot_view'
  | 'spot_create'
  | 'order_create'
  | 'order_complete'
  | 'user_signup'
  | 'user_login';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface QueuedEvent {
  event: AnalyticsEvent;
  properties: EventProperties;
  timestamp: number;
}

// Simple in-memory queue for events before analytics is ready
const eventQueue: QueuedEvent[] = [];

// Batch queue for sending events to backend
const batchQueue: QueuedEvent[] = [];
const BATCH_SIZE = 5;
const BATCH_INTERVAL = 5000; // 5 seconds

let analyticsInitialized = false;
let userId: string | null = null;
let sessionId: string | null = null;
let batchTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Generate a session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  if (!sessionId) {
    // Try to get existing session from sessionStorage
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      sessionId = stored;
    } else {
      // Generate new session ID
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
}

/**
 * Send batched events to backend
 */
async function flushBatch(): Promise<void> {
  if (batchQueue.length === 0) return;

  const events = [...batchQueue];
  batchQueue.length = 0; // Clear queue

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const referrer = typeof document !== 'undefined' ? document.referrer : undefined;

  // Send each event
  const promises = events.map(async ({ event, properties, timestamp }) => {
    const payload = {
      event,
      properties,
      userId,
      sessionId: getSessionId(),
      pathname,
      referrer,
      timestamp,
    };

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      // Silently fail - analytics should not affect user experience
      if (process.env.NODE_ENV === 'development') {
        console.error('[Analytics] Failed to send event:', error);
      }
    }
  });

  await Promise.all(promises);
}

/**
 * Queue event for batch sending
 */
function queueForBatch(event: AnalyticsEvent, properties: EventProperties, timestamp: number): void {
  batchQueue.push({ event, properties, timestamp });

  // Flush if batch is full
  if (batchQueue.length >= BATCH_SIZE) {
    if (batchTimeoutId) {
      clearTimeout(batchTimeoutId);
      batchTimeoutId = null;
    }
    flushBatch();
    return;
  }

  // Schedule flush
  if (!batchTimeoutId) {
    batchTimeoutId = setTimeout(() => {
      batchTimeoutId = null;
      flushBatch();
    }, BATCH_INTERVAL);
  }
}

/**
 * Initialize analytics
 * Called once when the app loads
 */
export function initAnalytics(): void {
  if (analyticsInitialized) return;

  analyticsInitialized = true;
  getSessionId(); // Ensure session ID is created

  // Flush any queued events
  while (eventQueue.length > 0) {
    const evt = eventQueue.shift();
    if (evt) {
      sendEvent(evt.event, evt.properties, evt.timestamp);
    }
  }

  // Auto-track page views if enabled
  if (typeof window !== 'undefined') {
    trackPageView(window.location.pathname);
  }
}

/**
 * Identify a user
 * Called when user logs in
 */
export function identifyUser(id: string, traits?: EventProperties): void {
  userId = id;

  if (typeof window !== 'undefined') {
    console.log('[Analytics] Identify user:', id, traits);
  }
}

/**
 * Track an event
 * Main tracking function
 */
export function track(event: AnalyticsEvent, properties?: EventProperties): void {
  const timestamp = Date.now();

  if (!analyticsInitialized) {
    eventQueue.push({ event, properties: properties || {}, timestamp });
    return;
  }

  sendEvent(event, properties || {}, timestamp);
}

/**
 * Track a page view
 * Automatically called on route changes
 */
export function trackPageView(path: string, properties?: EventProperties): void {
  track('page_view', {
    path,
    title: typeof document !== 'undefined' ? document.title : undefined,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    ...properties,
  });
}

/**
 * Track a button click
 * Convenience wrapper for button tracking
 */
export function trackButtonClick(buttonName: string, properties?: EventProperties): void {
  track('button_click', {
    button: buttonName,
    ...properties,
  });
}

/**
 * Send event to analytics endpoint
 */
function sendEvent(event: AnalyticsEvent, properties: EventProperties, timestamp: number): void {
  const payload = {
    event,
    properties: {
      ...properties,
      userId,
      timestamp: new Date(timestamp).toISOString(),
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', payload);
  }

  // Send to backend
  queueForBatch(event, properties, timestamp);
}

/**
 * Hook for React components to track page views
 */
export function usePageTracking(pageName: string, properties?: EventProperties): void {
  if (typeof window !== 'undefined') {
    trackPageView(pageName, properties);
  }
}
