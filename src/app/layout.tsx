import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/constants";
import { Analytics } from "@vercel/analytics/react";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "광전타임즈",
    template: "%s - 광전타임즈",
  },
  description:
    "광전타임즈 - 정치, 경제, 사회, 문화, 국제, IT/과학, 스포츠 등 빠르고 정확한 뉴스를 전합니다.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: "광전타임즈",
    description:
      "광전타임즈 - 정치, 경제, 사회, 문화, 국제, IT/과학, 스포츠 등 빠르고 정확한 뉴스를 전합니다.",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "광전타임즈",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "광전타임즈",
    description:
      "광전타임즈 - 정치, 경제, 사회, 문화, 국제, IT/과학, 스포츠 등 빠르고 정확한 뉴스를 전합니다.",
    images: [DEFAULT_OG_IMAGE],
  },
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} bg-gray-50 antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
