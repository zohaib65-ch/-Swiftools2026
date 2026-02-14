"use client";
import Image from "next/image";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import introducing from "../../public/introducing.svg";
import toolsBox from "../../public/tools-box.svg";

interface HeroSectionProps {
  query: string;
  setQuery: (query: string) => void;
  placeholderIndex: number;
  placeholders: string[];
}

export default function HeroSection({ query, setQuery, placeholderIndex, placeholders }: HeroSectionProps) {
  return (
    <>
      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-32 text-center">
        <span className="mb-6 rounded-full flex items-center  bg-white text-black px-4 py-2 text-sm shadow">
          <Image src={introducing} alt="" width={116} height={28} />
          <span>SwiftTools 1.0</span>
        </span>
        <div className="py-6">
          <Image src={toolsBox} alt="" width={716} height={28} />
        </div>

        <p className="mt-6 max-w-2xl text-[#5B617A] text-sm font-normal">
          The all-in-one toolbox that fits your daily workflow. Incredibly fast, privacy-focused, and built to handle every digital task in seconds.
        </p>

        {/* Privacy Banner */}
        <div className="mt-12 w-full max-w-7xl relative overflow-hidden rounded-xl gradient-bg p-8 text-left shadow-sm">
          <div className="relative z-10 space-y-5">
            <span className="text-2xl font-medium mb-4 text-black drop-shadow-sm inline-block">100% Privacy</span>
            <div className="flex flex-wrap items-center text-3xl gap-1 text-black">
              <span className=" font-normal drop-shadow-sm">The only platform you'll</span>
              <h2 className=" font-semibold tracking-tight">truly love.</h2>
            </div>
            <p className="text-sm font-medium italic text-black opacity-80">
              Swifttools processes your files without storing them. <span className="font-bold">Zero storage. Zero tracking. Zero unpleasant surprises.</span>
            </p>
          </div>

          {/* Heart Graphic */}
          <div className="absolute top-28 -right-4 -translate-y-1/2 opacity-90 select-none pointer-events-none [transform:rotate(30deg)]">
            <svg width="280" height="280" viewBox="0 0 24 24" fill="black">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
        {/* CTAs */}
        {/* Search */}

        <div className="mt-10 w-full max-w-md">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-1.5 shadow">
            <Search className="text-[#333333]" />
            <div className="relative flex-1">
              <Input type="text" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} className="border-none px-0 bg-transparent focus:ring-0 text-black" />
              {query === "" && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="text-[#333333]">
                    Search for <span className="font-semibold">{placeholders[placeholderIndex]}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
