'use client';

import { useEffect, useState } from 'react';

export default function RecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setSearches(JSON.parse(saved));
    }

    // Listen for storage changes
    const handleStorageChange = () => {
      const updated = localStorage.getItem('recentSearches');
      if (updated) {
        setSearches(JSON.parse(updated));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSearchClick = (url: string) => {
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

  if (searches.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <h3 className="text-gray-600 mb-4">Recent searches</h3>
      <div className="flex flex-wrap gap-3">
        {searches.map((url, idx) => (
          <button
            key={idx}
            onClick={() => handleSearchClick(url)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="w-5 h-5">🔍</span>
            <span className="text-gray-700">{url}</span>
          </button>
        ))}
      </div>
    </div>
  );
} 