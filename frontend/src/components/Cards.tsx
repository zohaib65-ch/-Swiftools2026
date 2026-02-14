"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { CardiconMap, Cardsections } from "../lib/tools";

/* ================= ICON MAP ================= */

const iconMap = CardiconMap;

/* ================= SECTIONS ================= */

const sections = Cardsections;

interface CardsPageProps {
  sections?: typeof Cardsections;
  mtop?: string;
}

export default function CardsPage({ mtop, sections: propSections }: CardsPageProps) {
  const sections = propSections || Cardsections;

  return (
    <div className={`min-h-screen bg-linear-to-br ${mtop}`}>
      <div className="mx-auto max-w-7xl px-4 py-12">
        {sections.map((section) => (
          <section key={section.title} className="mb-14">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-1 text-gray-600">{section.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.tools.map((tool) => (
                <Link
                  key={tool.slug}
                  id={tool.slug}
                  data-tool-name={tool.name}
                  href={`/${section.basePath}/${tool.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 hover:border-blue-100 hover:-translate-y-1"
                >
                  {/* Icon Container with Glow */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-50/50 to-blue-50/50 border border-cyan-100 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-200/50">
                    <div className="p-2.5">{iconMap[tool.name] ?? "⚙️"}</div>
                  </div>

                  {/* Text content */}
                  <div className="flex flex-col overflow-hidden text-left">
                    <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{tool.name}</h3>
                    <p className="mt-0.5 text-[13px] text-gray-500 line-clamp-1 group-hover:text-gray-700 transition-colors">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {sections.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No results found</p>
            <p className="text-gray-400 text-sm mt-2">Try searching for something else</p>
          </div>
        )}
      </div>
    </div>
  );
}
