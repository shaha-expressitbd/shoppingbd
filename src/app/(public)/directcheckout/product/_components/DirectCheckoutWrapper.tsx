"use client";

import { TCartItem } from "@/lib/features/cart/cartSlice";
import { Product, Variant } from "@/types/product";
import { useEffect, useRef, useState } from "react";
import ProductDetail from "../../../product/[slug]/product-details";
import VariantSelectModal from "../../../product/_component/VariantSelectModal";
import CheckoutFormSection, { CheckoutFormRef } from "./CheckoutFormSection";

interface DirectCheckoutWrapperProps {
    product: Product;
    relatedProducts: Product[];
    subCategoryId: string;
}

export default function DirectCheckoutWrapper({
    product,
    relatedProducts,
    subCategoryId
}: DirectCheckoutWrapperProps) {
    const [selectedItems, setSelectedItems] = useState<TCartItem[]>([]);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

    const checkoutSectionRef = useRef<HTMLDivElement>(null);
    const checkoutFormRef = useRef<CheckoutFormRef>(null);

    // Initialize base cart item for the checkout form to display correct totals
    useEffect(() => {
        const defaultVariant = product.variantsId?.[0];
        const price = product.finalPrice;

        // Match the behavior of regular Add to Cart where item._id is the variant ID
        const cartId = product.hasVariants ? undefined : defaultVariant?._id;

        const newItem: TCartItem = {
            _id: cartId || product._id, // Use variant ID as the primary _id if possible, or fallback to product._id (though the form blocks until variant is picked)
            name: product.name,
            price: price,
            sellingPrice: defaultVariant?.selling_price ? Number(defaultVariant.selling_price) : product.selling_price,
            isDiscountActive: defaultVariant?.isDiscountActive ?? false,
            quantity: 1,
            maxStock: defaultVariant?.variants_stock ?? product.total_stock,
            image: defaultVariant?.image?.alterImage?.secure_url || product.images?.[0]?.alterImage?.secure_url || "/assets/fallback.jpg",
            currency: product.currency || "BDT",
            variantId: product.hasVariants ? undefined : defaultVariant?._id, // Leave undefined if variants exist so we know it hasn't been selected yet
            variantValues: defaultVariant?.variants_values ?? [],
            variantGroups: product.variantsGroup,
            ...(defaultVariant?.variants_values?.length && !product.hasVariants ? { variantLabel: defaultVariant.variants_values.join(" / ") } : {}),
        };
        setSelectedItems([newItem]);
    }, [product]);

    // Pauses form submission if variant isn't selected
    const handleBeforeSubmit = (): boolean => {
        if (product.hasVariants && !selectedItems[0]?.variantId) {
            setIsVariantModalOpen(true);
            return false;
        }
        return true;
    };

    const handleDirectCheckoutAdd = (variant: Variant | null, quantity: number, finalPrice: number) => {
        setIsVariantModalOpen(false);

        const variantToUse = variant || product.variantsId?.[0];
        const cartId = variantToUse?._id || product._id;

        const newItem: TCartItem = {
            _id: cartId,
            name: product.name,
            price: finalPrice,
            sellingPrice: variant?.selling_price ? Number(variant.selling_price) : product.selling_price,
            isDiscountActive: variant?.isDiscountActive ?? false,
            quantity: quantity,
            maxStock: variant?.variants_stock ?? product.total_stock,
            image: variant?.image?.alterImage?.secure_url || product.images?.[0]?.alterImage?.secure_url || "/assets/fallback.jpg",
            currency: product.currency || "BDT",
            variantId: variant?._id,
            variantValues: variant?.variants_values ?? [],
            variantGroups: product.variantsGroup,
            ...(variant?.variants_values?.length ? { variantLabel: variant.variants_values.join(" / ") } : {}),
        };

        // Update items
        setSelectedItems([newItem]);

        // Automatically trigger form submission after a short delay to allow React state to settle
        setTimeout(() => {
            if (checkoutFormRef.current) {
                checkoutFormRef.current.submitForm();
            }
        }, 150);
    };

    // When the user clicks the "Kash on delivery" button on ProductDetail, scroll them to the form
    const handleScrollToForm = () => {
        if (checkoutSectionRef.current) {
            checkoutSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleRemoveItem = () => {
        // Direct checkout doesn't allow removing the main product. Reset to qty 1 instead.
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
        <div>
            <ProductDetail
                product={product}
                relatedProducts={relatedProducts}
                subCategoryId={subCategoryId}
                isDirectCheckout={true}
                onDirectCheckoutAdd={handleScrollToForm}
            />

            <div id="checkout-form-section" className="bg-transparent dark:bg-gray-900 rounded-xl shadow-sm border border-primary/10">

                <div className="p-2 md:p-6" ref={checkoutSectionRef}>
                    {selectedItems.length > 0 && (
                        <CheckoutFormSection
                            ref={checkoutFormRef}
                            items={selectedItems}
                            removeItem={handleRemoveItem}
                            updateItemQuantity={handleUpdateQuantity}
                            onBeforeSubmit={handleBeforeSubmit}
                            hideCartSummary={true}
                        />
                    )}
                </div>
            </div>


            {/* Variant Select Modal */}
            <VariantSelectModal
                isOpen={isVariantModalOpen}
                product={product}
                variants={product.variantsId || []}
                variantsGroup={product.variantsGroup || []}
                onClose={() => setIsVariantModalOpen(false)}
                onSelect={handleDirectCheckoutAdd as any}
            />
        </div>
    );
}
