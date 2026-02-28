/**
 * Customer Source Tracking - Standalone Script
 *
 * This vanilla JavaScript version can be included in any HTML page:
 * <script src="/assets/tracking.js"></script>
 *
 * It automatically detects utm_source on page load and stores the
 * customer source in sessionStorage.
 */

(function () {
  "use strict";

  var STORAGE_KEY = "customer_source";

  /**
   * Valid customer source values
   * @type {string[]}
   */
  var VALID_SOURCES = [
    "facebook",
    "instagram",
    "whatsapp",
    "phone call",
    "tiktok",
    "google",
    "website",
    "others",
  ];

  /**
   * Maps common utm_source values to normalized CustomerSource values (case-insensitive)
   * @param {string} utmSource
   * @returns {string}
   */
  function mapUtmSourceToCustomerSource(utmSource) {
    var normalized = utmSource.toLowerCase().trim();

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
   * Extracts utm_source from current URL query parameters
   * @returns {string|null}
   */
  function getUtmSourceFromUrl() {
    try {
      var urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("utm_source");
    } catch (error) {
      console.log("Error extracting utm_source from URL:", error);
      return null;
    }
  }

  /**
   * Stores the customer source in sessionStorage
   * @param {string} source
   */
  function storeCustomerSource(source) {
    try {
      sessionStorage.setItem(STORAGE_KEY, source);
    } catch (error) {
      console.log("Error storing customer source:", error);
    }
  }

  /**
   * Retrieves the stored customer source from sessionStorage
   * @returns {string|null}
   */
  function getStoredCustomerSource() {
    try {
      var stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored && VALID_SOURCES.indexOf(stored) !== -1) {
        return stored;
      }
      return null;
    } catch (error) {
      console.log("Error retrieving customer source:", error);
      return null;
    }
  }

  /**
   * Detects customer source from URL and stores it in sessionStorage.
   * @returns {string}
   */
  function detectAndStoreCustomerSource() {
    var utmSource = getUtmSourceFromUrl();
    var existingSource = getStoredCustomerSource();

    if (utmSource) {
      // New utm_source detected - map and store it
      var mappedSource = mapUtmSourceToCustomerSource(utmSource);
      storeCustomerSource(mappedSource);
      return mappedSource;
    }

    if (existingSource) {
      // No new utm_source, but we have an existing stored value
      return existingSource;
    }

    // No utm_source and no stored value - default to 'website'
    storeCustomerSource("website");
    return "website";
  }

  /**
   * Gets the customer source for use in order payloads.
   * @returns {string}
   */
  function getCustomerSource() {
    var storedSource = getStoredCustomerSource();
    return storedSource || "website";
  }

  /**
   * Clears the stored customer source from sessionStorage.
   */
  function clearCustomerSource() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.log("Error clearing customer source:", error);
    }
  }

  /**
   * Example order placement function with source tracking
   * @param {Object} orderData - The order data to send
   * @returns {Promise<Object>}
   */
  function placeOrder(orderData) {
    // Add customer source to the order payload
    var payload = Object.assign({}, orderData, {
      customer_source: getCustomerSource(),
    });

    return fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            "Order request failed with status: " + response.status,
          );
        }
        return response.json();
      })
      .catch(function (error) {
        console.log("Error placing order:", error);
        throw error;
      });
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      detectAndStoreCustomerSource();
    });
  } else {
    // DOM already loaded
    detectAndStoreCustomerSource();
  }

  // Expose functions globally for external use
  window.CustomerSourceTracking = {
    detectAndStoreCustomerSource: detectAndStoreCustomerSource,
    getCustomerSource: getCustomerSource,
    clearCustomerSource: clearCustomerSource,
    placeOrder: placeOrder,
  };
})();

/*
 * USAGE EXAMPLES:
 *
 * 1. Include the script in your HTML:
 *    <script src="/assets/tracking.js"></script>
 *
 * 2. The script automatically detects and stores the source on page load.
 *
 * 3. To get the current customer source:
 *    var source = window.CustomerSourceTracking.getCustomerSource();
 *    console.log('Customer source:', source);
 *
 * 4. To place an order with source tracking:
 *    window.CustomerSourceTracking.placeOrder({
 *      customer_name: 'John Doe',
 *      customer_phone: '+8801712345678',
 *      customer_address: 'Dhaka, Bangladesh',
 *      products: [{ productId: 'abc123', quantity: 2 }],
 *      due: '1500'
 *    })
 *    .then(function(response) {
 *      console.log('Order placed successfully:', response);
 *    })
 *    .catch(function(error) {
 *      console.log('Order failed:', error);
 *    });
 *
 * 5. To manually clear the stored source:
 *    window.CustomerSourceTracking.clearCustomerSource();
 *
 * 6. To manually re-detect (e.g., after URL change):
 *    window.CustomerSourceTracking.detectAndStoreCustomerSource();
 */
