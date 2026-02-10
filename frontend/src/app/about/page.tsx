"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomFooter from "@/components/CustomFooter";
import { Info, ShieldCheck, Zap, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-r from-[#f8f7ff] via-[#fff7f7] to-[#fffdf5] text-gray-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 space-y-16">
        {/* Header */}
        <section className="text-center mt-20 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-linear-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
            About SwiftTools
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Empowering your digital workflow with the fastest, most secure toolbox on the web.
          </p>
        </section>

        {/* Mission Card */}
        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              At <strong className="text-blue-600">SwiftTools</strong>, we believe that digital productivity shouldn&apos;t be complicated. Our mission is to provide a seamless, all-in-one platform where you can handle all your digital tasks—from image conversion to developer utilities—in a single place.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg">
              We focus on speed, privacy, and simplicity. No clutter, no unnecessary tracking, just the tools you need, right when you need them.
            </p>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
              <Info size={120} className="relative text-blue-600" />
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="text-orange-500" />,
              title: "Incredible Speed",
              desc: "Optimized for performance. Most tasks complete in milliseconds, saving you hours of manual work."
            },
            {
              icon: <ShieldCheck className="text-green-500" />,
              title: "Privacy First",
              desc: "We process your files directly in your browser or on volatile servers. Your data is never stored."
            },
            {
              icon: <Globe className="text-purple-500" />,
              title: "Everything in One",
              desc: "A growing library of tools for developers, designers, and everyday users. One tab, endless possibilities."
            }
          ].map((value, idx) => (
            <div key={idx} className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {value.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </section>

        {/* Story */}
        <section className="text-center space-y-6 pb-12">
          <h2 className="text-3xl font-bold">Built for the Modern Web</h2>
          <p className="max-w-3xl mx-auto text-gray-600">
            SwiftTools started as a simple collection of scripts and has grown into a comprehensive platform used by thousands. We are constantly updating our toolset based on your feedback.
          </p>
        </section>
      </main>

      <Footer />
      <CustomFooter />
    </div>
  );
}
