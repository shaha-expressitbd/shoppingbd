// gtm.ts
import { TCartItem } from "@/lib/features/cart/cartSlice";
import type { Product, Variant } from "@/types/product";

// Types for enhanced tracking
interface GtmEcommerceItem {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price: number;
  currency: string;
  quantity?: number;
  item_variant?: string;
  item_list_name?: string;
  item_list_id?: string;
  index?: number;
}

interface TrackingContext {
  external_id: string;
  click_id: string | null;
  visitor_ip: string | null;
  user_agent: string;
  session_id: string;
  first_visit: boolean;
}

interface ClickData {
  id: string;
  timestamp: string;
  url: string;
  referrer: string;
  source: string;
}

interface PageData {
  url: string;
  path: string;
  search: string;
  title: string;
  referrer: string;
}

interface DeviceData {
  screen_resolution: string;
  viewport_size: string;
  color_depth: number;
  device_pixel_ratio: number;
  browser_language: string;
  languages: string[];
  device_memory?: number;
  hardware_concurrency?: number;
  connection_type?: string;
  save_data?: boolean;
  timezone: string;
  do_not_track: boolean | string;
}

interface TimingData {
  time_since_page_load: number;
  navigation_type?: string;
}

interface VisitorData {
  external_id: string;
  session_id: string;
  first_visit: boolean;
  visitor_ip: string | null;
}

// Global tracking context
let trackingContext: TrackingContext | null = null;
let ipDetectionComplete = false;

// Initialize tracking context
export function initializeTracking(): void {
  if (typeof window === "undefined") return;

  const firstVisit = !localStorage.getItem("external_id");

  trackingContext = {
    external_id: getOrCreateExternalId(),
    click_id: extractClickIdFromUrl(),
    visitor_ip: null, // Will be populated asynchronously
    user_agent: window.navigator.userAgent,
    session_id: generateSessionId(),
    first_visit: firstVisit,
  };

  // Get IP address asynchronously using ifconfig.me
  getVisitorIp()
    .then((ip) => {
      if (trackingContext && ip) {
        trackingContext.visitor_ip = ip;
        ipDetectionComplete = true;

        // Track IP retrieval for debugging
        trackEvent(
          "visitor_ip_retrieved",
          {
            visitor_data: getVisitorData(),
          },
          false
        );
      }
    })
    .catch((error) => {
      console.warn("IP detection failed:", error);
      ipDetectionComplete = true;
    });

  // Store UTM parameters
  storeUtmParams();

  // Store Facebook click ID if present
  storeClickId();

  // Track session start
  trackEvent(
    "session_start",
    {
      visitor_data: getVisitorData(),
      click_data: getClickData() ? { click_data: getClickData() } : undefined,
    },
    false
  );
}

// External ID management
export function getOrCreateExternalId(): string {
  if (typeof window === "undefined") return "server-side";

  try {
    let externalId = localStorage.getItem("external_id");

    if (!externalId) {
      externalId = generateUUID();
      localStorage.setItem("external_id", externalId);
      localStorage.setItem("first_visit_date", new Date().toISOString());

      // Track new visitor
      trackEvent(
        "new_visitor",
        {
          visitor_data: {
            external_id: externalId,
            first_visit: true,
            visitor_ip: null,
            session_id: generateSessionId(),
          },
        },
        false
      );
    }

    return externalId;
  } catch (error) {
    console.warn("Failed to access localStorage, generating session external_id");
    return generateSessionId();
  }
}

// Click ID extraction and storage
export function extractClickIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);

  // Facebook Click ID parameters
  const fbClickId = urlParams.get("fbclid");

  // Other potential click ID parameters
  const gclid = urlParams.get("gclid");
  const ttclid = urlParams.get("ttclid");
  const msclkid = urlParams.get("msclkid");

  return fbClickId || gclid || ttclid || msclkid || null;
}

export function storeClickId(): void {
  if (typeof window === "undefined") return;

  const clickId = extractClickIdFromUrl();
  if (clickId) {
    try {
      localStorage.setItem("last_click_id", clickId);
      sessionStorage.setItem("session_click_id", clickId);

      // Determine source based on click ID pattern
      let source = "unknown";
      if (clickId.startsWith("FB")) source = "facebook";
      else if (clickId.startsWith("GCLID")) source = "google";
      else if (clickId.includes("tt_")) source = "tiktok";
      else if (clickId.includes("msclkid")) source = "microsoft";

      // Also store with timestamp and metadata
      const clickData: ClickData = {
        id: clickId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        source: source,
      };

      localStorage.setItem("click_data", JSON.stringify(clickData));

      // Track click ID captured
      trackEvent(
        "click_id_captured",
        {
          visitor_data: getVisitorData(),
          click_data: clickData,
        },
        false
      );
    } catch (error) {
      console.warn("Failed to store click ID:", error);
    }
  }
}

