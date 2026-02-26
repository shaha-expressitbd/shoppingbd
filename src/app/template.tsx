// app/template.tsx

import { notosans, ubuntuRegular } from "@/lib/fonts";
import { AppProviders } from "@/lib/Provider/AppProvider";
import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

// Site constants
const SITE_URL = "https://Shoppingbd.com.bd";
const OG_IMAGE_URL = `/assets/mega-logo.png`;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const TAG_SERVER = process.env.NEXT_PUBLIC_TAG_SERVER;
const GOOGLE_SITE_VERIFICATION_CODE =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_CODE;

export const metadata: Metadata = {
  title: "Shoppingbd_girl| Your Ultimate Shopping Destination",
  description:
    "Discover unbeatable deals on electronics, fashion, home goods & more at Shoppingbd!",
  verification: {
    google: GOOGLE_SITE_VERIFICATION_CODE,
  },
  openGraph: {
    title: "Shoppingbd_girl| Your Ultimate Shopping Destination",
    description:
      "Discover unbeatable deals on electronics, fashion, home goods & more at Shoppingbd!",
    url: SITE_URL,
    siteName: "Shoppingbd",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Shoppingbd_girllogo on shopping-cart background",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shoppingbd_girl| Your Ultimate Shopping Destination",
    description:
      "Discover unbeatable deals on electronics, fashion, home goods & more at Shoppingbd!",
    images: [OG_IMAGE_URL],
  },
};

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={ubuntuRegular.className}
    >
      <head>
        <title>Shoppingbd | Your Ultimate Shopping Destination</title>
        <meta
          name="facebook-domain-verification"
          content={`${process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION}`}
        />
        {/* <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          (function(w,d,s,l,i){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s);
            j.async=true;
          j.src="${TAG_SERVER}?"+i;f.parentNode.insertBefore(j,f);})
            (window,document,'script','dataLayer','${GTM_ID}');
        `,
          }}
        /> */}
        <Script
          id="fb-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `

!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '907602542232309');
fbq('track', 'PageView');

        `,
          }}
        />
      </head>
      <body className={`${notosans.className} w-full max-w-screen h-screen`}>
        <AppProviders>
          <main className="bg-white dark:bg-gray-800 cursor-default">
            <Toaster richColors position="top-center" closeButton />
            {children}
            {/* <ConsentManager /> */}
          </main>
        </AppProviders>

        {/* Scroll Depth Tracking Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            if (typeof window === 'undefined' || window.__scrollDepthTracked) return;
            window.__scrollDepthTracked = true;
            var depths = [25, 50, 75, 100];
            var fired = {};
            function trackScrollDepth() {
              var scrollTop = window.scrollY || window.pageYOffset;
              var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
              var winHeight = window.innerHeight;
              var scrolled = ((scrollTop + winHeight) / docHeight) * 100;
              depths.forEach(function(depth) {
                if (!fired[depth] && scrolled >= depth) {
                  fired[depth] = true;
                  if (window.dataLayer) {
                    window.dataLayer.push({ event: 'scroll_depth', percent: depth });
                  }
                }
              });
            }
            window.addEventListener('scroll', trackScrollDepth);
          })();
        `,
          }}
        />
        {/* <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID as string} /> */}
        {/* <noscript>
          <iframe
            src={`${process.env.NEXT_PUBLIC_TAG_SERVER}/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript> */}

        {/* <GoogleTagManager gtmId="GTM-5DD74SGK" /> */}
        {/* <GoogleAnalytics gaId='G-S64FV5JQ3N' /> */}
      </body>
    </html>
  );
}
