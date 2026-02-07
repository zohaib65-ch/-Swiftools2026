export default function Loader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        
        {/* Spinner */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-2 border-gray-600 border-t-transparent animate-spin"></div>
        </div>

        {/* Text */}
        <p className="text-sm text-gray-600 font-medium  bg-linear-to-r from-[#f8f7ff] via-[#fff7f7] to-[#fffdf5]">
          {text}
        </p>
      </div>
    </div>
  );
}
