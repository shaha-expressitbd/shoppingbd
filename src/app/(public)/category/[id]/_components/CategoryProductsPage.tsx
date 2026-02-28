'use client';

import { Product } from '@/types/product';
import ProductCard from '@/components/ui/organisms/product-card';
import { FiGrid, FiPackage } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface Props {
    initialProducts?: Product[];
    category?: string;
    error?: string;
}

const ITEMS_PER_LOAD = 10;   // নতুন যোগ করলাম

export default function CategoryProductsPage({ initialProducts = [], category = '', error: serverError }: Props) {
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);   // এটা চেঞ্জ করলাম
    const [snowflakes, setSnowflakes] = useState<{ size: number; left: number; duration: number; delay: number }[]>([]);

    useEffect(() => {
        const flakes = Array.from({ length: 100 }).map((_, i) => {
            const size = Math.random() * 14 + 12;
            const left = Math.random() * 100;
            const duration = Math.random() * 20 + 20;
            const delay = Math.random() * 10;
            return { size, left, duration, delay };
        });
        setSnowflakes(flakes);
    }, []);

    const filtered = initialProducts;

    // শুধু visibleCount পর্যন্ত প্রোডাক্ট দেখাবে
    const currentProducts = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ITEMS_PER_LOAD);
    };

    return (
        <div className="min-h-screen bg-[#FFEBF0] dark:bg-gray-800 md:mt-16 mt-2">
            {/* তোমার পুরো হেডারটা আগের মতোই আছে – কোনো চেঞ্জ না */}
            <div className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary -top-2">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-red-800 to-primary" />
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {snowflakes.map((flake, i) => (
                        <span
                            key={i}
                            className="snowflake"
                            style={{
                                left: `${flake.left}%`,
                                fontSize: `${flake.size}px`,
                                animationDuration: `${flake.duration}s`,
                                animationDelay: `${flake.delay}s`,
                            }}
                        >
                            *
                        </span>
                    ))}
                </div>

                <div className="relative md:py-6 py-2 mx-auto max-w-7xl text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-1 md:mb-4 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
                        <FiGrid className="w-4 h-4" />
                        Category Collection
                    </div>
                    <h1 className="text-xl md:text-4xl lg:text-5xl font-bold text-white mb-1 md:mb-4 animate-fade-in capitalize">
                        {category || 'Category'}
                    </h1>
                    <p className="text-sm md:text-xl text-white/90 md:mb-4 mb-1 max-w-2xl mx-auto">
                        Discover our curated collection of premium products
                    </p>
                    <div className="flex items-center justify-center gap-4 text-white/80">
                        <div className="flex items-center gap-2">
                            <FiPackage className="w-5 h-5" />
                            <span className="md:text-lg text-sm font-semibold">
                                {filtered.length} Product{filtered.length !== 1 && 's'}
                            </span>
                        </div>
                        <div className="w-2 h-2 bg-white/50 rounded-full" />
                        <span className="text-sm">Premium Quality</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto md:py-4 md:px-2 py-1">
                {serverError ? (
                    // তোমার আগের error UI
                    <div className="text-center py-20" role="status" aria-live="polite">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6">
                            <FiPackage className="w-10 h-10 text-gray-400" aria-hidden="true" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                            Error Loading Products
                        </h3>
                        <p className="text-red-500 text-sm mt-2" role="alert">
                            {serverError}
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    // তোমার আগের empty UI
                    <div className="text-center py-20" role="status" aria-live="polite">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6">
                            <FiPackage className="w-10 h-10 text-gray-400" aria-hidden="true" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                            No Products Found
                        </h3>
                        <p className="text-gray-600 mb-1">
                            We couldn&apos;t find any products in this category.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid max-[345px]:grid-cols-1 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2 sm:gap-2 md:gap-4 w-full max-w-[1600px] mx-auto px-2 sm:px-4">
                            {currentProducts.map((product, idx) => (
                                <div
                                    key={product._id}
                                    className="animate-fade-in-up"
                                    style={{
                                        animationDelay: `${idx * 0.1}s`,
                                        animationFillMode: 'both',
                                    }}
                                    aria-label={`Product: ${product.name}`}
                                >
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>

                        {/* শুধু এই Load More বাটনটা যোগ করলাম – তোমার স্টাইলের সাথে মিলিয়ে */}
                        {hasMore && (
                            <div className="flex justify-center mt-10">
                                <button
                                    onClick={handleLoadMore}
                                    className="px-8 py-4 bg-primary t text-white font-bold rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                                >
                                    Load More ({visibleCount} of {filtered.length})
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}