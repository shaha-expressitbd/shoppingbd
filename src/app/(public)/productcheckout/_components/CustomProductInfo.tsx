"use client";

import { useProductPricing } from "@/hooks/useProductPricing";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatCurrency";

interface CustomProductInfoProps {
    product: Product;
    onOrderClick: () => void;
    onVariantSelectionNeeded: () => void;
    selectedVariantId?: string;
}

export default function CustomProductInfo({
    product,
    onOrderClick,
    onVariantSelectionNeeded,
    selectedVariantId
}: CustomProductInfoProps) {

    // Determine the active variant (if any)
    const activeVariant = product.variantsId?.find(v => v._id === selectedVariantId) || null;

    // Leverage the existing pricing hook, passing the custom selected variant
    const pricingData = useProductPricing(product, activeVariant);

    return (
        <div className="flex flex-col space-y-6">
            {/* Product Title & Brand */}
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                    {product.name}
                </h1>
                {product.brand?.name && (
                    <p className="text-indigo-600 font-semibold mt-2">
                        ব্র্যান্ড: {product.brand.name}
                    </p>
                )}
            </div>

            {/* Price Display */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold text-indigo-600">
                        {formatCurrency(pricingData.finalPrice, product.currency || "BDT")}
                    </span>
                    {pricingData.isDiscountActive && pricingData.sellingPrice > pricingData.finalPrice && (
                        <span className="text-xl text-gray-400 line-through mb-1">
                            {formatCurrency(pricingData.sellingPrice, product.currency || "BDT")}
                        </span>
                    )}
                </div>
                {pricingData.isDiscountActive && pricingData.discountPercent > 0 && (
                    <span className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold w-max">
                        {pricingData.discountPercent}% ছাড়ে!
                    </span>
                )}
            </div>

            {/* Short Description */}
            {product.short_description && (
                <div className="text-gray-600 text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
            )}

            {/* Quick Properties */}
            <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-green-500"></span>
                    স্ট্যাটাস: <strong className="text-green-700">{pricingData.stock > 0 ? 'ইন-স্টক' : 'অফ-স্টক'}</strong>
                </li>

            </ul>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                {product.hasVariants && !selectedVariantId ? (
                    <button
                        onClick={onVariantSelectionNeeded}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-indigo-200"
                    >
                        ভ্যারিয়েন্ট বাছাই করুন
                    </button>
                ) : (
                    <button
                        onClick={onOrderClick}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-green-200 active:scale-[0.98]"
                    >
                        এখুনি অর্ডার করুন
                    </button>
                )}
            </div>
        </div>
    );
}
