import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LandingPopup from "@/components/LandingPopup";
import { getCategories } from "@/lib/db";
import { SITE_URL, SITE_NAME, PRESS_INFO } from "@/lib/constants";

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/brand/KJ_sloganLogo.png`,
    },
    email: PRESS_INFO.email,
    telephone: PRESS_INFO.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: PRESS_INFO.address,
      addressCountry: "KR",
    },
  },
];

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gray-900 focus:text-white focus:rounded-lg focus:text-sm"
      >
        본문으로 바로가기
      </a>
      <Header categories={categories} />
      <main id="main-content" className="min-h-screen">{children}</main>
      <Footer categories={categories} />
      <LandingPopup />
    </>
  );
}
