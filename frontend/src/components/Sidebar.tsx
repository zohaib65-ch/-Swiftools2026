"use client";

import { Home, User, Cpu, FileText, ArrowRight, Pen } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full backdrop-blur-md shadow-lg p-3 transition-all duration-300 z-30
        ${sidebarOpen ? "w-56" : "w-14"} flex flex-col bg-white/80`}
    >
      <div className="flex items-center justify-between mb-4 mt-16">
        <button
          className="p-1 rounded hover:bg-gray-100"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ArrowRight
            className={`w-3.5 h-3.5 transform transition-transform duration-300 ${sidebarOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-3 mt-15">
        <Link
          href="/"
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
        >
          <Home className="w-4 h-4" />
          {sidebarOpen && <span className="text-sm">Home</span>}
        </Link>

        <Link
          href="/dashboard"
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
        >
          <Home className="w-4 h-4" />
          {sidebarOpen && <span className="text-sm">Dashboard</span>}
        </Link>

        <Link
          href="/account"
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
        >
          <User className="w-4 h-4" />
          {sidebarOpen && <span className="text-sm">Account</span>}
        </Link>

        <Link
          href="/tools"
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
        >
          <Cpu className="w-4 h-4" />
          {sidebarOpen && <span className="text-sm">Tools</span>}
        </Link>

        <Link
          href="/docs"
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
        >
          <Pen className="w-4 h-4" />
          {sidebarOpen && <span className="text-sm">API</span>}
        </Link>

        <Link
          href="/docs"
          className="cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
        >
          <FileText className="w-4 h-4" />
          {sidebarOpen && <span className="text-sm">Docs</span>}
        </Link>
      </nav>

      {sidebarOpen && (
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="cursor-pointer text-xs bg-black text-white px-2 py-1.5 rounded-md hover:text-gray-200 transition mt-auto mb-4"
        >
          Logout
        </button>
      )}
    </aside>
  );
}
