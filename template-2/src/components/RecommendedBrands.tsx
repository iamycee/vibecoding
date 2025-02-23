'use client';

import { useState, useEffect } from 'react';
import { DTCBrand } from '@/lib/data/dtcBrands';
import { getRandomBrands } from '@/lib/utils/brandUtils';

export default function RecommendedBrands() {
  const [brands, setBrands] = useState<DTCBrand[]>([]);

  useEffect(() => {
    // Get random brands on component mount
    setBrands(getRandomBrands(5));
  }, []);

  const handleBrandClick = (url: string) => {
    // Find the search form component
    const searchForm = document.querySelector('form');
    if (!searchForm) return;
    
    // Create a custom event that SearchForm can listen to
    const event = new CustomEvent('recommendedBrandClick', {
      detail: { url },
      bubbles: true
    });
    
    searchForm.dispatchEvent(event);
  };

  return (
    <div className="w-full mt-12">
      <div className="flex items-center gap-2 text-gray-600 mb-4">
        <span>✨ Try these DTC brands</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {brands.map((brand) => (
          <button
            key={brand.url}
            onClick={() => handleBrandClick(brand.url)}
            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors flex items-center gap-2"
          >
            <span>{brand.name}</span>
            <span className="text-sm text-purple-500">({brand.url})</span>
          </button>
        ))}
      </div>
    </div>
  );
} 