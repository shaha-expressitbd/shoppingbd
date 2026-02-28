// gtm.ts
// Production-Ready GTM-Only Tracking Implementation
// Migrated from womensfashion_nextjs - Clean, no direct Meta Pixel/CAPI calls
// All pixel firing is handled by GTM tags

import { TCartItem } from "@/lib/features/cart/cartSlice";
import { Product, Variant } from "@/types/product";
import { getCustomerSource } from "./sourceTracking";

// ====== TYPE DEFINITIONS ======

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
  discount?: number;
  item_sku?: string;
  item_condition?: string;
  item_availability?: "in_stock" | "out_of_stock";
}

interface CustomerDetails {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  delivery_area?: string;
  zip?: string;
  country?: string;
}

interface UserData {
  external_id: string;
  fbp?: string;
  fbc?: string;
  country: string;
  client_user_agent: string;
  email?: string;
  fn?: string;
  ln?: string;
  ph?: string;
  ct?: string;
  st?: string;
  zp?: string;
  ad?: string;
}

interface PurchaseTrackingParams {
  transactionId: string;
  items: GtmEcommerceItem[] | TCartItem[];
  totalValue: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  customer?: CustomerDetails;
  paymentMethod?: string;
}

interface OrderPlacementParams {
  orderId: string;
  totalValue: number;
  items: TCartItem[];
  paymentMethod: "cod" | "online";
}

// ====== CONSTANTS ======

const PAGE_ROUTES = {
  HOME: { pattern: /^\/$/i, event: "page_view" },
  FLASH_DEALS: { pattern: /^\/flashdeals/, event: "flashdeals_view" },
  SHOP: { pattern: /^\/products\/?$/i, event: "shop_view" },
  NEW_ARRIVALS: { pattern: /^\/products\/(new-arrival|new)/i, event: "new_arrival_view" },
  CAMPAIGN: { pattern: /^\/products\//i, event: "campaign_view" },
  CATEGORY: { pattern: /^\/category\//i, event: "category_view" },
  ABOUT: { pattern: /^\/ourstory/i, event: "about_us_view" },
  CONTACT: { pattern: /^\/contact/i, event: "contact_view" },
} as const;

const DEFAULT_CURRENCY = "BDT";
const GUEST_FIRST_NAME = "Guest";
const GUEST_LAST_NAME = "Customer";
const STORAGE_KEYS = {
  VISITOR_ID: "gtm_visitor_id",
  CUSTOMER_DATA: "customerData",
  UTM_PARAMS: "utm_params",
  LOG_LEVEL: "gtm_log_level",
  DEBUG_ENABLED: "gtm_debug",
  FBCLID: "meta_fbclid",
  FBC: "meta_fbc",
  CACHED_IP: "cached_visitor_ip",
} as const;

// ====== LOGGER ======

type LogLevel = "error" | "warn" | "info" | "debug";

const DEBUG_CONFIG = {
  enabled:
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEYS.DEBUG_ENABLED) === "true"),
  logLevel: ((typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.LOG_LEVEL) : null) ||
    "info") as LogLevel,
};

namespace GtmLogger {
  const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
  const ICONS = { error: "❌", warn: "⚠️ ", info: "📊", debug: "🐛" } as const;

  function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[DEBUG_CONFIG.logLevel] && DEBUG_CONFIG.enabled;
  }

  export function error(event: string, data?: unknown): void {
    if (shouldLog("error")) {
      console.error(`${ICONS.error} [GTM] ${event}`, data || "");
    }
  }

  export function warn(event: string, data?: unknown): void {
    if (shouldLog("warn")) {
      console.warn(`${ICONS.warn} [GTM] ${event}`, data || "");
    }
  }

  export function info(event: string, data?: unknown): void {
    if (shouldLog("info")) {
      console.log(`${ICONS.info} [GTM] ${event}`, data || "");
    }
  }

  export function debug(event: string, data?: unknown): void {
    if (shouldLog("debug")) {
      console.log(`${ICONS.debug} [GTM] ${event}`, data || "");
    }
  }
}

// ====== STORAGE ABSTRACTION ======

namespace StorageManager {
  const isBrowser = () => typeof window !== "undefined";