export function getStoredClickId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    // Prefer session click ID, then persistent
    return sessionStorage.getItem("session_click_id") || localStorage.getItem("last_click_id");
  } catch {
    return null;
  }
}

export function getClickData(): ClickData | null {
  if (typeof window === "undefined") return null;

  try {
    const clickData = localStorage.getItem("click_data");
    return clickData ? JSON.parse(clickData) : null;
  } catch {
    return null;
  }
}

// Visitor IP collection using ifconfig.me
export async function getVisitorIp(): Promise<string | null> {
  try {
    const response = await fetch("https://ifconfig.me/ip", {
      method: "GET",
      headers: {
        Accept: "text/plain",
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const ip = await response.text();
      // Validate IP format (basic validation)
      if (isValidIp(ip.trim())) {
        return ip.trim();
      } else {
        console.warn("Invalid IP format received:", ip);
        return null;
      }
    } else {
      console.warn("ifconfig.me responded with status:", response.status);
      return null;
    }
  } catch (error) {
    console.warn("Failed to get IP from ifconfig.me:", error);

    // Fallback to ipify.org
    try {
      const fallbackResponse = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(3000),
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (isValidIp(data.ip)) {
          return data.ip;
        }
      }
    } catch (fallbackError) {
      console.warn("Fallback IP service also failed:", fallbackError);
    }

    return null;
  }
}

// Basic IP validation
function isValidIp(ip: string): boolean {
  // Basic IPv4 and IPv6 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (ipv4Regex.test(ip)) {
    // Validate IPv4 octets
    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Regex.test(ip);
}

// Enhanced buildGtmItem with clean structure
export function buildGtmItem(
  product: Product,
  variant?: Variant | null,
  quantity: number = 1,
  listName?: string,
  listId?: string,
  index?: number
): GtmEcommerceItem {
  const price = variant?.selling_price ?? product.variantsId?.[0]?.selling_price;
  const itemName = variant ? `${product.name} - ${variant.name}` : product.name;

  const item: GtmEcommerceItem = {
    item_id: variant?._id ?? product._id,
    item_name: itemName,
    item_brand: product.brand?.name,
    item_category: product.sub_category?.[0]?.name,
    price: Number(price) || 0,
    currency: product.currency,
    quantity,
    item_variant: variant?.name,
    ...(listName && { item_list_name: listName }),
    ...(listId && { item_list_id: listId }),
    ...(typeof index === "number" && { index }),
  };

  return item;
}

// Enhanced event tracking with clean structure
export const trackEvent = (eventName: string, eventData: Record<string, any> = {}, requireConsent: boolean = false) => {
  if (typeof window === "undefined" || !window.dataLayer) {
    console.warn("GTM not available - event not tracked:", eventName);
    return;
  }

  if (requireConsent && !hasTrackingConsent()) {
    console.log("Consent required but not granted - event not tracked:", eventName);
    return;
  }

  // Clear previous ecommerce object
  if (eventData.ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }

  // Build clean data structure
  const cleanData = buildCleanEventData(eventName, eventData);

  // Push to data layer
  window.dataLayer.push(cleanData);

  // Log for development
  if (process.env.NODE_ENV === "development") {
    console.log("GTM Event:", eventName, cleanData);
  }
};

// Build clean event data structure without duplicates
function buildCleanEventData(eventName: string, eventData: Record<string, any>): Record<string, any> {
  const baseData = {
    event: eventName,
    timestamp: new Date().toISOString(),
  };

  // Get all data components
  const technicalData = {
    device_data: getDeviceData(),
    timing_data: getTimingData(),
    page_data: getPageData(),
  };

  const visitorData = {
    visitor_data: getVisitorData(),
  };

  const clickData = getClickData();
  const utmParams = getUtmParams();

  // Build clean event-specific data (remove duplicates from ecommerce items)
  const cleanEventData = { ...eventData };

  // Remove external_id and click_id from ecommerce items if present
  if (cleanEventData.ecommerce?.items) {
    cleanEventData.ecommerce.items = cleanEventData.ecommerce.items.map((item: any) => {
      const { external_id, click_id, ...cleanItem } = item;
      return cleanItem;
    });
  }

  // Remove purchase_data if it duplicates ecommerce
  if (cleanEventData.purchase_data && cleanEventData.ecommerce) {
    const { purchase_data, ...rest } = cleanEventData;
    return {
      ...baseData,
      ...technicalData,
      ...visitorData,
      ...(clickData && { click_data: clickData }),
      ...(Object.keys(utmParams).length > 0 && { utm_params: utmParams }),
      ...rest,
    };
  }

  // Merge all data
  return {
    ...baseData,
    ...technicalData,
    ...visitorData,
    ...(clickData && { click_data: clickData }),
    ...(Object.keys(utmParams).length > 0 && { utm_params: utmParams }),
    ...cleanEventData,
  };
}

// Get device data
export function getDeviceData(): DeviceData {
  if (typeof window === "undefined") return {} as DeviceData;

  const screen = window.screen;
  const navigator = window.navigator;
  const connection = (window as any).connection;

  return {
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    color_depth: screen.colorDepth,
    device_pixel_ratio: window.devicePixelRatio || 1,
    browser_language: navigator.language,
    languages: navigator.languages as string[],
    device_memory: (navigator as any).deviceMemory,
    hardware_concurrency: (navigator as any).hardwareConcurrency,
    connection_type: connection?.effectiveType,
    save_data: connection?.saveData,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    do_not_track: navigator.doNotTrack === "1",
  };
}

// Get timing data
export function getTimingData(): TimingData {
  if (typeof window === "undefined") return { time_since_page_load: 0 };

  return {
    time_since_page_load: performance.now(),
    navigation_type: (() => {
      const navEntry = performance.getEntriesByType("navigation")[0];
      if (navEntry && "type" in navEntry) {
        return (navEntry as PerformanceNavigationTiming).type;
      }
      return undefined;
    })(),
  };
}

// Get page data
export function getPageData(): PageData {
  if (typeof window === "undefined") return {} as PageData;

  return {
    url: window.location.href,
    path: window.location.pathname,
    search: window.location.search,
    title: document.title,
    referrer: document.referrer,
  };
}

// Get visitor data
export function getVisitorData(): VisitorData {
  const context = getTrackingContext();
  return {
    external_id: context?.external_id || "unknown",
    session_id: context?.session_id || "unknown",
    first_visit: context?.first_visit || false,
    visitor_ip: context?.visitor_ip || null,
  };
}

// Get complete tracking context
export function getTrackingContext(): TrackingContext | null {
  if (!trackingContext) {
    initializeTracking();
  }

  // Ensure we have the latest click ID and IP
  if (trackingContext) {
    const currentClickId = extractClickIdFromUrl();
    if (currentClickId && currentClickId !== trackingContext.click_id) {
      trackingContext.click_id = currentClickId;
      storeClickId();
    }
  }

  return trackingContext;
}

// Wait for IP detection to complete (useful for critical events)
export async function waitForIpDetection(): Promise<void> {
  if (ipDetectionComplete) return;

  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (ipDetectionComplete) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 3 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 3000);
  });
}

