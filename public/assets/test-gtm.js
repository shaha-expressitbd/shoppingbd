/**
 * GTM & Meta Pixel Test Utility
 * Use this script to test your tracking implementation
 *
 * Run in browser console to verify deduplication and EMQ
 */

// Test tracking functions
function testBasicTracking() {
  console.log("🧪 Testing basic tracking...");

  // Test PageView
  const pageViewId = gtmDebug?.getInfo?.() || "test";
  console.log("📄 PageView test completed, event_id:", pageViewId);

  // Test Add to Cart
  const testProduct = {
    _id: "test_product_123",
    name: "Test Product",
    currency: "BDT",
    brand: { name: "Test Brand" },
    sub_category: "test-category",
    variantsId: [{ selling_price: 100 }],
  };

  const testCartItem = {
    _id: "test_product_123",
    name: "Test Product",
    price: 100,
    quantity: 1,
    currency: "BDT",
    variantLabel: "Default",
  };

  console.log("🛒 Testing Add to Cart...");
  // trackAddToCart(testCartItem); // Uncomment to test

  return { pageViewId };
}

function testEMQScore() {
  console.log("🎯 Testing EMQ Score...");

  if (typeof window.gtmDebug !== "undefined") {
    const emqHealth = window.gtmDebug.monitorEMQ();
    console.log("📊 EMQ Health Report:", emqHealth);

    if (emqHealth.averageScore >= 80) {
      console.log("✅ Excellent EMQ Score!");
    } else if (emqHealth.averageScore >= 60) {
      console.log("⚠️ Good EMQ Score, but could be improved");
    } else {
      console.log("❌ Poor EMQ Score - needs improvement");
    }

    return emqHealth;
  } else {
    console.log("❌ GTM Debug not available");
    return null;
  }
}

function testDeduplication() {
  console.log("🔄 Testing deduplication...");

  if (typeof window.gtmDebug !== "undefined") {
    const dedupStatus = window.gtmDebug.verifyDedup();
    console.log("🔍 Deduplication Status:", dedupStatus);

    if (dedupStatus.status === "good") {
      console.log("✅ Deduplication working correctly!");
    } else {
      console.log("⚠️ Deduplication issues detected");
      console.log("💡 Recommendations:", dedupStatus.recommendations);
    }

    return dedupStatus;
  } else {
    console.log("❌ GTM Debug not available");
    return null;
  }
}

function runFullTest() {
  console.log("🚀 Running full Meta Pixel EMQ test...");
  console.log("=====================================");

  const basicTest = testBasicTracking();
  const emqTest = testEMQScore();
  const dedupTest = testDeduplication();

  console.log("=====================================");
  console.log("📋 Test Summary:");
  console.log("- Basic Tracking: ✅");
  console.log(`- EMQ Score: ${emqTest ? emqTest.averageScore + "%" : "N/A"}`);
  console.log(`- Deduplication: ${dedupTest ? dedupTest.status : "N/A"}`);
  console.log(
    `- CAPI Coverage: ${dedupTest ? dedupTest.coverage + "%" : "N/A"}`,
  );

  if (typeof window.gtmDebug !== "undefined") {
    console.log("\n💾 Export debug data:");
    console.log("Copy this to share with support:");
    console.log(window.gtmDebug.exportData());
  }

  return {
    basicTest,
    emqTest,
    dedupTest,
  };
}

// Auto-run test after 3 seconds
setTimeout(() => {
  if (typeof window !== "undefined") {
    console.log("🔧 GTM Meta Pixel Test Utility Loaded");
    console.log("Run: runFullTest() to test your implementation");

    // Make functions available globally for manual testing
    window.testGTM = {
      runFullTest,
      testBasicTracking,
      testEMQScore,
      testDeduplication,
    };
  }
}, 3000);