  export function get(key: string): string | null {
    if (!isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      GtmLogger.warn("StorageManager.get", `Failed to access ${key}`);
      return null;
    }
  }

  export function set(key: string, value: string): boolean {
    if (!isBrowser()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      GtmLogger.warn("StorageManager.set", `Failed to set ${key}`);
      return false;
    }
  }

  export function getSession(key: string): string | null {
    if (!isBrowser()) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      GtmLogger.warn("StorageManager.getSession", `Failed to access ${key}`);
      return null;
    }
  }

  export function setSession(key: string, value: string): boolean {
    if (!isBrowser()) return false;
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      GtmLogger.warn("StorageManager.setSession", `Failed to set ${key}`);
      return false;
    }
  }
}

// ====== COOKIE MANAGER ======

namespace CookieManager {
  export function get(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      return parts.length === 2 ? parts.pop()?.split(";").shift() : undefined;
    } catch {
      GtmLogger.debug("CookieManager.get", `Failed to read ${name}`);
      return undefined;
    }
  }
}

// ====== VALIDATOR ======

namespace GtmValidator {
  export function isValidPrice(price: unknown): boolean {
    return typeof price === "number" && price >= 0 && isFinite(price);
  }

  export function isValidQuantity(qty: unknown): boolean {
    return typeof qty === "number" && qty > 0 && Number.isInteger(qty);
  }

  export function validateItem(item: unknown): item is GtmEcommerceItem {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;
    return !!(
      obj.item_id &&
      obj.item_name &&
      isValidPrice(obj.price) &&
      obj.currency
    );
  }

  export function validatePurchase(
    params: Partial<PurchaseTrackingParams>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!params.transactionId?.trim()) {
      errors.push("Missing or empty transaction ID");
    }

    if (!Array.isArray(params.items) || params.items.length === 0) {
      errors.push("Items array is empty or missing");
    } else {
      params.items.forEach((item, idx) => {
        if (!("item_id" in item && "item_name" in item && "price" in item)) {
          // TCartItem check
          if (!("_id" in item && "name" in item && "price" in item)) {
            errors.push(`Item ${idx} missing required fields`);
          }
        }
        if ((item as any).price !== undefined && !isValidPrice(Number((item as any).price))) {
          errors.push(`Item ${idx} has invalid price`);
        }
        if ((item as any).quantity !== undefined && !isValidQuantity((item as any).quantity)) {
          errors.push(`Item ${idx} has invalid quantity`);
        }
      });
    }

    if (!isValidPrice(params.totalValue)) {
      errors.push("Invalid total value");
    }

    return { valid: errors.length === 0, errors };
  }
}

// ====== DATA COLLECTION HELPERS ======

namespace VisitorData {
  export function getVisitorId(): string {
    if (typeof window === "undefined") return "unknown";

    let vid = StorageManager.get(STORAGE_KEYS.VISITOR_ID);
    if (!vid) {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        vid = crypto.randomUUID();
      } else {
        // Fallback for non-secure contexts where crypto is entirely unavailable
        vid = "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
          (
            Number(c) ^
            (Math.floor(Math.random() * 256) & (15 >> (Number(c) / 4)))
          ).toString(16)
        );
      }
      StorageManager.set(STORAGE_KEYS.VISITOR_ID, vid);
    }
    return vid;
  }
}

// ====== META CLICK ID TRACKING ======

