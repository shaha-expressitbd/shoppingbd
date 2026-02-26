"use client";
import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Product } from "@/types/product";
import { useBusiness } from "@/hooks/useBusiness";
import { Category } from "@/types/business";
import ShopMobileHeader from "./mobile-header";
import ShopDesktopHeader from "./desktop-header";
import ShopProductsGrid from "./products-grid";
import ShopFilters from "./filters";
import { Pagination } from "@/components/ui/molecules/pagination";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface ShopAllProductsProps {
  initialProducts: Product[];
  minPrice?: number;
  maxPrice?: number;
  initialSearchParams?: {
    search?: string;
    sort?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    category?: string;
  };
}

function getAllDescendantIds(cat: Category): string[] {
  let ids: string[] = [cat._id];
  if (cat.children && cat.children.length > 0) {
    for (const child of cat.children) {
      ids = ids.concat(getAllDescendantIds(child));
    }
  }
  return ids;
}

function expandSelectedCategories(selectedIds: string[], categories: Category[]): string[] {
  const expanded = new Set<string>();
  selectedIds.forEach(id => {
    const category = findCategoryById(categories, id);
    if (category) {
      const descendants = getAllDescendantIds(category);
      descendants.forEach(descId => expanded.add(descId));
    }
  });
  return Array.from(expanded);
}

