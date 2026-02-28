/**
 * Global Type Declarations
 * Extends Window interface for tracking pixels and GTM
 */

declare global {
  interface Window {
    // GTM dataLayer
    dataLayer: Record<string, unknown>[];

    // Meta Pixel
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;

    // Google Tag
    gtag?: (...args: unknown[]) => void;
  }
}

export { };