namespace MetaClickTracking {
  /**
   * Capture fbclid from URL params and construct _fbc cookie if missing.
   * Should be called on every page load.
   *
   * _fbc format: fb.1.{timestamp}.{fbclid}
   * See: https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc
   */
  export function captureFbclid(): void {
    if (typeof window === "undefined") return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fbclid = urlParams.get("fbclid");

      if (fbclid) {
        // Store raw fbclid in localStorage (persists across sessions)
        StorageManager.set(STORAGE_KEYS.FBCLID, fbclid);
        GtmLogger.info("MetaClickTracking", `Captured fbclid: ${fbclid.substring(0, 20)}...`);

        // Read the _fbc cookie (set by Facebook Pixel)
        const existingFbc = CookieManager.get("_fbc");
        if (existingFbc) {
          // Pixel already set _fbc — mirror it to localStorage as backup
          StorageManager.set(STORAGE_KEYS.FBC, existingFbc);
          GtmLogger.debug("MetaClickTracking", `_fbc cookie exists (Pixel-set): ${existingFbc.substring(0, 30)}...`);
        } else {
          // Pixel hasn't set _fbc yet — construct a fallback value in localStorage only
          // We do NOT write a cookie to avoid conflicting with Facebook Pixel's cookie management
          const constructedFbc = `fb.1.${Date.now()}.${fbclid}`;
          StorageManager.set(STORAGE_KEYS.FBC, constructedFbc);
          GtmLogger.info("MetaClickTracking", `No _fbc cookie from Pixel, stored fallback in localStorage: ${constructedFbc.substring(0, 30)}...`);
        }
      }
    } catch (error) {
      GtmLogger.error("MetaClickTracking.captureFbclid", error);
    }
  }

  /**
   * Get the best available _fbc value.
   * Priority: cookie > localStorage > undefined
   */
  export function getFbc(): string | undefined {
    return CookieManager.get("_fbc") || StorageManager.get(STORAGE_KEYS.FBC) || undefined;
  }

  /**
   * Get the raw fbclid value from localStorage.
   */
  export function getFbclid(): string | undefined {
    return StorageManager.get(STORAGE_KEYS.FBCLID) || undefined;
  }

  /**
   * Get the _fbp cookie value.
   */
  export function getFbp(): string | undefined {
    return CookieManager.get("_fbp") || undefined;
  }
}

// ====== IP ADDRESS TRACKER ======

namespace IpTracker {
  /**
   * Fetch visitor IP from a free API and cache it in sessionStorage.
   * Only fetches once per session to avoid unnecessary API calls.
   */
  export async function fetchAndCacheIp(): Promise<void> {
    if (typeof window === "undefined") return;

    // Already cached this session?
    const cached = StorageManager.getSession(STORAGE_KEYS.CACHED_IP);
    if (cached) {
      GtmLogger.debug("IpTracker", `Using cached IP: ${cached}`);
      return;
    }

    try {
      const response = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000), // 5s timeout
      });
      if (response.ok) {
        const data = await response.json();
        if (data.ip) {
          StorageManager.setSession(STORAGE_KEYS.CACHED_IP, data.ip);
          GtmLogger.info("IpTracker", `Fetched and cached IP: ${data.ip}`);
        }
      }
    } catch (error) {
      // Non-critical — silently fail. IP matching is best-effort.
      GtmLogger.debug("IpTracker", "Failed to fetch IP (non-critical)");
    }
  }

  /**
   * Get the cached IP address.
   */
  export function getIp(): string | undefined {
    return StorageManager.getSession(STORAGE_KEYS.CACHED_IP) || undefined;
  }
}

namespace CustomerDataManager {
  export function extract(): Partial<UserData> {
    const stored = StorageManager.get(STORAGE_KEYS.CUSTOMER_DATA);
    return stored ? parseCustomerData(stored) : getGuestFallback();
  }

  function parseCustomerData(json: string): Partial<UserData> {
    try {
      return JSON.parse(json) as Partial<UserData>;
    } catch (error) {
      GtmLogger.error("CustomerDataManager.parseCustomerData", error);
      return getGuestFallback();
    }
  }

  function getGuestFallback(): Partial<UserData> {
    return {
      fn: GUEST_FIRST_NAME,
      ln: GUEST_LAST_NAME,
    };
  }
}

