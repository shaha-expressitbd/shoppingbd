'use client';

import Image from 'next/image';
import React from 'react';


interface PromotionBannerProps {
  className?: string;
  alt?: string;
}

const PromotionBanner: React.FC<PromotionBannerProps> = ({
  className,
  alt = "[ Promotion Banner ]",
}) => {
  return (
    <div className={`w-full overflow-hidden mt-0 md:mt-16 ${className || ''}`}>
      <Image
        src='/assets/Ready-2-01.png'
        // src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/upload/images/durgapuja1-118645.webp`}
        alt={alt}
        width={1920}
        height={1080}
        className="w-full h-auto"
        objectFit="cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw"
        priority
        quality={100}
      />
    </div>
  );
};

export default PromotionBanner;