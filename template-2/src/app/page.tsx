import Image from 'next/image';
import Link from 'next/link';
import SearchForm from '@/components/SearchForm';
import RecommendedBrands from '@/components/RecommendedBrands';
import RecentSearches from '@/components/RecentSearches';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 relative">
      {/* Powered by SARAL - Fixed at bottom right */}
      <div className="fixed bottom-6 right-6 z-10">
        <Link 
          href="https://www.getsaral.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-purple-300 hover:bg-purple-50 transition-all group shadow-sm"
        >
          <svg 
            className="w-4 h-4 text-purple-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
          <span className="text-gray-600 group-hover:text-purple-700 transition-colors text-sm font-medium">
            Powered by <span className="text-purple-600 font-semibold">SARAL</span>
          </span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Image 
            src="/images/sia-logo.png"
            alt="SIA - SARAL Influencer Assistant"
            width={200}
            height={120}
            className="h-auto w-auto max-w-[150px]"
            priority
          />
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-4 font-display">
          Discover High-Value Influencers for Your DTC Brand
        </h2>
        
        {/* Subheading */}
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg font-normal leading-relaxed">
          👋 I'm SIA. Show me your brand and I'll analyze it to recommend the best topics where creators are waiting to promote your products.
        </p>

        {/* Search Form */}
        <SearchForm />

        {/* Recommended Brands */}
        <RecommendedBrands />

        {/* Recent Searches */}
        <RecentSearches />
      </div>
    </div>
  );
}