namespace BrowserIdentifiers {
  export function collect(): {
    external_id: string;
    fbp?: string;
    fbc?: string;
    user_agent: string;
  } {
    return {
      external_id: VisitorData.getVisitorId(),
      fbp: CookieManager.get("_fbp"),
      fbc: CookieManager.get("_fbc"),
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
  }
}

// ====== ECOMMERCE PAYLOAD BUILDER ======

namespace EcommercePayloadBuilder {
  /**
   * Build user_data object (FB Pixel advanced matching format)
   * GTM reads: user_data.ct, user_data.ad, user_data.external_id, etc.
   */
  export function buildUserData(): UserData {
    const browser = BrowserIdentifiers.collect();
    const customer = CustomerDataManager.extract();

    return {
      external_id: browser.external_id,
      fbp: browser.fbp,
      fbc: browser.fbc,
      country: "bd",
      client_user_agent: browser.user_agent,
      ...(customer.fn && { fn: customer.fn }),
      ...(customer.ln && { ln: customer.ln }),
      ...(customer.ph && { ph: customer.ph }),
      ...(customer.ct && { ct: customer.ct }),
      ...(customer.st && { st: customer.st }),
      ...(customer.zp && { zp: customer.zp }),
      ...(customer.ad && { ad: customer.ad }),
    };
  }

  /**
   * Build the "user" object for GTM variables that read from user.* paths
   */
  export function buildUserObject(): Record<string, unknown> {
    const customer = CustomerDataManager.extract();
    const isBrowser = typeof window !== "undefined";
    const hasNavigator = typeof navigator !== "undefined";
    const hasScreen = typeof screen !== "undefined";

    return {
      email: customer.email || undefined,
      country: "bd",
      device: isBrowser ? (window.innerWidth <= 768 ? "mobile" : "desktop") : undefined,
      platform: hasNavigator ? navigator.platform : undefined,
      screen: hasScreen
        ? { height: screen.height, width: screen.width }
        : undefined,
      location: { lat: undefined, lng: undefined },
    };
  }

  /**
   * Build customer_details for ecommerce.customer_details.* path
   */
  export function buildCustomerDetails(): Record<string, string> | undefined {
    const customer = CustomerDataManager.extract();
    const name = [customer.fn, customer.ln].filter(Boolean).join(" ");
    const phone = customer.ph;

    if (!name && !phone) return undefined;

    return {
      ...(name && { name }),
      ...(phone && { phone }),
    };
  }

  /**
   * Safely convert any value to a valid number.
   * Returns 0 for NaN, undefined, null, or non-finite values.
   */
  function safeNumber(val: unknown): number {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  }

  export function buildEcommerceEvent(
    items: TCartItem[] | GtmEcommerceItem[],
    totalValue: number,
    extras?: Record<string, unknown>
  ): Record<string, unknown> {
    const normalizedItems = items.map(normalizeItem);
    const customerDetails = buildCustomerDetails();
    const safeValue = safeNumber(totalValue);

    return {
      currency: DEFAULT_CURRENCY,
      value: safeValue > 0 ? safeValue : safeNumber(normalizedItems.reduce((s, i) => s + i.price * i.quantity, 0)),
      items: normalizedItems,
      ...(customerDetails && { customer_details: customerDetails }),
      ...extras,
    };
  }

  function normalizeItem(
    item: TCartItem | GtmEcommerceItem
  ): Record<string, unknown> & { price: number; quantity: number } {
    if ("_id" in item) {
      // TCartItem
      return {
        item_id: item._id,
        item_name: item.name,
        price: safeNumber(item.price),
        currency: (item as any).currency || DEFAULT_CURRENCY,
        quantity: item.quantity || 1,
        ...(item.variantLabel && { item_variant: item.variantLabel }),
        ...((item as any).category && { item_category: (item as any).category }),
        ...((item as any).brand && { item_brand: (item as any).brand }),
      };
    }
    // GtmEcommerceItem
    return {
      item_id: item.item_id,
      item_name: item.item_name,
      price: safeNumber(item.price),
      currency: item.currency || DEFAULT_CURRENCY,
      quantity: item.quantity ?? 1,
      ...(item.item_variant && { item_variant: item.item_variant }),
      ...(item.item_category && { item_category: item.item_category }),
      ...(item.item_brand && { item_brand: item.item_brand }),
    };
  }
}

// ====== DATALAYER PUSH ======

function pushToDataLayer(eventName: string, data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];

  // Clear ecommerce object before pushing new ecommerce data
  if (data.ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }

  // Build all 3 user data path groups for GTM variable alignment
  const userData = EcommercePayloadBuilder.buildUserData();
  const userObject = EcommercePayloadBuilder.buildUserObject();
  const browser = BrowserIdentifiers.collect();

