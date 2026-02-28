/**
 * Customer Source Tracking Module
 *
 * Detects traffic source from URL parameters:
 * - Primary: utm_source (e.g., ?utm_source=ig for Instagram)
 * - Fallback: Platform-specific click IDs (e.g., ?fbclid=... for Facebook/Meta, ?ttclid=... for TikTok)
 * Stores the source in sessionStorage for the session duration.
 * Clears automatically on tab/browser close.
 *
 * Example URL from Instagram: https://shopmatebd.com/...&utm_source=ig&fbclid=... → 'instagram' (utm_source=ig takes priority over fbclid)
 *
 * Usage:
 * - Call detectAndStoreCustomerSource() on every page load (e.g., in layout.tsx)
 * - Call getCustomerSource() when placing orders to include in payload
 */

export type CustomerSource =
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "phone call"
  | "tiktok"
  | "google"
  | "website"
  | "others";

const STORAGE_KEY = "customer_source";

/**
 * Validates TikTok click ID format
 * @param ttclid The TikTok click ID to validate
 * @returns true if valid TikTok click ID format
 */
function isValidTikTokClickId(ttclid: string): boolean {
  if (!ttclid || ttclid.length < 10) {
    console.log(
      `❌ [TIKTOK VALIDATION] Invalid click ID - too short: ${ttclid}`,
    );
    return false;
  }

  const tiktokPatterns = [
    /E_C_P_/i, // Common TikTok pattern
    /tt_/i, // Classic TikTok pattern
    /^[A-Za-z0-9_-]{20,}$/, // Long alphanumeric
  ];

  const isValid = tiktokPatterns.some((pattern) => pattern.test(ttclid));

  if (isValid) {
    console.log(
      `✅ [TIKTOK VALIDATION] Valid TikTok click ID pattern detected`,
    );
  } else {
    console.log(
      `❌ [TIKTOK VALIDATION] Click ID doesn't match TikTok patterns: ${ttclid.substring(0, 30)}...`,
    );
  }

  return isValid;
}

/**
 * Maps common utm_source values to normalized CustomerSource values (case-insensitive)
 */
function mapUtmSourceToCustomerSource(utmSource: string): CustomerSource {
  const normalized = utmSource.toLowerCase().trim();

  // Facebook
  if (normalized === "fb" || normalized === "facebook") {
    return "facebook";
  }

  // Instagram
  if (normalized === "ig" || normalized === "instagram") {
    return "instagram";
  }

  // WhatsApp
  if (normalized === "wa" || normalized === "whatsapp") {
    return "whatsapp";
  }

  // Phone call
  if (
    normalized === "phone" ||
    normalized === "call" ||
    normalized === "phone call" ||
    normalized === "phonecall"
  ) {
    return "phone call";
  }

  // TikTok
  if (normalized === "tt" || normalized === "tiktok") {
    return "tiktok";
  }

  // Google
  if (normalized === "g" || normalized === "google") {
    return "google";
  }

  // Known but not in the list - map to others
  return "others";
}

/**
 * Detects source from URL parameters (utm_source > click IDs > null)
 * Handles mixed parameters (e.g., utm_source=ig + fbclid) by prioritizing utm_source.
 * @returns The detected CustomerSource or null if none found
 */
