"use client";

import { useState, useEffect } from "react";
import CardsPage from "@/components/Cards";
import Navbar from "@/components/Navbar";
import Faqs from "@/components/Faqs";
import Footer from "@/components/Footer";
import CustomFooter from "@/components/CustomFooter";
import HeroSection from "@/components/heroSection";
import { Cardsections } from "@/lib/tools";
export default function Home() {
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [filteredSections, setFilteredSections] = useState(Cardsections);

  // 🔁 Animated placeholder texts
  const placeholders = ["Image Converter", "Watermark Adder", "Bulk Image Resizer", "UUID Generator"];

  // 🔄 Rotate placeholder (pause when typing)
  useEffect(() => {
    if (query) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [query]);

  // Live search filtering
  useEffect(() => {
    if (query.trim() === "") {
      setFilteredSections(Cardsections);
    } else {
      const search = query.trim().toLowerCase();
      const words = search.split(/\s+/);
      const filtered = Cardsections.map((section) => ({
        ...section,
        tools: section.tools.filter((tool) => {
          const name = tool.name.toLowerCase();
          return words.some((word) => name.includes(word));
        }),
      })).filter((section) => section.tools.length > 0);
      setFilteredSections(filtered);
    }
  }, [query]);

  return (
    <main className="min-h-screen bg-[#f7f7f8]">
      <Navbar />
      <HeroSection query={query} setQuery={setQuery} placeholderIndex={placeholderIndex} placeholders={placeholders} />
      <CardsPage sections={filteredSections} />
      <Faqs />
      <Footer />
      <CustomFooter />
    </main>
  );
}
