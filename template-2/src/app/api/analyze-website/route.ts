import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI with error handling
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

// Simple rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // 3 requests per minute
const requestTimestamps: number[] = [];

function checkRateLimit() {
  const now = Date.now();
  // Remove timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    requestTimestamps.shift();
  }
  // Check if we're over the limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestRequest = requestTimestamps[0];
    const timeToWait = RATE_LIMIT_WINDOW - (now - oldestRequest);
    throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(timeToWait / 1000)} seconds.`);
  }
  // Add current timestamp
  requestTimestamps.push(now);
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError!;
}

async function fetchPageContent(url: string, isOptional = false) {
  try {
    // Add user-agent and accept headers to mimic a browser request
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      if (isOptional) {
        return null;
      }
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      if (isOptional) {
        return null;
      }
      throw new Error(`Invalid content type for ${url}: ${contentType}`)
    }

    return await response.text()
  } catch (error) {
    if (isOptional) {
      return null;
    }
    console.error(`Error fetching ${url}:`, error)
    throw error
  }
}

async function scrapeWebsite(baseUrl: string) {
  try {
    // Normalize the base URL
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }
    console.log('Scraping URL:', baseUrl);
    
    const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    
    // First try to fetch just the homepage
    const homepageHtml = await fetchPageContent(normalizedUrl)
    if (!homepageHtml) {
      throw new Error('Failed to access the website. Please check if the URL is correct.')
    }

    // Extract meta tags from homepage
    const metaDescription = homepageHtml.match(/<meta[^>]*(?:name|property)="(?:description|og:description)"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || ''
    const metaKeywords = homepageHtml.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || ''
    const ogTitle = homepageHtml.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || ''
    
    // Try to find about/mission content from the homepage first
    let aboutContent = homepageHtml.match(
      /<(?:div|section|article)[^>]*(?:class|id)="[^"]*(?:about|mission|story)[^"]*"[^>]*>(.*?)<\/(?:div|section|article)>/is
    )?.[1] || ''

    // Try to find product content from the homepage
    let productContent = homepageHtml.match(
      /<(?:div|section|article)[^>]*(?:class|id)="[^"]*(?:product|collection|featured)[^"]*"[^>]*>(.*?)<\/(?:div|section|article)>/is
    )?.[1] || ''

    // If we couldn't find about/product content on homepage, try common URLs
    if (!aboutContent || !productContent) {
      const pagesToTry = [
        '/about',
        '/about-us',
        '/mission',
        '/products',
        '/collections',
        '/shop',
      ]

      // Only try 2 additional pages to avoid too many requests
      for (const path of pagesToTry.slice(0, 2)) {
        const pageUrl = `${normalizedUrl}${path}`
        const pageHtml = await fetchPageContent(pageUrl, true) // Mark as optional
        
        if (pageHtml) {
          if (!aboutContent && path.includes('about')) {
            aboutContent = pageHtml.match(/<(?:div|section|article)[^>]*>(.*?)<\/(?:div|section|article)>/is)?.[1] || ''
          }
          if (!productContent && (path.includes('product') || path.includes('shop'))) {
            productContent = pageHtml.match(/<(?:div|section|article)[^>]*>(.*?)<\/(?:div|section|article)>/is)?.[1] || ''
          }
        }
      }
    }

    // Clean and combine the content
    const cleanText = (text: string) => 
      text.replace(/<[^>]*>/g, ' ')
          .replace(/&[^;]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

    // Combine all content for analysis
    const combinedContent = [
      ogTitle,
      metaDescription,
      metaKeywords,
      aboutContent,
      productContent,
      // Add main page content as fallback
      homepageHtml.replace(/<[^>]*>/g, ' ').slice(0, 1000)
    ]
      .map(cleanText)
      .filter(Boolean)
      .join(' ')
      .slice(0, 3000) // Limit total content length

    if (!combinedContent) {
      throw new Error('Could not extract meaningful content from the website. Please check if the URL is correct.')
    }

    console.log('Extracted content length:', combinedContent.length);

    return {
      title: cleanText(ogTitle),
      metaDescription: cleanText(metaDescription),
      metaKeywords: cleanText(metaKeywords),
      aboutContent: cleanText(aboutContent).slice(0, 1000),
      productContent: cleanText(productContent).slice(0, 1000),
    }
  } catch (error) {
    console.error('Error scraping website:', error)
    throw error
  }
}

type HashtagCategory = {
  name: string
  hashtags: Array<{
    tag: string
    explanation: string
    estimatedReach?: string
  }>
}

export async function POST(req: Request) {
  console.log('API route called');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    )
  }

  try {
    const { url } = await req.json()
    console.log('Received URL:', url);

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Check rate limit before proceeding
    try {
      checkRateLimit();
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
    }

    // Scrape website content
    const { title, metaDescription, metaKeywords, aboutContent, productContent } = await scrapeWebsite(url)

    // Generate hashtags using OpenAI with retry logic
    const makeOpenAIRequest = async () => {
      const prompt = `
        Analyze this e-commerce website content and generate relevant Instagram hashtags that would help find influencers for this brand.
        
        Website content:
        Title: ${title}
        Meta Description: ${metaDescription}
        Meta Keywords: ${metaKeywords}
        About/Mission: ${aboutContent}
        Products: ${productContent}
        
        Generate a structured response with categorized hashtags. For each hashtag, provide a brief explanation of why it's relevant and an estimated reach (rough number of posts).
        
        Categories should include:
        1. Brand Values & Mission (3-4 hashtags)
        2. Product Category (4-5 hashtags)
        3. Target Audience (4-5 hashtags)
        4. Style & Aesthetics (3-4 hashtags)
        
        For each hashtag:
        - Ensure it's actually used on Instagram
        - Include a mix of popular (>100K posts) and niche (<100K posts) hashtags
        - Focus on hashtags that real influencers in this space would use
        
        Format the response as JSON with this structure:
        {
          "categories": [
            {
              "name": "Category Name",
              "hashtags": [
                {
                  "tag": "#hashtag",
                  "explanation": "Brief explanation of relevance",
                  "estimatedReach": "approximate number of posts"
                }
              ]
            }
          ]
        }
      `

      console.log('Calling OpenAI API');
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      return completion;
    };

    const completion = await retryWithBackoff(makeOpenAIRequest);
    const response = JSON.parse(completion.choices[0].message.content || '{"categories": []}')
    console.log('OpenAI API response received');

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze website'
    const status = errorMessage.includes('Rate limit exceeded') ? 429 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status }
    )
  }
} 