export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F23E2E] mx-auto mb-4"></div>
        <p className="text-gray-600 font-satoshi">Loading portal...</p>
      </div>
    </div>
  );
}

