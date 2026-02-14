"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X, Coins } from "lucide-react";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Navigation items
  const navItems = [
    { href: "/tools", label: "Tools" },
    { href: "/use-cases", label: "Use cases" },
    { href: "/pricing", label: "Pricing" },
    { href: "/api", label: "API" },
    { href: "/docs", label: "Docs" },
  ];

  // Get user's initial
  const userInitial = session?.user?.name?.charAt(0).toUpperCase();

  // Fetch credits
  useEffect(() => {
    if (session?.accessToken) {
      fetch(`${BACKEND_URL}/users/me/stats`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch((err) => console.error("Failed to fetch credits", err));
    }
  }, [session]);

  if (!mounted) return <div className="h-16" />; // Placeholder with same height

  return (
    <header className="absolute top-3 left-0 right-0 z-40" suppressHydrationWarning>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 rounded-full bg-white backdrop-blur-xl shadow-2xl shadow-black/5 border border-white/20 px-6 transition-all duration-300 hover:shadow-xl hover:bg-white/80 hover:scale-[1.005]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <Image src="/logo.png" alt="Logo" width={130} height={40} className="group-hover:opacity-90 transition-opacity" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="text-black text-[13px] transition-colors hover:scale-105 transform">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!session?.user ? (
              <>
                <button onClick={() => router.push("/login")} className="text-xs font-medium text-gray-700 hover:text-black transition-colors">
                  Log in
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="rounded-full text-xs bg-black px-6 py-2.5 font-semibold text-white hover:bg-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Register
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {/* Credits Badge */}
                {credits !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100/50 border border-yellow-200 rounded-full text-xs font-semibold text-yellow-700">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{credits}</span>
                  </div>
                )}

                {/* Logout */}
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
                  Logout
                </button>
                {/* User Avatar */}
                <Link
                  href="/dashboard"
                  className="w-10 h-10 rounded-full bg-linear-to-br from-gray-800 to-black text-white flex items-center justify-center text-sm font-bold shadow-md hover:ring-2 ring-gray-200 transition-all"
                >
                  {userInitial}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-gray-700 hover:text-black focus:outline-none transition-transform hover:scale-110">
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed top-0 left-0 w-full h-full z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/5 backdrop-blur-xs" onClick={toggleMenu} />

        {/* Sidebar */}
        <div
          className={`flex flex-col justify-between fixed top-0 left-0 h-full w-72 bg-white/90 backdrop-blur-2xl shadow-2xl p-6 transition-transform duration-300 border-r border-white/20 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div>
            {/* Logo */}
            <div className="flex items-center justify-between mb-8">
              <Image
                src="/logo.png"
                alt="Logo"
                width={140}
                height={140}
                className="cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
                onClick={() => {
                  router.push("/");
                  setIsOpen(false);
                }}
              />
              <button onClick={toggleMenu} className="text-gray-500 hover:text-black p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col gap-2 text-gray-700 font-medium">
              <Link href={"/tools"} onClick={() => setIsOpen(false)} className="px-4 py-3 rounded-xl hover:bg-gray-100 hover:text-black transition-all flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Tools
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/pricing" className="px-4 py-3 rounded-xl hover:bg-gray-100 hover:text-black transition-all">
                Pricing
              </Link>
              <Link onClick={() => setIsOpen(false)} href="/docs" className="px-4 py-3 rounded-xl hover:bg-gray-100 hover:text-black transition-all">
                API
              </Link>
            </nav>
          </div>

          {/* Actions */}
          <div className="mb-4 flex flex-col gap-4">
            <div className="bg-gray-200 w-full h-px"></div>

            {!session?.user ? (
              <>
                <button
                  onClick={() => {
                    router.push("/login");
                    setIsOpen(false);
                  }}
                  className="w-full py-3 text-gray-700 font-medium hover:text-black transition-colors rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200"
                >
                  Log in
                </button>

                <button
                  onClick={() => {
                    router.push("/signup");
                    setIsOpen(false);
                  }}
                  className="w-full rounded-full bg-black py-3.5 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                >
                  Register
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Mobile Credits */}
                {credits !== null && (
                  <div className="flex items-center justify-between px-3 py-2 bg-yellow-50 rounded-xl text-yellow-700 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      <span>Credits</span>
                    </div>
                    <span>{credits}</span>
                  </div>
                )}
                <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                  <span className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold uppercase shadow-sm">{userInitial}</span>
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-semibold text-sm">{session.user.name}</span>
                    <span className="text-gray-500 text-xs">View Dashboard</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
