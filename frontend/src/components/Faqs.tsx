"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What is SwiftTools?",
    answer: "SwiftTools is an all-in-one toolbox designed to speed up your workflow. It’s fast, privacy-focused, and built for modern teams."
  },
  {
    question: "How do I access the API?",
    answer: "You can access the SwiftTools API by signing up and obtaining an API key from the API section on our website."
  },
  {
    question: "What pricing plans are available?",
    answer: "We offer multiple pricing plans, including Free, Pro, and Enterprise. Each plan is tailored to different team sizes and needs."
  },
  {
    question: "Is my data secure?",
    answer: "Yes! SwiftTools prioritizes privacy and security. All user data is encrypted and handled according to strict security standards."
  },
  {
    question: "Can I integrate SwiftTools with my workflow?",
    answer: "Absolutely! SwiftTools offers integrations via API and supports multiple platforms to fit into your workflow seamlessly."
  },
];

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="  rounded-xl overflow-hidden">
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex justify-between items-center px-2 py-2 text-left text-gray-900 font-medium "
            >
              {faq.question}
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 text-gray-600 bg-linear-to-r from-[#fbfbff] via-[#ffe9e9] to-[#fdf9e9]">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
