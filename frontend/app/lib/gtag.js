// app/lib/gtag.js
// Small GA4 helper for client-side pageview and event tracking

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Send a page_view to GA4
export function pageview(url) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('config', GA_ID, { page_path: url });
  } catch (e) {
    // swallow errors (non-fatal)
    // console.debug('gtag pageview error', e);
  }
}

// Send a named event to GA4. `params` is an object of additional fields.
// Example: event('select_content', { content_type: 'product', item_id: 'sku-123' })
export function event(action, params = {}) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('event', action, params);
  } catch (e) {
    // console.debug('gtag event error', e);
  }
}

export default { GA_ID, pageview, event };