  // Add customer source
  const customerSource = getCustomerSource();

  const payload: Record<string, unknown> = {
    event: eventName,
    ...data,
    // Path Group 1: user_data.* (FB advanced matching + city/address)
    user_data: userData,
    // Path Group 2: user.* (email, country, device, platform, screen, location)
    user: userObject,
    // Path Group 3: visitor_data.* (external_id, visitor_ip)
    visitor_data: {
      external_id: browser.external_id,
    },
    // Customer source tracking
    customer_source: customerSource,
  };

  window.dataLayer.push(payload);
  GtmLogger.info(eventName, payload);
}

// ====== PAGE TRACKING ======

function getPageEvent(path: string): string | null {
  for (const route of Object.values(PAGE_ROUTES)) {
    if (route.pattern.test(path)) {
      return route.event;
    }
  }
  return null;
}

/**
 * Track page view with automatic event mapping based on route
 */
export function trackPageView(
  path: string,
  title?: string,
  location?: string
): void {
  if (typeof window === "undefined") return;

  const eventName = getPageEvent(path);
  if (!eventName) return;

  pushToDataLayer(eventName, {
    page_path: path,
    page_title: title || (typeof document !== "undefined" ? document.title : ""),
    page_location: location || (typeof window !== "undefined" ? window.location.href : ""),
  });
}

// ====== PRODUCT BROWSING EVENTS ======

/**
 * Track when a product is viewed
 */
export function trackProductView(product: Product, variant?: Variant | null): void {
  if (!product) return;

  const item = buildGtmItem(product, variant);

  pushToDataLayer("ViewContent", {
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent([item], item.price),
  });
}

/**
 * Track when a list of related products is viewed.
 * Accepts either Product[] or pre-built GtmEcommerceItem[].
 */
export function trackViewRelatedItemList(
  items: Product[] | GtmEcommerceItem[],
  listId: string
): void {
  if (!items || items.length === 0) return;

  // Check if items are Product[] or GtmEcommerceItem[]
  const isProductArray = "_id" in items[0] && "name" in items[0] && "variantsId" in items[0];

  let gtmItems: GtmEcommerceItem[];

  if (isProductArray) {
    // Product[] - build items
    gtmItems = (items as Product[]).map((product, index) => {
      const defaultVariant = product.variantsId?.[0];
      return buildGtmItem(product, defaultVariant, 1, "Related Products", listId, index + 1);
    });
  } else {
    // Already GtmEcommerceItem[]
    gtmItems = items as GtmEcommerceItem[];
  }

  const totalValue = gtmItems.reduce((sum, item) => sum + item.price, 0);

  pushToDataLayer("ViewRelatedItemList", {
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(gtmItems, totalValue, {
      item_list_id: listId,
      item_list_name: "Related Products",
    }),
  });
}

/**
 * Track when a product is added to cart
 */
export function trackAddToCart(item: TCartItem): void {
  if (!item) return;

  pushToDataLayer("AddToCart", {
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(
      [item],
      item.price * item.quantity
    ),
  });
}

/**
 * Track when a product is removed from cart
 */
export function trackRemoveFromCart(item: TCartItem): void {
  if (!item) return;

  pushToDataLayer("RemoveFromCart", {
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(
      [item],
      item.price * item.quantity
    ),
  });
}

/**
 * Track when quantity is updated in cart
 */
export function trackUpdateItemQuantity(item: TCartItem, newQuantity: number): void {
  const oldQuantity = item.quantity;
  const diff = newQuantity - oldQuantity;

  if (diff === 0) return;

  const eventName = "CustomizeProduct";
  const absDiff = Math.abs(diff);
  const action = diff > 0 ? "increase" : "decrease";

  const baseItem = EcommercePayloadBuilder.buildEcommerceEvent(
    [{ ...item, quantity: newQuantity }],
    item.price * newQuantity
  );

  if (baseItem.items && Array.isArray(baseItem.items) && baseItem.items[0]) {
    (baseItem.items[0] as any).old_quantity = oldQuantity;
    (baseItem.items[0] as any).quantity_diff = absDiff;
    (baseItem.items[0] as any).quantity_action = action;
  }

  pushToDataLayer(eventName, {
    ecommerce: baseItem,
  });
}