function getSourceFromUrl(): CustomerSource | null {
  if (typeof window === "undefined") return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    console.log("🔍 [SOURCE TRACKING] URL Parameters:", window.location.search);

    // Log all parameters for debugging
    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith("utm_") || key.includes("clid")) {
        console.log(
          `📊 [SOURCE TRACKING] Found parameter: ${key} = ${value.substring(0, 50)}...`,
        );
      }
    }

    // 1. Check utm_source first (highest priority)
    const utmSource = urlParams.get("utm_source");
    if (utmSource) {
      console.log(`✅ [SOURCE TRACKING] UTM Source detected: ${utmSource}`);
      const mappedSource = mapUtmSourceToCustomerSource(utmSource);
      console.log(
        `🎯 [SOURCE TRACKING] Mapped to customer source: ${mappedSource}`,
      );
      return mappedSource;
    }
    console.log("❌ [SOURCE TRACKING] No utm_source parameter found");

    // 2. Fallback to platform-specific click IDs
    // Priority order: ttclid > gclid > fbclid
    const ttclid = urlParams.get("ttclid");
    if (ttclid) {
      console.log(
        `🎵 [SOURCE TRACKING] TikTok Click ID found: ${ttclid.substring(0, 30)}...`,
      );
      if (isValidTikTokClickId(ttclid)) {
        console.log(
          `✅ [SOURCE TRACKING] Valid TikTok Click ID - Source: tiktok`,
        );
        return "tiktok";
      } else {
        console.log(`❌ [SOURCE TRACKING] Invalid TikTok Click ID format`);
      }
    }

    if (urlParams.has("gclid")) {
      console.log(
        `🔍 [SOURCE TRACKING] Google Click ID found - Source: google`,
      );
      return "google";
    }

    if (urlParams.has("fbclid")) {
      console.log(`📘 [SOURCE TRACKING] Facebook Click ID found`);
      // Check referrer for Instagram vs Facebook distinction
      const referrer = document.referrer.toLowerCase();
      if (referrer.includes("instagram")) {
        console.log(
          `📷 [SOURCE TRACKING] Instagram referrer detected - Source: instagram`,
        );
        return "instagram";
      }
      console.log(`📘 [SOURCE TRACKING] Facebook referrer - Source: facebook`);
      return "facebook";
    }

    console.log("❌ [SOURCE TRACKING] No click IDs found in URL");
    return null;
  } catch (error) {
    console.error(
      "💥 [SOURCE TRACKING] Error extracting source from URL:",
      error,
    );
    return null;
  }
}

/**
 * Stores the customer source in sessionStorage
 * @param source The CustomerSource value to store
 */
function storeCustomerSource(source: CustomerSource): void {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined")
    return;

  try {
    console.log(`💾 [STORAGE] Storing customer source: ${source}`);
    sessionStorage.setItem(STORAGE_KEY, source);
    console.log(
      `✅ [STORAGE] Successfully stored customer source in sessionStorage`,
    );
  } catch (error) {
    console.error(`💥 [STORAGE] Error storing customer source:`, error);
  }
}

/**
 * Retrieves the stored customer source from sessionStorage
 * @returns The stored CustomerSource or null if not found/invalid
 */
function getStoredCustomerSource(): CustomerSource | null {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined")
    return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Validate it's a valid CustomerSource
      const validSources: CustomerSource[] = [
        "facebook",
        "instagram",
        "whatsapp",
        "phone call",
        "tiktok",
        "google",
        "website",
        "others",
      ];
      if (validSources.includes(stored as CustomerSource)) {
        return stored as CustomerSource;
      }
    }
    return null;
  } catch (error) {
    console.log("Error retrieving customer source:", error);
    return null;
  }
}

/**
 * Detects customer source from URL and stores it in sessionStorage.
 * Should be called on every page load.
 *
 * Logic:
 * - If source detected in URL (utm_source or click ID), map and store it (overrides existing if new)
 * - If no source in URL but already stored, keep existing
 * - If no source and no stored value, default to 'website'
 * - Unknown utm_source maps to 'others'
 */
export function detectAndStoreCustomerSource(): CustomerSource {
  console.log("🚀 [SOURCE TRACKING] Starting customer source detection...");

  const urlSource = getSourceFromUrl();
  const existingSource = getStoredCustomerSource();

  console.log("📊 [SOURCE TRACKING] Detection Results:");
  console.log(`   URL Source: ${urlSource || "none"}`);
  console.log(`   Existing Stored Source: ${existingSource || "none"}`);

  if (urlSource) {
    // New source detected - store/override
    console.log(
      `✅ [SOURCE TRACKING] New source detected, storing: ${urlSource}`,
    );
    storeCustomerSource(urlSource);
    return urlSource;
  }

  if (existingSource) {
    // No new source, keep existing
    console.log(
      `🔄 [SOURCE TRACKING] No new source, keeping existing: ${existingSource}`,
    );
    return existingSource;
  }

  // Default to 'website'
  console.log(`🌐 [SOURCE TRACKING] No source found, defaulting to: website`);
  storeCustomerSource("website");
  return "website";
}

