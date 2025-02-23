'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { normalizeUrl } from '@/lib/utils/urlUtils';
import SearchResults from './SearchResults';

type HashtagResult = {
  category: string;
  hashtags: Array<{
    tag: string;
    explanation: string;
    reach?: string;
  }>;
  reasoning?: string;
};

const loadingMessages = [
  "🕵️‍♂️ Stalking influencers...",
  "🎯 Finding your perfect match...",
  "🔍 Diving deep into the hashtag ocean...",
  "🧮 Crunching those social numbers...",
  "🎨 Painting your brand's social canvas...",
  "🌟 Discovering hidden gems...",
  "🚀 Launching your influencer search...",
  "🎭 Mastering the art of hashtag hunting...",
  "🎪 Juggling through Instagram's circus...",
  "🎲 Rolling the influencer dice..."
];

export default function SearchForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<HashtagResult[] | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Add event listener for recommended brand clicks
  useEffect(() => {
    const handleRecommendedBrandClick = (event: CustomEvent<{ url: string }>) => {
      setSearchQuery(event.detail.url);
      // Submit the form after state update
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      }, 0);
    };

    document.addEventListener('recommendedBrandClick', handleRecommendedBrandClick as EventListener);
    return () => {
      document.removeEventListener('recommendedBrandClick', handleRecommendedBrandClick as EventListener);
    };
  }, []);

  // Rotate loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // URL validation function
  const isValidUrl = (url: string) => {
    // Remove any protocol and www if present
    const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();
    
    // Simple domain validation - just check if it has a domain and TLD
    return cleanUrl.includes('.') && !cleanUrl.includes(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // URL validation
    if (!isValidUrl(searchQuery)) {
      setError('Please enter a valid domain (e.g., allbirds.com)');
      return;
    }

    // Clean the URL before sending
    const cleanUrl = searchQuery.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();

    setIsLoading(true);
    setError(null);
    setResults(null);
    setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);

    try {
      const response = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: cleanUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate hashtags');
      }

      const data = await response.json();
      
      // Update recent searches with normalized URL
      const normalizedSearchUrl = normalizeUrl(searchQuery);
      const updatedSearches = [normalizedSearchUrl, ...recentSearches.filter(s => s !== normalizedSearchUrl)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      setResults(data.hashtags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="w-full flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your brand's website"
              className="w-full px-6 py-3 md:py-4 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base md:text-lg font-medium placeholder:text-gray-400"
              disabled={isLoading}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <svg 
                className="w-5 h-5 md:w-6 md:h-6 text-gray-400" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
          </div>
          <button 
            type="submit"
            className={`px-6 md:px-8 py-3 md:py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all transform hover:scale-105 font-medium text-base md:text-lg shadow-lg hover:shadow-xl ${
              isLoading ? 'cursor-not-allowed opacity-90' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2 md:gap-3">
                <motion.div
                  className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Analyzing...</span>
              </div>
            ) : (
              'Recommend Topics'
            )}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="text-center mt-6 md:mt-8">
          <motion.p
            className="text-purple-600 text-lg md:text-xl font-medium px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={loadingMessage}
          >
            {loadingMessage}
          </motion.p>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mt-4 text-center font-medium">
          {error}
        </div>
      )}

      {results && <SearchResults results={results} />}
    </div>
  );
} 