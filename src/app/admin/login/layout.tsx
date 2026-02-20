import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 — 광전타임즈",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
