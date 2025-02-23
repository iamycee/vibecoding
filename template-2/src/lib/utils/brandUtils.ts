import { DTCBrand, dtcBrands } from '../data/dtcBrands';

export function getRandomBrands(count: number = 5): DTCBrand[] {
  // Create a copy of the brands array
  const shuffled = [...dtcBrands];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return the first 'count' brands
  return shuffled.slice(0, count);
} 