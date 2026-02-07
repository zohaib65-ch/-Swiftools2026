"use client";

import { Twitter, Github, Linkedin } from "lucide-react";

export default function CustomFooter() {
  return (
    <footer >
      <div className="mx-auto max-w-7xl px-6 py-16">

        {/* Top Section */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">SwiftTools</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The all-in-one toolbox that fits your workflow. Fast, secure, and designed for modern teams.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="sm:mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Product
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="/tools" className="hover:text-gray-900 transition-colors">Tools</a></li>
              <li><a href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</a></li>
              <li><a href="/docs" className="hover:text-gray-900 transition-colors">API</a></li>
              <li><a href="/docs" className="hover:text-gray-900 transition-colors">Docs</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="sm:mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Company
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="/" className="hover:text-gray-900 transition-colors">About</a></li>
              <li><a href="/" className="hover:text-gray-900 transition-colors">Services</a></li>
              <li><a href="/" className="hover:text-gray-900 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="sm:mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Legal
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="sm:mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 text-sm text-gray-500 md:flex-row">
          <p>© {new Date().getFullYear()} SwiftTools. All rights reserved.</p>

          <div className="flex gap-5">
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
