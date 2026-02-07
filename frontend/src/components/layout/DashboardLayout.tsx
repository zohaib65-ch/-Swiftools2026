"use client";

import { useState } from "react";
import Sidebar from "../Sidebar";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-linear-to-r from-[#fdfcff] via-[#fff5f5] to-[#fffdf5]">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "sm:ml-64" : "sm:ml-16"
          }`}
      >
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md shadow-sm px-4 py-3 flex justify-between items-center">
          <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
            {/* Spacer or Breadcrumb */}
          </div>
          <div className="flex items-center gap-2 absolute left-4">
            {/* Logo if needed here, but Sidebar covers it usually, or we keep top nav */}
            <Image src="/logo.png" alt="Logo" width={120} height={30} className="hidden sm:block" />
          </div>

          <div className="cursor-pointer flex items-center gap-4 ml-auto">
            {session && (
              <Link
                href="/dashboard"
                className="cursor-pointer w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-semibold"
              >
                {session.user?.name?.charAt(0) || "U"}
              </Link>
            )}
          </div>
        </header>

        <div className="mt-20 px-4 py-6 mb-14">
          {children}
        </div>
      </div>
    </div>
  );
}