/**
 * Track product search
 */
export function trackSearch(searchTerm: string): void {
  if (!searchTerm?.trim()) return;

  pushToDataLayer("Search", {
    search_term: searchTerm,
  });
}

/**
 * Track when a product is added to wishlist
 */
export function trackAddToWishlist(
  product: Product,
  variant?: Variant | null
): void {
  if (!product) return;

  const item = buildGtmItem(product, variant);

  pushToDataLayer("AddToWishlist", {
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent([item], item.price),
  });
}

// ====== CHECKOUT EVENTS ======

/**
 * Track checkout initiation
 */

export function trackBeginCheckout(
  items: TCartItem[],
  totalValue: number
): void {
  if (!items?.length || !totalValue) return;

  // ইভেন্ট নাম পরিবর্তন করে "InitiateCheckout" করা হয়েছে
  pushToDataLayer("InitiateCheckout", {
    percent: 50,
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue),
  });
}
/**
 * Track when shipping information is added
 */
export function trackAddShippingInfo(
  items: TCartItem[],
  totalValue: number,
  shippingTier: string,
  coupon?: string
): void {
  if (!items?.length) return;

  pushToDataLayer("AddShippingInfo", {
    percent: 100,
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue, {
      coupon,
      shipping_tier: shippingTier,
    }),
  });
}

/**
 * Track when payment information is added
 */
export function trackAddPaymentInfo(
  items: TCartItem[],
  totalValue: number,
  paymentMethod: "cod" | "online",
  coupon?: string
): void {
  if (!items?.length) return;

  pushToDataLayer("AddPaymentInfo", {
    percent: 100,
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue, {
      coupon,
      payment_type: paymentMethod,
    }),
  });
}

// ====== PURCHASE EVENTS ======

/**
 * Track a purchase - use this for completed transactions.
 * Uses object-based params (breaking change from old positional args).
 */
export function trackPurchase(params: PurchaseTrackingParams): void {
  const validation = GtmValidator.validatePurchase(params);

  if (!validation.valid) {
    GtmLogger.error("trackPurchase validation failed", validation.errors);
    return;
  }

  const { transactionId, items, totalValue, tax = 0, shipping = 0, coupon, customer, paymentMethod } = params;

  pushToDataLayer("Purchase", {
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue, {
      transaction_id: transactionId,
      tax,
      shipping,
      coupon,
      payment_method: paymentMethod,
    }),
    ...(customer && {
      customer_data: {
        email: customer.email,
        phone_number: customer.phone,
        first_name: customer.name?.split(" ")[0],
        last_name: customer.name?.split(" ").slice(1).join(" "),
        city: customer.city,
        country: customer.country || "BD",
      },
    }),
  });
}

/**
 * Track when an order is placed (COD or Online)
 */
export function trackOrderPlace(params: OrderPlacementParams): void {
  if (!params.orderId || !params.items?.length || !params.totalValue) {
    GtmLogger.error("trackOrderPlace missing required params");
    return;
  }

  const { orderId, totalValue, items, paymentMethod } = params;

  pushToDataLayer("OrderPlace", {
    order_id: orderId,
    value: totalValue,
    currency: DEFAULT_CURRENCY,
    payment_method: paymentMethod,
    percent: 100,
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue),
  });
}

/**
 * Track COD order placement
 */
export function trackCODPlace(orderId: string, totalValue: number, items: TCartItem[]): void {
  if (!orderId || !items?.length || totalValue <= 0) {
    GtmLogger.error("trackCODPlace invalid params");
    return;
  }

  pushToDataLayer("CodOrder", {
    order_id: orderId,
    value: totalValue,
    currency: DEFAULT_CURRENCY,
    payment_method: "cod",
    percent: 100,
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue),
  });
}

/**
 * Track successful online payment
 */
