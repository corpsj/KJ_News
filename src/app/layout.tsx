import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "광전타임즈",
  description:
    "광전타임즈 - 정치, 경제, 사회, 문화, 국제, IT/과학, 스포츠 등 빠르고 정확한 뉴스를 전합니다.",
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
      </body>
    </html>
  );
}
