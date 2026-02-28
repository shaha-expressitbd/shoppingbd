"use client";

import { useProductPricing } from "@/hooks/useProductPricing";
import { TCartItem } from "@/lib/features/cart/cartSlice";
import { Product } from "@/types/product";
import { useEffect, useRef, useState } from "react";
import CustomCheckoutForm, { CustomCheckoutFormRef } from "./CustomCheckoutForm";

interface CustomCheckoutWrapperProps {
    product: Product;
}

export default function CustomCheckoutWrapper({
    product,
}: CustomCheckoutWrapperProps) {
    const [selectedItems, setSelectedItems] = useState<TCartItem[]>([]);
    const checkoutFormRef = useRef<CustomCheckoutFormRef>(null);

    // Get exact pricing calculation from the global hook
    const pricing = useProductPricing(product, product.variantsId?.[0] || null);

    // Initialize base cart item for the checkout form to display correct totals
    useEffect(() => {
        const defaultVariant = product.variantsId?.[0];

        const cartId = defaultVariant?._id || product._id;

        const newItem: TCartItem = {
            _id: cartId,
            name: product.name,
            price: pricing.finalPrice,
            sellingPrice: pricing.sellingPrice,
            isDiscountActive: pricing.isDiscountActive,
            quantity: 1,
            maxStock: defaultVariant?.variants_stock ?? product.total_stock,
            image: defaultVariant?.image?.alterImage?.secure_url || product.images?.[0]?.alterImage?.secure_url || "/assets/fallback.jpg",
            currency: product.currency || "BDT",
            variantId: product.hasVariants ? defaultVariant?._id : undefined,
            variantValues: defaultVariant?.variants_values ?? [],
            variantGroups: product.variantsGroup,
            ...(defaultVariant?.variants_values?.length ? { variantLabel: defaultVariant.variants_values.join(" / ") } : {}),
            ...(product.main_category?.[0]?.name ? { category: product.main_category[0].name } : product.sub_category?.[0]?.name ? { category: product.sub_category[0].name } : {}),
            ...(product.brand?.name && { brand: product.brand.name }),
        } as TCartItem;
        setSelectedItems([newItem]);

        // Hide mobile menu bar on mount
        document.body.classList.add('hide-mobile-menu');
        return () => {
            document.body.classList.remove('hide-mobile-menu');
        }
    }, [product, pricing.finalPrice, pricing.sellingPrice, pricing.isDiscountActive]);

    // Proceed straight to submit since variant modal is bypassed
    const handleBeforeSubmit = (): boolean => {
        return true;
    };

    const handleRemoveItem = () => {
        setSelectedItems(prev => {
            if (prev.length > 0) {
                return [{ ...prev[0], quantity: 1 }];
            }
            return prev;
        });
    };

    const handleUpdateQuantity = (id: string, variantId: string | undefined, qty: number) => {
        setSelectedItems(prev => prev.map(item => {
            if (item._id === id && item.variantId === variantId) {
                return { ...item, quantity: qty };
            }
            return item;
        }));
    };

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-4 space-y-4 lg:space-y-12 pb-32 md:mt-20">

            <style jsx global>{`
                .hide-mobile-menu #mobile-bottom-nav,
                .hide-mobile-menu .desktop-footer-placeholder {
                     display: none !important;
                }
            `}</style>



            {/* Checkout Form & Summary Section */}
            <div
                id="checkout-form-section"
                className="w-full"
            >
                {selectedItems.length > 0 && (
                    <CustomCheckoutForm
                        ref={checkoutFormRef}
                        items={selectedItems}
                        removeItem={handleRemoveItem}
                        updateItemQuantity={handleUpdateQuantity}
                        onBeforeSubmit={handleBeforeSubmit}
                    />
                )}
            </div>

        </div>
    );
}