export function trackOnlinePaymentSuccess(
  orderId: string,
  transactionId: string,
  totalValue: number,
  items: TCartItem[] | any[]
): void {
  if (!orderId || !transactionId || !items?.length || totalValue <= 0) {
    GtmLogger.error("trackOnlinePaymentSuccess invalid params");
    return;
  }

  pushToDataLayer("OnlinePaymentSuccess", {
    order_id: orderId,
    transaction_id: transactionId,
    value: totalValue,
    currency: DEFAULT_CURRENCY,
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue, {
      transaction_id: transactionId,
    }),
  });
}

/**
 * Track admin confirmation of COD order
 */
export function trackAdminCODPurchase(
  orderId: string,
  totalValue: number,
  items: any[],
  customer?: CustomerDetails
): void {
  const validation = GtmValidator.validatePurchase({
    transactionId: orderId,
    items,
    totalValue,
  });

  if (!validation.valid) {
    GtmLogger.error("trackAdminCODPurchase validation failed", validation.errors);
    return;
  }

  pushToDataLayer("AdminConfirmCod", {
    ecommerce: EcommercePayloadBuilder.buildEcommerceEvent(items, totalValue, {
      transaction_id: orderId,
    }),
    ...(customer && { customer_data: customer }),
  });
}

/**
 * Track failed online payment
 */
export function trackOnlinePaymentFail(orderId: string, errorMessage: string): void {
  if (!orderId) return;

  pushToDataLayer("OnlinePaymentFail", {
    order_id: orderId,
    error_message: errorMessage,
  });
}

/**
 * Track order cancellation
 */
export function trackOrderCancel(orderId: string, reason?: string): void {
  if (!orderId) return;

  pushToDataLayer("OrderCancel", {
    order_id: orderId,
    cancel_reason: reason,
  });
}

// ====== CUSTOMER DATA & UTM HELPERS ======

/**
 * Store customer data for use in subsequent events
 */
export function storeCustomerData(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
}): void {
  if (!data.name?.trim() || !data.phone?.trim()) {
    GtmLogger.warn("storeCustomerData", "Missing required name or phone");
    return;
  }
    // 🔴 FIXED: Phone number formatting logic for BD (Adds 88 if not present)
  let formattedPhone = data.phone.trim();
  if (formattedPhone.startsWith("01")) {
    formattedPhone = "88" + formattedPhone;
  } else if (formattedPhone.startsWith("+8801")) {
    formattedPhone = formattedPhone.substring(1); // Remove '+' just keep '8801...'
  }

  const nameParts = data.name.trim().split(" ");
  const fn = nameParts[0];
  const ln = nameParts.slice(1).join(" ") || GUEST_LAST_NAME;

  const customerData = {
    fn,
    ln,
    ph: formattedPhone,
    email: data.email,
    ct: data.city || "Dhaka",
    ad: data.address,
    st: "",
    zp: "",
  };

  // 🔴 FIXED: Changed to localStorage (StorageManager.set) from setSession
  StorageManager.set(STORAGE_KEYS.CUSTOMER_DATA, JSON.stringify(customerData));
}

/**
 * Capture and store UTM parameters from URL
 */
export function storeUtmParams(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const utmKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
  ];

  utmKeys.forEach((key) => {
    const val = params.get(key);
    if (val) {
      localStorage.setItem(key, val);
      localStorage.setItem(`${key}_first_seen`, new Date().toISOString());
    }
  });

  const currentReferrer = document.referrer;
  if (currentReferrer && !localStorage.getItem("initial_referrer")) {
    localStorage.setItem("initial_referrer", currentReferrer);
    localStorage.setItem("initial_referrer_date", new Date().toISOString());
  }
}

export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
  ];
  const utms: Record<string, string> = {};

  keys.forEach((key) => {
    const val = localStorage.getItem(key);
    if (val) utms[key] = val;
  });

  return utms;
}

// ====== ITEM BUILDER ======

/**
 * Normalize product and variant into GTM ecommerce item format.
 * Adapted for shoppersbd Product types (sub_category as array of objects, finalPrice).
 */
