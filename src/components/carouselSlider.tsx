'use client';
import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Autoplay, Pagination } from 'swiper/modules';
import { useBusiness } from '@/hooks/useBusiness';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CarouselSlider() {
    const { businessData } = useBusiness();
    const router = useRouter();
    const CATEGORIES = businessData?.categories.slice(0, 5) ?? [];
    const progressCircle = useRef<SVGSVGElement | null>(null);
    const progressContent = useRef<HTMLSpanElement | null>(null);

    const DEFAULT_IMAGE = '/assets/placeholder.jpg';

    // Function to get a fallback image from subcategories if the main category lacks an image
    const getCategoryImage = (category: any) => {
        if (category.image?.optimizeUrl) {
            return category.image.optimizeUrl;
        }
        const subCategoryWithImage = category.children?.find((child: any) => child.image?.optimizeUrl);
        return subCategoryWithImage?.image?.optimizeUrl || DEFAULT_IMAGE;
    };

    const onAutoplayTimeLeft = (_: import('swiper').Swiper, time: number, progress: number) => {
        if (progressCircle.current && progressContent.current) {
            progressCircle.current.style.setProperty('--progress', String(1 - progress));
            progressContent.current.textContent = `${Math.ceil(time / 1000)}s`;
        }
    };

    return (
        <div className="">
            <div className="relative w-full overflow-hidden h-52 md:h-[400px] lg:h-[700px] ">
                <section className="w-full h-full">
                    <Swiper
                        spaceBetween={0}
                        centeredSlides={true}
                        autoplay={{ delay: 2500, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        navigation={false}
                        modules={[Autoplay, Pagination]}
                        onAutoplayTimeLeft={onAutoplayTimeLeft}
                        className="mySwiper w-full h-full"
                    >
                        {[
                            { src: '/upload/images/4-117545.webp', alt: 'banner1' },
                            { src: '/upload/images/3-805211.webp', alt: 'banner2' },
                            { src: '/upload/images/2-819003.webp', alt: 'banner3' },
                            { src: '/upload/images/1-653128.webp', alt: 'banner4' },
                            // { src: '/assets/banner/durgapuja2.png', alt: 'banner4' },
                            // { src: '/assets/banner/durgapuja2.png', alt: 'banner4' },
                            // { src: '/assets/banner/durgapuja2.png', alt: 'banner4' },

                        ].map((slide, index) => (
                            <SwiperSlide key={index}>
                                <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center">
                                    <div className="w-full h-full flex-shrink-0">
                                        <Image
                                            src={process.env.NEXT_PUBLIC_IMAGE_URL + slide.src}
                                            // src={slide.src}
                                            alt={slide.alt}
                                            width={1900}
                                            height={600}
                                            className="object-cover"
                                            priority={true}
                                            quality={100}
                                        />
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            </div>
        </div>
    );
}