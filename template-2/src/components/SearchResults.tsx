import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Hashtag = {
  tag: string;
  explanation: string;
  reach?: string;
};

type HashtagResult = {
  category: string;
  hashtags: Hashtag[];
  reasoning?: string;
};

const categoryOrder = [
  'Lifestyle',
  'Product',
  'Community',
  'Trending',
  'Industry'
];

const loadingMessages = [
  "🎲 Rolling the hashtag dice...",
  "🎯 Finding fresh targets...",
  "🔄 Spinning the creator wheel...",
  "🎨 Painting new possibilities...",
  "✨ Sprinkling more magic...",
];

const formatReasoning = (reasoning: string): string => {
  // Remove any instances of "Influencers using these hashtags" from the text since we'll add it
  let cleanText = reasoning.toLowerCase()
    .replace(/^influencers using these hashtags\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove any random periods in the middle of sentences
  cleanText = cleanText.replace(/\.\s+(?=[a-z])/g, ' ');

  // Ensure the text ends with proper punctuation
  if (!cleanText.endsWith('.')) {
    cleanText = cleanText.replace(/[.,]*$/, '.');
  }

  return `Influencers using these hashtags ${cleanText}`;
};

export default function SearchResults({ results }: { results: HashtagResult[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortedResults, setSortedResults] = useState<HashtagResult[]>([]);
  const [refreshAttempts, setRefreshAttempts] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({});
  const [loadingMessage, setLoadingMessage] = useState('');

  // Sort results based on category order
  useEffect(() => {
    const sorted = [...results].sort((a, b) => {
      const aIndex = categoryOrder.findIndex(category => 
        a.category.toLowerCase().includes(category.toLowerCase())
      );
      const bIndex = categoryOrder.findIndex(category => 
        b.category.toLowerCase().includes(category.toLowerCase())
      );
      return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
    });
    setSortedResults(sorted);
  }, [results]);

  const handleRefresh = async (category: string) => {
    // Check if already refreshing
    if (isRefreshing[category]) return;

    // Check refresh attempts
    const attempts = refreshAttempts[category] || 0;
    if (attempts >= 2) return;

    // Update loading state
    setIsRefreshing(prev => ({ ...prev, [category]: true }));
    setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);

    try {
      // Make API call to get new hashtags for this category
      const response = await fetch('/api/generate-hashtags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: window.location.href,
          category: category 
        }),
      });

      if (!response.ok) throw new Error('Failed to refresh hashtags');

      const data = await response.json();
      
      // Update the hashtags for this category only
      setSortedResults(prev => prev.map(result => 
        result.category === category ? data.hashtags.find(h => h.category === category) || result : result
      ));

      // Update refresh attempts
      setRefreshAttempts(prev => ({
        ...prev,
        [category]: (prev[category] || 0) + 1
      }));
    } catch (error) {
      console.error('Error refreshing hashtags:', error);
    } finally {
      setIsRefreshing(prev => ({ ...prev, [category]: false }));
    }
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedResults.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedResults.length) % sortedResults.length);
  };

  if (!sortedResults || sortedResults.length === 0) return null;

  const currentCategory = sortedResults[currentIndex].category;
  const attempts = refreshAttempts[currentCategory] || 0;

  return (
    <div className="mt-6 md:mt-12 relative px-4 md:px-0">
      {/* Category Progress */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <span className="text-sm text-gray-500 font-medium">
          {currentIndex + 1} of {sortedResults.length} Categories
        </span>
        <div className="flex gap-1.5">
          {sortedResults.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'w-6 bg-purple-600' 
                  : 'w-1.5 bg-purple-200 hover:bg-purple-300'
              }`}
              aria-label={`Go to category ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 md:left-[-40px] top-[45%] -translate-y-1/2 p-2 md:p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all z-20 hover:scale-110"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="hidden md:block absolute right-[-40px] top-[45%] -translate-y-1/2 z-20">
        <motion.button
          onClick={goToNext}
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all relative"
          whileHover={{ scale: 1.2 }}
          animate={{
            x: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      <button
        onClick={goToNext}
        className="md:hidden absolute right-4 top-[45%] -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:shadow-xl transition-all z-20 hover:scale-110"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Cards Container */}
      <div className="overflow-visible relative">
        {/* Next Card Preview (Static) - Hide on mobile */}
        {currentIndex < sortedResults.length - 1 && (
          <>
            <div 
              className="hidden md:block absolute top-2 left-[calc(100%-40px)] right-[-40px] bottom-0 z-0 rounded-2xl bg-gradient-to-br from-white to-purple-50 border border-purple-100 shadow-md opacity-50 transform scale-95 pointer-events-none"
              aria-hidden="true"
            />
            <div className="hidden md:flex absolute right-[-20px] top-1/2 -translate-y-1/2 transform rotate-90 items-center gap-2 text-purple-600 font-medium z-10">
              <span className="text-sm whitespace-nowrap">Next: {sortedResults[currentIndex + 1].category}</span>
              <motion.svg 
                className="w-4 h-4 transform -rotate-90" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </div>
          </>
        )}
        
        {/* Current Card */}
        <div className="relative z-10 bg-gradient-to-br from-white to-purple-50 rounded-2xl border border-purple-100 p-4 md:p-8 shadow-lg hover:shadow-xl transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {currentCategory}
              </h2>
              {currentIndex < sortedResults.length - 1 && (
                <span className="md:hidden text-sm text-purple-600">
                  Swipe for more →
                </span>
              )}
            </div>
            {attempts < 2 ? (
              <button
                onClick={() => handleRefresh(currentCategory)}
                disabled={isRefreshing[currentCategory]}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isRefreshing[currentCategory]
                    ? 'bg-purple-100 text-purple-500 cursor-wait'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing[currentCategory] ? 'Refreshing...' : 'Refresh'}
              </button>
            ) : (
              <p className="text-xs text-gray-500 italic">
                These are our best picks for you!
              </p>
            )}
          </div>

          {sortedResults[currentIndex].reasoning && (
            <p className="text-gray-600 mb-6 text-base md:text-lg leading-relaxed">
              {formatReasoning(sortedResults[currentIndex].reasoning)}
            </p>
          )}

          {isRefreshing[currentCategory] ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-purple-600 text-lg font-medium mb-2">
                {loadingMessage}
              </p>
              <p className="text-gray-500 text-sm">
                Finding fresh hashtags just for you...
              </p>
            </motion.div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {sortedResults[currentIndex].hashtags.map((hashtag, hIdx) => (
                  <a
                    key={hIdx}
                    href={`https://www.instagram.com/explore/tags/${hashtag.tag.replace('#', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center bg-[#7C6B9C] px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all transform hover:scale-105 hover:-translate-y-0.5 border border-[#8E7EB3] hover:border-[#9E8FC7] hover:shadow-lg hover:bg-[#8E7EB3] shadow-[#7C6B9C]/20"
                  >
                    <div className="flex items-center gap-2 relative z-10">
                      <span className="text-sm md:text-base text-white font-medium tracking-wide" style={{ fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        {hashtag.tag}
                      </span>
                      {hashtag.reach && (
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs md:text-sm border border-white/20">
                          <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="font-medium text-white">{hashtag.reach}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
                    <div className="absolute inset-0 bg-[#8E7EB3]/0 group-hover:bg-[#8E7EB3]/20 rounded-full transition-colors" />
                  </a>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 place-items-center">
                {sortedResults[currentIndex].hashtags.map((hashtag, hIdx) => (
                  <div 
                    key={hIdx}
                    className="bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-purple-100 hover:border-purple-200 transition-colors w-full max-w-[280px] shadow-sm hover:shadow-md"
                  >
                    <p className="text-gray-500 text-xs leading-relaxed">
                      <span className="text-purple-600 font-medium">{hashtag.tag}</span>
                      <span className="mx-1 text-gray-400">·</span>
                      {hashtag.explanation.slice(0, 50)}
                    </p>
                  </div>
                ))}
              </div>

              {/* SARAL CTA */}
              <div className="mt-8 pt-6 border-t border-purple-100">
                <a
                  href="https://getsaral.com/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:translate-y-[-2px] group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">Want to find 100's of influencers in minutes? 🎯</h3>
                      <p className="text-purple-100 leading-relaxed">
                        SARAL's AI-powered search finds perfect influencers for your brand. Filter by niche, engagement, location and more. Get 5.12x average ROAS.
                      </p>
                      <div className="inline-flex items-center gap-2 text-white font-medium bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full border border-white/20">
                        Claim your free consultative walkthrough
                        <svg 
                          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M13 7l5 5m0 0l-5 5m5-5H6" 
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <svg 
                        className="w-12 h-12 text-purple-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5}
                          d="M13 10V3L4 14h7v7l9-11h-7z" 
                        />
                      </svg>
                    </div>
                  </div>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 