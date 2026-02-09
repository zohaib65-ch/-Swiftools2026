"use client";

import { useState, useEffect } from "react";
import CardsPage from "@/components/Cards";
import Navbar from "@/components/Navbar";
import Faqs from "@/components/Faqs";
import Footer from "@/components/Footer";
import CustomFooter from "@/components/CustomFooter";

export default function Home() {
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // 🔁 Animated placeholder texts
  const placeholders = [
    "Image Converter",
    "Watermark Adder",
    "Bulk Image Resizer",
    "UUID Generator",
  ];

  // 🔄 Rotate placeholder (pause when typing)
  useEffect(() => {
    if (query) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [query]);

  const handleSearch = () => {

    const search = query.trim().toLowerCase();
    if (!search) return;

    const words = search.split(/\s+/);
    const cards = document.querySelectorAll("[data-tool-name]");

    for (const card of cards) {
      if (!(card instanceof HTMLElement)) continue;
      
      const name = card.dataset.toolName?.toLowerCase() || "";
      const matched = words.some((word) => name.includes(word));

      if (matched) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        card.classList.add("ring-2", "ring-gray-200");
        setTimeout(() => {
          card.classList.remove("ring-2", "ring-gray-200");
        }, 1500);

        break;
      }
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-r from-[#f8f7ff] via-[#fff7f7] to-[#fffdf5]">
      <Navbar />

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-32 text-center">
        <span className="mb-6 rounded-full bg-white text-black px-4 py-1 text-sm shadow">
          ✨ Introducing SwiftTools 1.0
        </span>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-gray-900 md:text-7xl">
          One toolbox, every <span className="text-blue-600">digital task</span>.
        </h1>

        <p className="mt-6 max-w-2xl text-gray-500 text-sm">
          The all-in-one toolbox that fits your daily workflow.
          Incredibly fast, privacy-focused, and built to handle
          every digital task in seconds.
        </p>

        {/* Search */}
        <div className="mt-10 w-full max-w-md">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow">
            <svg
              className="h-5 w-5 text-gray-800 cursor-pointer"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              onClick={handleSearch} // click triggers search
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              placeholder={query ? query : `Search for ${placeholders[placeholderIndex]}`}
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="w-full bg-transparent text-sm outline-none text-black placeholder-gray-400"
            />

          </div>
        </div>

        {/* Privacy Banner */}
        <div className="mt-12 w-full max-w-4xl relative overflow-hidden rounded-2xl bg-linear-to-r from-cyan-400 via-blue-400 via-purple-300 via-orange-200 via-green-200 to-emerald-300 p-8 text-left shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xl font-medium text-gray-900 drop-shadow-sm">100% Privacy</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
              The only platform you'll truly love.
            </h2>
            <p className="mt-4 text-sm font-medium italic text-gray-700 opacity-80">
              Swifttools processes your files without storing them. <span className="font-bold">Zero storage. Zero tracking. Zero unpleasant surprises.</span>
            </p>
          </div>
          
          {/* Heart Graphic */}
          <div className="absolute top-1/2 -right-12 -translate-y-1/2 opacity-90 select-none pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="black">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center animate-fade-in-up">
          <a href="/tools" className="px-6 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-all hover:scale-105 shadow-lg">
            Explore All Tools
          </a>
          <a href="/pricing" className="px-6 py-3 rounded-full bg-white text-gray-900 border border-gray-200 font-medium hover:bg-gray-50 transition-all hover:scale-105 shadow-sm">
            See Pricing
          </a>
        </div>

      </section>
      <CardsPage />
      <Faqs />
      <Footer />
      <CustomFooter />
    </main>
  );
}