export function buildGtmItem(
  product: Product,
  variant?: Variant | null,
  quantity: number = 1,
  listName?: string,
  listId?: string,
  index?: number
): GtmEcommerceItem {
  const effectiveVariant = variant || product.variantsId?.[0];
  const finalPrice = Number(effectiveVariant?.finalPrice ?? product.finalPrice ?? 0);
  const originalPrice = Number(effectiveVariant?.selling_price ?? product.selling_price) || 0;
  const discount = finalPrice < originalPrice ? originalPrice - finalPrice : 0;
  const itemName = variant ? `${product.name} - ${variant.name}` : product.name;
  const stock = variant ? variant.variants_stock : product.total_stock;
  const availability = stock > 0 ? "in_stock" : "out_of_stock";

  return {
    item_id: variant?._id ?? product._id,
    item_name: itemName,
    item_brand: product.brand?.name,
    item_category: product.sub_category?.[0]?.name,
    price: finalPrice,
    currency: product.currency || DEFAULT_CURRENCY,
    quantity,
    item_variant: variant?.name,
    discount,
    item_sku: variant?.sku || variant?.barcode || product._id,
    item_condition: variant?.condition || "new",
    item_availability: availability,
    ...(listName && { item_list_name: listName }),
    ...(listId && { item_list_id: listId }),
    ...(typeof index === "number" && { index }),
  };
}

// ====== CONSENT MANAGEMENT ======
// These are kept for backward compatibility with ConsentManager component

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const hasTrackingConsent = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("tracking_consent") === "granted" ||
      localStorage.getItem("cookie_consent") === "granted"
    );
  } catch {
    return false;
  }
};

export const setTrackingConsent = (
  granted: boolean,
  settings = { analytics: true, advertising: true, functional: true },
): boolean => {
  try {
    localStorage.setItem("tracking_consent", granted ? "granted" : "denied");
    localStorage.setItem("consent_settings", JSON.stringify(settings));

    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "consent_update",
        analytics_storage: settings.analytics && granted ? "granted" : "denied",
        ad_storage: settings.advertising && granted ? "granted" : "denied",
        functionality_storage:
          settings.functional && granted ? "granted" : "denied",
      });

      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage:
            settings.analytics && granted ? "granted" : "denied",
          ad_storage: settings.advertising && granted ? "granted" : "denied",
          functionality_storage:
            settings.functional && granted ? "granted" : "denied",
        });
      }
    }

    pushToDataLayer(granted ? "consent_granted" : "consent_denied", {
      consent_settings: settings,
    });

    return true;
  } catch (e) {
    console.error("Failed to set consent:", e);
    return false;
  }
};

/**
 * Generic trackEvent - pushes to dataLayer only (no CAPI).
 * Kept for backward compatibility with ConsentManager.
 */
export const trackEvent = (
  eventName: string,
  eventData: Record<string, unknown> = {},
  _requireConsent?: boolean,
): void => {
  pushToDataLayer(eventName, eventData);
};

/**
 * getUserContext stub - returns basic visitor info.
 * Kept for backward compatibility with ConsentManager.
 */
export function getUserContext(): Record<string, unknown> {
  return {
    external_id: VisitorData.getVisitorId(),
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };
}

/**
 * Get visitor's external ID
 */
export function getExternalId(): string {
  return VisitorData.getVisitorId();
}

/**
 * Get tracking data from cookies, navigator, localStorage, and cached IP.
 * This is the primary function used by checkout forms to attach tracking data to order payloads.
 * The POS/CRM uses this data to send Purchase events back to Meta CAPI via GTM Server-Side.
 */
export function getTrackingData() {
  if (typeof window === "undefined") return undefined;

  const clickId = MetaClickTracking.getFbc();
  const browserId = MetaClickTracking.getFbp();
  const fbclid = MetaClickTracking.getFbclid();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
  const externalId = getExternalId();
  const ipAddress = IpTracker.getIp();

  return {
    clickId,    // _fbc cookie value (or constructed from fbclid)
    browserId,  // _fbp cookie value
    fbclid,     // Raw fbclid from URL params
    ipAddress,  // Visitor's real IP from ipify
    userAgent,  // Browser user agent
    externalId, // Generated visitor UUID
  };
}

/**
 * Initialize Meta click tracking and IP fetching.
 * Should be called once on page load (e.g., in layout.tsx useEffect).
 */
export function initializeTracking(): void {
  MetaClickTracking.captureFbclid();
  IpTracker.fetchAndCacheIp();
}
