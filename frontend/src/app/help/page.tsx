"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomFooter from "@/components/CustomFooter";
import Faqs from "@/components/Faqs";
import { Search, BookOpen, MessageCircle, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-linear-to-r from-[#f8f7ff] via-[#fff7f7] to-[#fffdf5] text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <section className="text-center mt-10 mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold border border-blue-100">
            <HelpCircle size={16} />
            Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to frequently asked questions, explore our documentation, or get in touch with our support team.
          </p>
          
          {/* Search bar placeholder */}
          <div className="max-w-xl mx-auto mt-8 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search for articles, guides..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white shadow-xl border border-gray-100 focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </section>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: <BookOpen className="text-blue-500" />,
              title: "Documentation",
              desc: "Learn how to use our API and integrate tools into your own apps.",
              link: "/docs"
            },
            {
              icon: <HelpCircle className="text-orange-500" />,
              title: "General FAQ",
              desc: "Clear answers to the most common questions about SwiftTools.",
              link: "#faqs"
            },
            {
              icon: <MessageCircle className="text-green-500" />,
              title: "Support",
              desc: "Can't find what you're looking for? Reach out to our team.",
              link: "/contact"
            }
          ].map((cat, idx) => (
            <Link 
              key={idx} 
              href={cat.link}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{cat.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{cat.desc}</p>
            </Link>
          ))}
        </div>

        {/* FAQ Section */}
        <section id="faqs" className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="p-4 md:p-8">
            <Faqs />
          </div>
        </section>

        {/* Still need help? */}
        <section className="mt-20 text-center bg-linear-to-br from-gray-900 to-black rounded-3xl p-12 text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Our support team is available 24/7 to help you with any issues or questions you might have.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all hover:scale-105">
            Contact Support
            <MessageCircle size={20} />
          </Link>
        </section>
      </main>

      <Footer />
      <CustomFooter />
    </div>
  );
}