// Enhanced specific event helpers with clean structure
export const trackPageView = (path: string) => {
  trackEvent("page_view", {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
};

export const trackProductView = (product: Product, variant?: Variant | null) => {
  const item = buildGtmItem(product, variant);

  if (!product) return;

  trackEvent("view_item", {
    ecommerce: {
      currency: product.currency,
      value: item.price * (item.quantity || 1),
      items: [item],
    },
  });
};

export const trackAddToCart = (item: TCartItem) => {
  trackEvent("add_to_cart", {
    ecommerce: {
      currency: item.currency || "BDT",
      value: item.price * item.quantity,
      items: [
        {
          item_id: item._id,
          item_name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          item_variant: item.variantLabel,
          currency: item.currency || "BDT",
        },
      ],
    },
  });
};

export const trackRemoveFromCart = (item: TCartItem) => {
  trackEvent("remove_from_cart", {
    ecommerce: {
      currency: item.currency || "BDT",
      value: item.price * item.quantity,
      items: [
        {
          item_id: item._id,
          item_name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          item_variant: item.variantLabel,
          currency: item.currency || "BDT",
        },
      ],
    },
  });
};

export const trackBeginCheckout = (items: TCartItem[], totalValue: number) => {
  trackEvent("begin_checkout", {
    ecommerce: {
      currency: items[0]?.currency || "BDT",
      value: totalValue,
      items: items.map((item) => ({
        item_id: item._id,
        item_name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        item_variant: item.variantLabel,
        currency: item.currency || "BDT",
      })),
    },
  });
};

// Enhanced purchase tracking with clean structure
export const trackPurchase = async (
  transactionId: string,
  items: TCartItem[],
  totalValue: number,
  shippingValue: number = 0,
  customerName: string,
  customerPhone?: string,
  deliveryArea?: string,
  deliveryAddress?: string,
  paymentMethod?: string,
  coupon?: string
) => {
  if (!items.length) {
    console.error("No items provided for purchase tracking");
    return;
  }

  // Wait for IP detection to complete for purchase events
  await waitForIpDetection();

  trackEvent("purchase", {
    ecommerce: {
      transaction_id: transactionId,
      value: totalValue,
      tax: 0,
      shipping: shippingValue,
      currency: items[0]?.currency || "BDT",
      coupon: coupon,
      payment_method: paymentMethod,
      customer_details: {
        name: customerName,
        phone: customerPhone,
        delivery_area: deliveryArea,
        delivery_address: deliveryAddress,
      },
      items: items.map((item) => ({
        item_id: item._id,
        item_name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        item_variant: item.variantLabel,
        currency: item.currency || "BDT",
      })),
    },
  });
};

export const trackUpdateItemQuantity = (item: TCartItem, newQuantity: number) => {
  trackEvent("update_item_quantity", {
    ecommerce: {
      currency: item.currency || "BDT",
      value: item.price * newQuantity,
      items: [
        {
          item_id: item._id,
          item_name: item.name,
          price: Number(item.price),
          quantity: newQuantity,
          item_variant: item.variantLabel,
          currency: item.currency || "BDT",
        },
      ],
    },
  });
};

export const trackViewRelatedItemList = (
  items: GtmEcommerceItem[],
  listId: string,
  listName: string = "Related Products"
) => {
  trackEvent("view_related_item_list", {
    ecommerce: {
      item_list_id: listId,
      item_list_name: listName,
      items: items,
    },
  });
};

// Utility functions
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Consent management utilities
export const hasTrackingConsent = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("tracking_consent") === "granted" || localStorage.getItem("cookie_consent") === "granted"
    );
  } catch {
    return false;
  }
};

