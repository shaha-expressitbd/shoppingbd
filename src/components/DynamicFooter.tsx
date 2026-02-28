'use client'

import { Business } from '@/types/business'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

interface DynamicFooterProps {
    business: Business
}

const DynamicFooter = function DynamicFooter({ business }: DynamicFooterProps) {
    const pathname = usePathname()

    // Paths where footer should not be rendered
    const hideFooterPaths = [
        '/products',
        '/product',
        '/checkout',
        '/orderstatus',
        '/directcheckout',
        // Add more paths as needed
    ]

    // Check if current path matches any hide path
    const shouldHide = hideFooterPaths.some(path => pathname.startsWith(path))

    if (shouldHide) {
        return null
    }

    return <Footer business={business} />
}

export default DynamicFooter
