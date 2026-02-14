import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 — 광전타임즈 CMS",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
