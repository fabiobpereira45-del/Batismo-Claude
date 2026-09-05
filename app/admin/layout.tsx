"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Rotas de login não utilizam a barra lateral
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/login-master";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#070a12] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      <AdminSidebar />
      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-mesh-dark">
        {children}
      </main>
    </div>
  );
}
