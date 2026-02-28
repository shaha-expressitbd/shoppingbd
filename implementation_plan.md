# Migrate Tracking Code to shoppersbd

## Goal
Migrate the robust, production-ready GTM and Meta Pixel tracking implementation from `womensfashion_nextjs` to `shoppersbd_nextjs_main`. This includes the enhanced [gtm.ts](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts), [sourceTracking.ts](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/sourceTracking.ts), and refactoring usage of [trackPurchase](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#686-718) to match the new signature.

## User Review Required
> [!IMPORTANT]
> This migration will replace [src/utils/gtm.ts](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts) and [src/utils/sourceTracking.ts](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/sourceTracking.ts) in `shoppersbd_nextjs_main` with the versions from `womensfashion_nextjs`.
>
> **Breaking Change**: The [trackPurchase](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#686-718) function signature will change from a list of arguments to a single configuration object. `CheckoutPage.tsx` will be refactored to adapt to this change.

## Proposed Changes

### Utils Layer

### Utils Layer

#### [MODIFY] src/utils/gtm.ts
- Create a **clean, GTM-only version** based on `womensfashion_nextjs`.
- **Keep**:
    - Enhanced data layer structure (`user_data`, `ecommerce` object).
    - Validation logic.
    - [pushToDataLayer](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#434-465) logic.
    - Source/UTM handling.
- **Remove**:
    - Direct `fbq()` (Meta Pixel) calls.
    - Direct CAPI ([sendToCapi](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#451-469)) calls.
    - Code related to [metaPixel.ts](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/metaPixel.ts) or `metaCapi.ts`.
- **Goal**: Ensure `dataLayer.push` happens with all necessary data (including hashed user data for GTM's own Enhanced Conversions if needed), but rely entirely on GTM tags to fire pixels.
- **Functions to Migrate/Verify**:
    - [ ] [trackPageView](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#477-496) (handle all routes: home, shop, flashdeals, etc.)
    - [ ] [trackSearch](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#600-610)
    - [ ] [trackProductView](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#499-511)
    - [ ] [trackViewRelatedItemList](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#940-955)
    - [ ] [trackAddToCart](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#696-726)
    - [ ] [trackRemoveFromCart](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#727-748)
    - [ ] [trackUpdateItemQuantity](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#916-939)
    - [ ] [trackAddToWishlist](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#886-915)
    - [ ] [trackBeginCheckout](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#749-785)
    - [ ] [trackAddShippingInfo](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#644-663)
    - [ ] [trackAddPaymentInfo](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#664-683)
    - [ ] [trackPurchase](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#686-718) (Refactor to object param)
    - [ ] [trackOrderPlace](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#719-739)
    - [ ] [trackCODPlace](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#740-758)
    - [ ] [trackOnlinePaymentSuccess](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#759-783)
    - [ ] [trackAdminCODPurchase](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#784-811)

#### [MODIFY] src/utils/sourceTracking.ts
- Import [detectAndStoreCustomerSource](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/sourceTracking.ts#242-284) and helper functions from `womensfashion_nextjs` to ensure consistent source detection (TikTok, UTM, etc.).

### Component Layer

#### [MODIFY] src/app/(public)/checkout/page.tsx
- Refactor [trackPurchase](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#686-718) call to use the new object-based signature.
- **Current**: [trackPurchase(id, items, total, ...)](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#686-718) - mixed arguments.
- **New**: [trackPurchase({ transactionId, items, totalValue, ... })](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#686-718) - single object argument.

### Cleanup & Removal
#### [DELETE] src/utils/gtm.old.ts
- Old legacy file, no longer needed.

#### [DELETE] src/utils/metaPixel.ts
- Direct Meta Pixel implementation, replacing with GTM tags.

#### [DELETE] src/app/api/meta-capi/route.ts
- Server-side CAPI handler, no longer needed as GTM will handle everything (or CAPI via GTM server-side if configured later, but not via this app route).

#### [MODIFY] src/app/layout.tsx
- **Remove**: Any imports or usages of [metaPixel.ts](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/metaPixel.ts) or `FaceBookPixel` components if they exist.

#### [VERIFY] src/app/layout.tsx
- Ensure [detectAndStoreCustomerSource()](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/sourceTracking.ts#242-284) and [storeUtmParams()](file:///c:/main-e-com-nextjs/shoppersbd_nextjs_main/src/utils/gtm.ts#1153-1181) are called (already present, will verify).
- Ensure Meta Pixel script is present (already present).

## Verification Plan

### Automated Tests
- Type verification via TypeScript build check (will fail if [trackPurchase](file:///c:/nextjs-e-com%20project/womensfashion_nextjs/src/utils/gtm.ts#686-718) isn't refactored correctly).

### Manual Verification
1. **Build Check**: Run `npm run build` (or type check) to ensure no interface mismatches.
2. **Code Review**: specific check of `CheckoutPage.tsx` to ensure all fields (shipping, address, etc.) are correctly mapped to the new object structure.
