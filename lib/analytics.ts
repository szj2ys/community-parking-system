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

// Simple in-memory queue for events before analytics is ready
const eventQueue: Array<{ event: AnalyticsEvent; properties: EventProperties; timestamp: number }> = [];

let analyticsInitialized = false;
let userId: string | null = null;

/**
 * Initialize analytics
 * Called once when the app loads
 */
export function initAnalytics(): void {
  if (analyticsInitialized) return;

  analyticsInitialized = true;

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
 * Currently logs to console; replace with actual analytics service
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

  // TODO: Send to actual analytics service
  // Example: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(payload) })
}

/**
 * Hook for React components to track page views
 */
export function usePageTracking(pageName: string, properties?: EventProperties): void {
  if (typeof window !== 'undefined') {
    trackPageView(pageName, properties);
  }
}
