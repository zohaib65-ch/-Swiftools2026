import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import type { Metadata } from "next";

const montserrat = Montserrat({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], // pick the weights you need
  style: ["normal", "italic"], // optional
  subsets: ["latin"], // optional: add 'latin-ext' if needed
  display: "swap", // improves loading
});

export const metadata: Metadata = {
  title: "SwiftTools",
  description: "The all-in-one toolbox that fits your daily workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <Providers>
          <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
