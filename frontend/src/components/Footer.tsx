"use client"
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  return (
    <footer className="w-full pt-8 px-6 bg-linear-to-r from-[#8ee3f9] via-[#fbc7d4] to-[#d7f5d9] rounded-lg flex flex-col md:flex-row items-center md:items-end justify-between max-w-5xl mx-auto  gap-8 md:gap-0">
      {/* Desktop layout unchanged, mobile stacks */}

      <div className="max-w-md text-center md:text-left">
        <h2 className="text-xl font-extrabold text-black mb-2">
          Get more with Swifttools Premium
        </h2>
        <p className="text-sm text-gray-700 mb-1">
          Accès complet aux outils Swifttools
        </p>
        <p className="text-sm text-gray-700 mb-4">
          Traitement de documents illimité
        </p>
        <p className="text-sm text-gray-700 mb-6">Sans publicité</p>
        <button
          onClick={() => router.push('/login')}
          className="bg-black text-white text-sm font-semibold py-2 px-4 rounded hover:bg-gray-800 transition  md:mb-6"
        >
          Get Premium
        </button>
      </div>

      <div className="relative flex justify-center md:justify-end w-full md:w-auto">
        <Image
          src="/tabler_crown.png"
          alt="Crown Icon"
          style={{ objectFit: "contain" }}
          priority
          width={200}
          height={200}
        />
      </div>
    </footer>
  );
}
