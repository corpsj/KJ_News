"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminProvider } from "@/contexts/AdminContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }

  return <>{children}</>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[#fafafa]">
          <div className="hidden md:block">
            <AdminSidebar />
          </div>

          <button
            className="md:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {mobileOpen && (
            <>
              <div
                className="md:hidden fixed inset-0 bg-black/30 z-[55]"
                onClick={() => setMobileOpen(false)}
              />
              <div className="md:hidden fixed left-0 top-0 bottom-0 z-[60]">
                <AdminSidebar onMobileClose={() => setMobileOpen(false)} />
              </div>
            </>
          )}

          <div className="md:ml-[220px]">
            <AdminHeader />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </AdminProvider>
  );
}

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <AdminShell>{children}</AdminShell>
      </AuthGate>
    </AuthProvider>
  );
}
