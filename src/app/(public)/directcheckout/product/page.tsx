import { publicApi } from "@/lib/api/publicApi";
import { makeStore } from "@/lib/store";
import { notFound } from "next/navigation";
import DirectCheckoutWrapper from "./_components/DirectCheckoutWrapper";

// Fetch product and related products by ID
async function getProductWithRelated(productId: string, relatedProductLimit: number = 8) {
    const store = makeStore();
    const res = await store.dispatch(
        publicApi.endpoints.getProductWithRelated.initiate({ productId, relatedProductLimit })
    );
    return res.data || null;
}

export default async function DirectCheckoutPage({
    searchParams,
}: {
    searchParams: Promise<{ id?: string }>;
}) {
    const resolvedSearchParams = await searchParams;

    if (!resolvedSearchParams.id) {
        console.error("No product ID provided in query parameters");
        return notFound();
    }

    const data = await getProductWithRelated(resolvedSearchParams.id);
    const product = data?.product;

    if (!product) {
        console.error("Product not found for ID:", resolvedSearchParams.id);
        return notFound();
    }

    return (
        <div className="bg-secondary dark:bg-secondary">
            <DirectCheckoutWrapper
                product={product}
                relatedProducts={data?.related_products || []}
                subCategoryId={product.sub_category?.[0]?._id || ""}
            />
        </div>
    );
}
