"use client";
import { useState } from "react";
import { HiSparkles, HiLightningBolt } from "react-icons/hi";
import { CountdownTimer } from "./CountdownTimer";
import { LiveViews } from "./Liveviews";
import { FiThumbsUp } from "react-icons/fi";
import SizeGuardModal from "./SizeGuardModal";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/atoms/button";

interface ProductPricingProps {
    finalPrice: number;
    sellingPrice: number;
    stock: number;
    discountPercent: number;
    isDiscountActive: boolean;
    discountStartDate?: string;
    discountEndDate?: string;
    product: Product;
}

export default function ProductPricing({
    finalPrice,
    sellingPrice,
    stock,
    discountPercent,
    isDiscountActive,
    discountStartDate,
    discountEndDate,
    product,
}: ProductPricingProps) {
    const [isSizeGuardModalOpen, setIsSizeGuardModalOpen] = useState(false);
    const displayPrice = finalPrice;

    return (
        <div className="space-y-3 md:space-y-4 mt-2 sm:mb-2">
            <div className="flex flex-row items-center justify-between gap-1 md:gap-2">
                <div className="bg-primary dark:bg-black py-1 rounded-full items-center md:gap-4 text-xs text-gray-600 hidden md:block font-semibold">
                    <LiveViews initialCount={10} />
                </div>

                {/* Badges */}
                {stock > 0 && stock <= 10 && (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center animate-pulse">
                        <HiLightningBolt />
                        Almost Gone!
                    </span>
                )}
                <span className="bg-primary dark:bg-primary text-white text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center">
                    <HiSparkles />
                    Premium Quality
                </span>
                <span className="flex items-center bg-white px-2 py-1.5 rounded-full text-primary dark:text-primary text-xs">
                    <FiThumbsUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    89% recommend
                </span>

            </div>

            {/* Pricing Section */}
            <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="text-2xl md:text-4xl font-bold text-primary dark:text-white">
                        ৳{displayPrice.toFixed(2)}
                    </span>
                    {isDiscountActive && discountPercent > 0 && (
                        <span className="line-through text-gray-400 text-base md:text-xl">
                            ৳{sellingPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {product.sizeGuard?.table && product.sizeGuard.table.length > 0 && (
                    <button
                        onClick={() => setIsSizeGuardModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground bg-background transition-all hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                        type="button"
                        aria-haspopup="dialog"
                    >
                        <svg
                            className="w-4 h-4"
                            aria-hidden="true"
                            focusable="false"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                d="M18.9836 5.32852L14.6715 1.01638L1.01638 14.6715L5.32852 18.9836L18.9836 5.32852ZM15.3902 0.297691C14.9933 -0.0992303 14.3497 -0.0992303 13.9528 0.297691L0.297691 13.9528C-0.0992301 14.3497 -0.0992305 14.9932 0.297691 15.3902L4.60983 19.7023C5.00675 20.0992 5.65029 20.0992 6.04721 19.7023L19.7023 6.04721C20.0992 5.65029 20.0992 5.00675 19.7023 4.60983L15.3902 0.297691Z"
                                fillRule="evenodd"
                            />
                            <path d="M11.7863 2.67056C11.9848 2.4721 12.3065 2.4721 12.505 2.67056L14.4237 4.58927C14.6222 4.78774 14.6222 5.1095 14.4237 5.30796C14.2252 5.50642 13.9035 5.50642 13.705 5.30796L11.7863 3.38925C11.5878 3.19079 11.5878 2.86902 11.7863 2.67056Z" />
                            <path d="M8.93891 5.36331C9.13737 5.16485 9.45914 5.16485 9.6576 5.36331L11.5763 7.28202C11.7748 7.48048 11.7748 7.80225 11.5763 8.00071C11.3779 8.19917 11.0561 8.19917 10.8576 8.00071L8.93891 6.082C8.74045 5.88354 8.74045 5.56177 8.93891 5.36331Z" />
                            <path d="M6.24307 8.20742C6.44153 8.00896 6.76329 8.00896 6.96175 8.20742L8.88047 10.1261C9.07893 10.3246 9.07893 10.6464 8.88047 10.8448C8.68201 11.0433 8.36024 11.0433 8.16178 10.8448L6.24307 8.92611C6.0446 8.72765 6.0446 8.40588 6.24307 8.20742Z" />
                            <path d="M3.37296 10.8776C3.57142 10.6791 3.89319 10.6791 4.09165 10.8776L6.01036 12.7963C6.20882 12.9948 6.20882 13.3165 6.01036 13.515C5.8119 13.7134 5.49013 13.7134 5.29167 13.515L3.37296 11.5963C3.1745 11.3978 3.1745 11.076 3.37296 10.8776Z" />
                        </svg>
                        <span>Sizing guide</span>
                    </button>
                )}
            </div>

            {isDiscountActive && discountPercent > 0 && (
                <div className="mt-1 md:mt-2 flex items-center gap-1 md:gap-2">
                    <span className="bg-primary dark:bg-primary text-white text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                        {discountPercent}% OFF
                    </span>
                    <span className="text-xs md:text-sm text-black dark:text-gray-200">
                        Save ৳{(sellingPrice - finalPrice).toFixed(2)}
                    </span>
                </div>
            )}

            {isDiscountActive && discountEndDate && (
                <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
                    <div className="text-xs md:text-sm text-primary dark:text-primary font-semibold">
                        <CountdownTimer endDate={discountEndDate} />
                    </div>
                </div>
            )}
            <SizeGuardModal
                isOpen={isSizeGuardModalOpen}
                onClose={() => setIsSizeGuardModalOpen(false)}
                sizeGuard={product.sizeGuard || null}
            />
        </div>
    );
}