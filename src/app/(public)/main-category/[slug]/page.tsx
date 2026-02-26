// app/main-category/[slug]/page.tsx
'use server'

import React from 'react'
import { publicApi } from '@/lib/api/publicApi'
import { makeStore } from '@/lib/store'
import { Product } from '@/types/product'
import MainCategoryPage from './components/MainCategoryPage'

type SearchParams = {
    page?: string;
    limit?: string;
};

// Function to create slug from category name
const createSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export default async function MainCategoryPageServer({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const store = makeStore()

    const resolvedParams = await params;
    const { page: pageStr = '1', limit: limitStr = '20' } = await searchParams ?? {};

    const page = parseInt(pageStr) || 1;
    const limit = parseInt(limitStr) || 20;

    console.log('Server params.slug:', resolvedParams.slug);
    console.log('Server page:', page, 'limit:', limit);

    try {
        // Fetch business categories
        const businessRes = await store.dispatch(
            publicApi.endpoints.getBusiness.initiate(undefined, { forceRefetch: true })
        )

        // Fetch all products
        const productsRes = await store.dispatch(
            publicApi.endpoints.getProducts.initiate({ page: 1, limit: 500 }, { forceRefetch: true })
        )

        let business = null;
        let mainCategory = null;
        let mainCategoryId = null;

        if (businessRes.data) {
            // Check if data is array or single object
            if (Array.isArray(businessRes.data)) {
                business = businessRes.data.find(b => b.categories && b.categories.length > 0) || businessRes.data[0] || null;
            } else {
                business = businessRes.data;
            }

            // Find main category by slug (name matching)
            if (business?.categories) {
                mainCategory = business.categories.find(cat => {
                    const categorySlug = createSlug(cat.name);
                    return categorySlug === resolvedParams.slug.toLowerCase();
                });

                if (mainCategory) {
                    mainCategoryId = mainCategory._id;
                }
            }
        }

        const products: Product[] = Array.isArray(productsRes.data)
            ? JSON.parse(JSON.stringify(productsRes.data))
            : [];

        console.log('Server mainCategory:', mainCategory);
        console.log('Server mainCategoryId:', mainCategoryId);
        console.log('Server products count:', products.length);

        return <MainCategoryPage
            business={business}
            initialProducts={products}
            mainCategory={mainCategory}
            mainCategoryId={mainCategoryId}
            page={page}
            limit={limit}
        />
    } catch (error) {
        console.error('Server error:', error);
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600">Error loading category. Please try again.</p>
            </div>
        )
    }
}