function findCategoryById(categories: Category[], id: string): Category | null {
  for (const cat of categories) {
    if (cat._id === id) return cat;
    if (cat.children) {
      const found = findCategoryById(cat.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getProductPrice(product: Product): number {
  const v = product.variantsId?.find((x) => Number(x.variants_stock) > 0) ?? product.variantsId?.[0];
  if (!v) return 0;

  const sell = Number(v.selling_price || 0);
  const offer = Number(v.offer_price || sell);
  const start = v.discount_start_date ? new Date(v.discount_start_date).getTime() : 0;
  const end = v.discount_end_date ? new Date(v.discount_end_date).getTime() : 0;
  const now = Date.now();
  const isOffer = offer < sell && now >= start && now <= end;

  return isOffer ? offer : sell;
}

export default function ShopAllProducts({
  initialProducts,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
  initialSearchParams = {},
}: ShopAllProductsProps) {
  const { businessData } = useBusiness();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categories: Category[] = businessData?.categories || [];
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize state from URL search params
  const initialCategoryIds = searchParams.get("category") || initialSearchParams.category;
  const initialSearchQuery = searchParams.get("search") || initialSearchParams.search || "";

  const initialSelectedCats = useMemo(() => {
    if (!initialCategoryIds) return [];
    // Parse comma-separated category IDs from URL - these are the directly selected IDs
    return initialCategoryIds.split(',').map(id => id.trim()).filter(id => id);
  }, [initialCategoryIds]);

  // State management
  const [sortBy, setSortBy] = useState<"name" | "price-low" | "price-high" | "newest">(() => {
    const sortParam = searchParams.get("sort") || initialSearchParams.sort;
    switch (sortParam) {
      case "name": return "name";
      case "price-low": return "price-low";
      case "price-high": return "price-high";
      default: return "newest";
    }
  });

  const [selectedCats, setSelectedCats] = useState<string[]>(initialSelectedCats);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Calculate min/max price from initial products
  const { minPrice, maxPrice } = useMemo(() => {
    if (initialMinPrice !== undefined && initialMaxPrice !== undefined)
      return { minPrice: initialMinPrice, maxPrice: initialMaxPrice };
    if (initialProducts.length === 0) return { minPrice: 0, maxPrice: 10000 };

    const prices = initialProducts.map(getProductPrice).filter((n) => !Number.isNaN(n));
    return {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 10000,
    };
  }, [initialProducts, initialMinPrice, initialMaxPrice]);

  // Initialize price range from URL params or calculated values
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const urlMin = searchParams.get("minPrice") || initialSearchParams.minPrice;
    const urlMax = searchParams.get("maxPrice") || initialSearchParams.maxPrice;

    if (urlMin && urlMax) {
      return [Number(urlMin), Number(urlMax)];
    }
    return [minPrice, maxPrice];
  });

  // Apply all filters and sorting to products
  const filteredProducts = useMemo(() => {
    let filtered = initialProducts.filter((product) => {
      const productPrice = getProductPrice(product);

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const searchIn = [
          product.name?.toLowerCase() || "",
          product.description?.toLowerCase() || "",
          product.brandId?.name?.toLowerCase() || "",
          ...(product.category_group?.map((cat) => cat.name?.toLowerCase()) || []),
          ...(product.variantsId?.map((v) => v.condition?.toLowerCase()) || []),
        ].join(" ");

        if (!searchIn.includes(query)) return false;
      }

      // Category filter
      if (selectedCats.length > 0) {
        const prodCatIds = (product.category_group || []).map((cat) => cat._id);
        if (!prodCatIds.some((id) => selectedCats.includes(id))) return false;
      }

      // Price range filter
      if (productPrice < priceRange[0] || productPrice > priceRange[1]) {
        return false;
      }

      // Size filter
      if (selectedSizes.length > 0) {
        const productSizes = product.variantsId?.flatMap((v) => v.variants_values || []) ?? [];
        if (!productSizes.some((size) => selectedSizes.includes(size))) {
          return false;
        }
      }

      // Brand filter from initial search params
      if (initialSearchParams.brand && product.brandId?.name !== initialSearchParams.brand) {
        return false;
      }

      // Condition filter from initial search params
      if (initialSearchParams.condition && product.condition !== initialSearchParams.condition) {
        return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const priceA = getProductPrice(a);
      const priceB = getProductPrice(b);

      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "price-low":
          return priceA - priceB;
        case "price-high":
          return priceB - priceA;
        case "newest":
        default:
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
      }
    });

    return filtered;
  }, [
    initialProducts,
    searchQuery,
    selectedCats,
    categories,
    priceRange,
    selectedSizes,
    sortBy,
    initialSearchParams.brand,
    initialSearchParams.condition
  ]);

  // Get current page products
  const currentPageProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Calculate pagination values
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // FIXED: URL update without infinite loop
  useEffect(() => {
    // Create the target URL
    const params = new URLSearchParams();

    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (selectedCats.length > 0) params.set('category', selectedCats.join(','));
    // if (priceRange[0] !== minPrice) params.set('minPrice', priceRange[0].toString());
    // if (priceRange[1] !== maxPrice) params.set('maxPrice', priceRange[1].toString());
    if (currentPage > 1) params.set('page', currentPage.toString());

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    // Only update if the URL has actually changed
    if (newUrl !== currentUrl) {
      console.log('Updating URL from:', currentUrl, 'to:', newUrl);
      router.push(newUrl, { scroll: false });
    }
  }, [searchQuery, sortBy, selectedCats, priceRange, currentPage, pathname, minPrice, maxPrice]); // REMOVED searchParams and router

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage === 1) return;
    setCurrentPage(1);
  }, [searchQuery, selectedCats, priceRange, selectedSizes, sortBy, categories]);

  // Handle loading state for page changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [currentPage]);

  // Event handlers
  const handleSortChange = useCallback((newSortBy: "name" | "price-low" | "price-high" | "newest") => {
    setSortBy(newSortBy);
  }, []);

  const handleSearchChange = useCallback((newSearchQuery: string) => {
    setSearchQuery(newSearchQuery);
  }, []);

  const handleCategoryChange = useCallback((newSelectedCats: string[]) => {
    setSelectedCats(newSelectedCats);
  }, []);

  const handleSizeChange = useCallback((newSelectedSizes: string[]) => {
    setSelectedSizes(newSelectedSizes);
  }, []);

  const handlePriceRangeChange = useCallback((newPriceRange: [number, number]) => {
    setPriceRange(newPriceRange);
  }, []);

  // Reset price range when min/max price changes
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  // Update sidebar width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (sidebarRef.current) {
        setSidebarWidth(sidebarRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCats([]);
    setSelectedSizes([]);
    setPriceRange([minPrice, maxPrice]);
    setSearchQuery("");
    setSortBy("newest");
    setCurrentPage(1);
  }, [minPrice, maxPrice]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopMobileHeader
        isMobileFiltersOpen={isMobileFiltersOpen}
        setIsMobileFiltersOpen={setIsMobileFiltersOpen}
        sortBy={sortBy}
        setSortBy={handleSortChange}
        selectedCats={selectedCats}
        selectedSizes={selectedSizes}
        searchQuery={searchQuery}
      />
      <div className="flex flex-col md:flex-row">
        <ShopFilters
          categories={categories}
          selectedCats={selectedCats}
          setSelectedCats={handleCategoryChange}
          selectedSizes={selectedSizes}
          setSelectedSizes={handleSizeChange}
          priceRange={priceRange}
          setPriceRange={handlePriceRangeChange}
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          initialProducts={initialProducts}
          filteredProductsCount={filteredProducts.length}
          clearAllFilters={clearAllFilters}
          isMobileFiltersOpen={isMobileFiltersOpen}
          setIsMobileFiltersOpen={setIsMobileFiltersOpen}
          sidebarRef={sidebarRef}
        />
        <main className="flex-1">
          <ShopDesktopHeader
            filteredAndSorted={filteredProducts}
            initialProducts={initialProducts}
            sortBy={sortBy}
            setSortBy={handleSortChange}
            totalFilteredCount={totalItems}
          />
          <div className="md:pb-16 lg:px-4">
            <ShopProductsGrid
              productsContainerRef={productsContainerRef}
              filteredAndSorted={currentPageProducts}
              initialProducts={initialProducts}
              clearAllFilters={clearAllFilters}
              containerWidth={typeof window !== "undefined" ? window.innerWidth - sidebarWidth : undefined}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 mb-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                />
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="md:fixed bottom-0 left-0 w-full bg-black py-2 text-center flex items-center justify-center gap-1 z-50">
              <p className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm sm:text-base">
                <span className="text-gray-400 text-sm dark:text-gray-300">Powered by:</span>
                <a
                  href="https://calquick.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <Image
                    height={100}
                    width={100}
                    src={"https://calquick.app/images/logo/logo-white.png"}
                    className="h-5 sm:h-6 w-auto object-contain"
                    alt="calquick-logo"
                    priority
                  />
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}