/**
 * Gets the customer source for use in order payloads.
 * Returns the stored source or 'website' as fallback.
 *
 * @returns The CustomerSource value to include in order data
 */
export function getCustomerSource(): CustomerSource {
  console.log("📋 [GET SOURCE] Retrieving customer source for order...");
  const storedSource = getStoredCustomerSource();
  const finalSource = storedSource ?? "website";
  console.log(`✅ [GET SOURCE] Final customer source: ${finalSource}`);
  return finalSource;
}

/**
 * Gets UTM parameters from localStorage (saved by GTM system)
 */
export function getUtmParameters() {
  if (typeof window === "undefined" || typeof localStorage === "undefined")
    return {};

  console.log(
    "📈 [UTM TRACKING] Retrieving UTM parameters from localStorage...",
  );

  try {
    const utmParams = {
      utm_source: localStorage.getItem("utm_source") || undefined,
      utm_medium: localStorage.getItem("utm_medium") || undefined,
      utm_campaign: localStorage.getItem("utm_campaign") || undefined,
      utm_id: localStorage.getItem("utm_id") || undefined,
      utm_term: localStorage.getItem("utm_term") || undefined,
      utm_content: localStorage.getItem("utm_content") || undefined,
    };

    // Log found UTM parameters
    const foundParams = Object.entries(utmParams).filter(
      ([_, value]) => value !== undefined,
    );
    if (foundParams.length > 0) {
      console.log("✅ [UTM TRACKING] Found UTM parameters:");
      foundParams.forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    } else {
      console.log("❌ [UTM TRACKING] No UTM parameters found in localStorage");
    }

    return utmParams;
  } catch (error) {
    console.error("💥 [UTM TRACKING] Error retrieving UTM parameters:", error);
    return {};
  }
}

/**
 * Gets TikTok click ID from storage
 */
export function getTikTokClickId(): string | undefined {
  if (typeof window === "undefined") return undefined;

  console.log(
    "🎵 [TIKTOK TRACKING] Retrieving TikTok click ID from storage...",
  );

  try {
    // Check session first, then localStorage
    const sessionClickId = sessionStorage?.getItem("session_click_id");
    const localClickId = localStorage?.getItem("last_click_id");

    console.log(`📊 [TIKTOK TRACKING] Storage check:`);
    console.log(
      `   Session Click ID: ${sessionClickId ? sessionClickId.substring(0, 30) + "..." : "none"}`,
    );
    console.log(
      `   Local Click ID: ${localClickId ? localClickId.substring(0, 30) + "..." : "none"}`,
    );

    const clickId = sessionClickId || localClickId;

    if (!clickId) {
      console.log("❌ [TIKTOK TRACKING] No click ID found in storage");
      return undefined;
    }

    // Validate it's a TikTok click ID
    if (isValidTikTokClickId(clickId)) {
      console.log(
        `✅ [TIKTOK TRACKING] Valid TikTok click ID found: ${clickId.substring(0, 30)}...`,
      );
      return clickId;
    } else {
      console.log(
        `❌ [TIKTOK TRACKING] Click ID found but not valid TikTok format: ${clickId.substring(0, 30)}...`,
      );
      return undefined;
    }
  } catch (error) {
    console.error(
      "💥 [TIKTOK TRACKING] Error retrieving TikTok click ID:",
      error,
    );
    return undefined;
  }
}

/**
 * Clears the stored customer source from sessionStorage.
 * Useful for testing or after order completion.
 */
export function clearCustomerSource(): void {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined")
    return;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.log("Error clearing customer source:", error);
  }
}

/**
 * Initialize function for standalone script usage (if not using Next.js hooks).
 * Sets up detection on DOMContentLoaded.
 */
export function initCustomerSourceTracking(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      detectAndStoreCustomerSource();
    });
  } else {
    detectAndStoreCustomerSource();
  }
}
