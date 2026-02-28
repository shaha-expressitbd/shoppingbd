import { Business } from '@/types/business'
import Link from 'next/link'
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa'
import { RiMessengerLine } from 'react-icons/ri'
import Image from './ui/atoms/image'

interface FooterProps {
  business: Business
}

const Footer = function Footer({ business }: FooterProps) {


  return (
    <footer className='w-full bg-black dark:bg-black'>
      {/* Thin red top border */}
      <div className='bg-rose-100'></div>

      <div className=' px-4 sm:px-6 py-10'>
        <div className='grid grid-cols-1 md:grid-cols-12 gap-8'>
          {/* Left: Logo + Text */}
          <div className='md:col-span-4 flex flex-col items-center md:items-start'>
            <Link href='/'>
              <Image
                src={business?.alterImage?.secure_url || '/assets/logo.png'}
                alt="G'Lore Logo"

                sizes='(max-width: 768px) 240px, 240px'
                className='w-60'
                loading='lazy'
                variant="small"
              />
            </Link>
            <p className='mt-6 text-sm leading-7 text-white dark:text-gray-200 text-center md:text-left'>
              আমাদের কালেকশন আপনাকে দেবে ফ্যাশনের আধুনিকতা এবং এলিগেন্সের একটি
              নিখুঁত সমন্বয়।
            </p>
          </div>
          {/* Explore More */}
          <div className='md:col-span-3'>
            <h4 className='font-semibold text-lg text-white dark:text-gray-200'>
              Explore More
            </h4>
            <ul className='mt-4 space-y-3 text-white dark:text-gray-200'>
              <li>
                <Link
                  href='/products/new'
                  className='hover:text-red-600 transition-colors'
                >
                  New Arrivals
                </Link>
              </li>

              <li>
                <Link
                  href='/about'
                  className='hover:text-red-600 transition-colors'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/faq'
                  className='hover:text-red-600 transition-colors'
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href='/support'
                  className='hover:text-red-600 transition-colors'
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
          {/* Policies */}
          <div className='md:col-span-3'>
            <h4 className='font-semibold text-lg text-white dark:text-gray-200'>
              Policies
            </h4>
            <ul className='mt-4 space-y-3 text-white dark:text-gray-200'>
              <li>
                <Link
                  href='/refund-policy'
                  className='hover:text-red-600 transition-colors'
                >
                  Return and Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/privacy-policy'
                  className='hover:text-red-600 transition-colors'
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href='/terms-of-service'
                  className='hover:text-red-600 transition-colors'
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href='/shipping-info'
                  className='hover:text-red-600 transition-colors'
                >
                  Shipping Info
                </Link>
              </li>
            </ul>
          </div>
          <div className='md:col-span-2'>
            <h4 className='font-semibold text-lg text-white dark:text-gray-200'>
              Get in Touch
            </h4>

            {/* Contact Info */}
            <div className='mt-4 space-y-2 text-white dark:text-gray-200'>
              <p>
                মোবাইল নং:{' '}
                <Link
                  href={`tel:${business?.phone}`}
                  className='hover:text-red-600 transition-colors'
                  prefetch={false}
                >
                  (+88) {business?.phone || ''}
                </Link>
              </p>
              <p className="text-base md:text-lg">
                ইমেইল:{' '}
                <Link
                  href={`mailto:${business?.email || ''}`}
                  className="hover:text-red-600 transition-colors md:break-words break-all"
                  prefetch={false}
                >
                  {business?.email || ''}
                </Link>
              </p>
            </div>

            {/* Social Links */}
            <div className='mt-5 flex items-center gap-4 text-white dark:text-gray-200'>
              <Link
                href="https://www.facebook.com/shoppersbd/"
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-red-600 transition-colors'
                aria-label='Facebook'
                prefetch={false}
              >
                <FaFacebookF size={20} />
              </Link>

              <Link
                href='https://www.facebook.com/messages/t/103492432014796'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-red-600 transition-colors'
                aria-label='Messenger'
                prefetch={false}
              >
                <RiMessengerLine size={20} />
              </Link>

              <Link
                href='https://wa.me/+8801322414142'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-red-600 transition-colors'
                aria-label='WhatsApp'
                prefetch={false}
              >
                <FaWhatsapp size={20} />
              </Link>

              <Link
                href='https://instagram.com'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-red-600 transition-colors'
                aria-label='Instagram'
                prefetch={false}
              >
                <FaInstagram size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='mt-12 border-t border-gray-200 dark:border-white pt-6'>
          <div className='flex flex-col items-center gap-4'>
            <div className='flex flex-row items-center gap-1 text-sm text-white dark:text-gray-200'>
              <p>© 2025 Powered by</p>
              {/* <a href='https://calquick.app' aria-label='Calquick'>
                <Image
                  src='https://calquick.app/images/logo/logo.png'
                  alt='CalQuick logo'
                  width={70}
                  height={20}
                  sizes='70px'
                  className='w-[70px] dark:hidden'
                  loading='lazy'
                />
              </a> */}
              <a href='https://calquick.app' aria-label='Calquick'>
                <Image
                  src='https://calquick.app/images/logo/logo-white.png'
                  alt='CalQuick logo'
                  width={70}
                  height={20}
                  sizes='70px'
                  className='w-[70px]'
                  loading='lazy'
                />
              </a>
            </div>
            <div className='flex gap-2 text-sm text-white dark:text-gray-200'>
              <span className='font-semibold'>Trade License Number:</span>
              <span>TRAD/DNCC/050278/2022</span>
            </div>
          </div>

          <div className='w-full mt-7 border-t border-gray-800 pt-6 md:mb-0 mb-20'>
            <div className='container mx-auto'>
              <a
                href='https://www.sslcommerz.com/'
                target='_blank'
                rel='noopener noreferrer'
                className='block'
              >
                <img
                  src='https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-03.png'
                  alt='SSLCommerz Payment Methods'
                  width={1600}
                  height={100}
                  sizes='100vw'
                  className='w-full'
                  loading='lazy'
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
