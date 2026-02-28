import type { Product, Variant } from "@/types/product";
import { MediaItem } from "../../_component/MediaGallery";
import ProductPricing from "../../_component/ProductPricing";
import ProductTabs from "../../_component/ProductTabs";
import QuantityControls from "../../_component/QuantityControls";
import { ProductHeader } from "./ProductHeader";

interface ProductContentProps {
    product: Product;
    selectedVariant: Variant | null;
    quantity: number;
    stock: number;
    finalPrice: number;
    sellingPrice: number;
    discountPercent: number;
    discountStartDate?: Date;
    discountEndDate?: Date;
    isPreOrder: boolean;
    isDiscountActive: boolean;
    activeTab: string;
    allMedia: MediaItem[];
    onQuantityChange: (val: number) => void;
    onAddToCart: () => boolean;
    onVariantMissing: () => void;
    onWishlistVariantMissing: () => void;
    setActiveTab: (tab: string | ((prevState: string) => string)) => void;
    isDirectCheckout?: boolean;
}

export function ProductContent({
    product,
    selectedVariant,
    quantity,
    stock,
    finalPrice,
    sellingPrice,
    discountPercent,
    discountStartDate,
    discountEndDate,
    isPreOrder,
    isDiscountActive,
    activeTab,
    allMedia,
    onQuantityChange,
    onAddToCart,
    onVariantMissing,
    onWishlistVariantMissing,
    setActiveTab,
    isDirectCheckout,
}: ProductContentProps) {
    return (
        <div className={`w-full lg:max-w-[700px] lg:w-full px-2 md:px-4 lg:col-span-5 ${allMedia.length === 2 ? "" : "md:sticky md:top-24 md:self-start md:h-fit"}`}>

            <ProductHeader name={product.name} />

            <ProductPricing
                finalPrice={finalPrice}
                sellingPrice={sellingPrice}
                stock={stock}
                discountPercent={discountPercent}
                isDiscountActive={isDiscountActive}
                discountStartDate={discountStartDate?.toISOString()}
                discountEndDate={discountEndDate?.toISOString()}
                product={product}
            />

            <div className="md:pb-2">
                <QuantityControls
                    quantity={quantity}
                    stock={stock}
                    onQuantityChange={onQuantityChange}
                    product={product}
                    variant={selectedVariant}
                    isDiscountActive={isDiscountActive}
                    finalPrice={finalPrice}
                    sellingPrice={sellingPrice}
                    onAddToCart={onAddToCart}
                    onVariantMissing={onVariantMissing}
                    onWishlistVariantMissing={onWishlistVariantMissing}
                    buttonText={isPreOrder ? "প্রি-অর্ডার করুন" : "ক্যাশ অন ডেলিভারিতে অর্ডার করুন"}
                    buttonTitle={isPreOrder ? "Pre-order product" : "Add to Cart"}
                    isDirectCheckout={isDirectCheckout}
                />
            </div>
            <div>
                <p className="text-sm text-gray-500"> বিঃদ্রঃ: আপনার কম্পিউটার বা মোবাইল স্ক্রীন রেজুলেশন উপর নির্ভর করে, পণ্যের রঙ সামান্য পরিবর্তিত হতে পারে।</p>
            </div>

            <ProductTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                shortDescription={product.short_description}
                longDescription={product.long_description}
                stock={stock}
                variantsCount={product.variantsId.length}
            />
        </div>
    );
}