export const setTrackingConsent = (
  granted: boolean,
  settings = {
    analytics: true,
    advertising: true,
    functional: true,
  }
) => {
  try {
    localStorage.setItem("tracking_consent", granted ? "granted" : "denied");

    // Update GTM consent settings
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "consent_update",
        analytics_storage: settings.analytics && granted ? "granted" : "denied",
        ad_storage: settings.advertising && granted ? "granted" : "denied",
        functionality_storage: settings.functional && granted ? "granted" : "denied",
      });

      // Also update via gtag if available
      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: settings.analytics && granted ? "granted" : "denied",
          ad_storage: settings.advertising && granted ? "granted" : "denied",
          functionality_storage: settings.functional && granted ? "granted" : "denied",
        });
      }
    }

    // Track the consent event
    trackEvent(
      granted ? "consent_granted" : "consent_denied",
      {
        consent_settings: settings,
      },
      false // Don't require consent to track consent events
    );

    return true;
  } catch (e) {
    console.error("Failed to set tracking consent:", e);
    return false;
  }
};

// UTM Parameter Storage
export function storeUtmParams() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];

  utmKeys.forEach((key) => {
    const val = params.get(key);
    if (val) {
      localStorage.setItem(key, val);
      localStorage.setItem(`${key}_first_seen`, new Date().toISOString());
    }
  });

  // Store referrer if not already set
  const currentReferrer = document.referrer;
  if (currentReferrer && !localStorage.getItem("initial_referrer")) {
    localStorage.setItem("initial_referrer", currentReferrer);
    localStorage.setItem("initial_referrer_date", new Date().toISOString());
  }
}

export function getUtmParams() {
  if (typeof window === "undefined") return {};
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];
  const utms: Record<string, string> = {};
  keys.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val) utms[key] = val;
  });
  return utms;
}

// Export tracking context utilities
export function getExternalId(): string | null {
  return getTrackingContext()?.external_id || null;
}

export function getCurrentClickId(): string | null {
  return getTrackingContext()?.click_id || null;
}

export function getVisitorIpAddress(): string | null {
  return getTrackingContext()?.visitor_ip || null;
}

export function getSessionId(): string | null {
  return getTrackingContext()?.session_id || null;
}

// Debug utility
export function debugTrackingInfo() {
  const context = getTrackingContext();
  console.group("GTM Tracking Debug Info");
  console.log("Visitor Data:", getVisitorData());
  console.log("Click Data:", getClickData());
  console.log("Device Data:", getDeviceData());
  console.log("Page Data:", getPageData());
  console.log("UTM Params:", getUtmParams());
  console.log("Consent Granted:", hasTrackingConsent());
  console.log("IP Detection Complete:", ipDetectionComplete);
  console.groupEnd();
}

// Initialize tracking when the module loads
if (typeof window !== "undefined") {
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(initializeTracking, 100);
}

// Export for global access in development
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as any).debugGTM = debugTrackingInfo;
}
