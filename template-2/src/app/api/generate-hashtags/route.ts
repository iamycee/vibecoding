import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function fetchWebsiteContent(url: string) {
  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  try {
    console.log('Attempting to fetch:', normalizedUrl);
    
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (response.status === 403) {
      // If the website blocks us, return minimal information
      console.log('Website blocked our request, using fallback approach');
      return {
        title: url,
        description: 'Website content not accessible',
        keywords: '',
        mainContent: `This appears to be the website for ${url}. Please analyze this brand based on general market knowledge.`
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch website content: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('text/html')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const html = await response.text();
    console.log('Successfully fetched HTML content');
    
    // Extract meta tags and content
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || '';
    const keywords = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || '';
    
    // Extract main content (simplified)
    const mainContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000);

    console.log('Extracted content:', {
      titleLength: title.length,
      descriptionLength: description.length,
      keywordsLength: keywords.length,
      mainContentLength: mainContent.length
    });

    return {
      title,
      description,
      keywords,
      mainContent
    };
  } catch (error) {
    console.error('Error fetching website:', error);
    throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    )
  }

  try {
    const { url, category } = await req.json()
    console.log('Processing URL:', url);

    if (!url) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      )
    }

    // Fetch website content
    const websiteContent = await fetchWebsiteContent(url);
    console.log('Successfully fetched website content');

    // Enhance the prompt to work with limited information
    const enhancedPrompt = category 
      ? `Generate new hashtags for the ${category} category for this brand:
    
        Website: ${url}
        Title: ${websiteContent.title}
        Description: ${websiteContent.description}
        Keywords: ${websiteContent.keywords}
        Content: ${websiteContent.mainContent}
        
        Focus specifically on ${category} hashtags that would help find relevant influencers.`
      : `Analyze this brand website and suggest relevant Instagram hashtag categories for finding influencers:
    
        Website: ${url}
        Title: ${websiteContent.title}
        Description: ${websiteContent.description}
        Keywords: ${websiteContent.keywords}
        Content: ${websiteContent.mainContent}
        
        ${websiteContent.description === 'Website content not accessible' ? 
          'Note: The website content was not directly accessible. Please provide hashtag suggestions based on general knowledge of this brand and its market position.' 
          : ''}
        
        Focus on:
        1. Industry-specific hashtags
        2. Product-related hashtags
        3. Lifestyle hashtags
        4. Community hashtags
        5. Trending hashtags in their space`;

    console.log('Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: category 
            ? `You are a social media expert who analyzes brands and suggests relevant hashtags for finding influencers.
              For the ${category} category, provide exactly 5 hashtags and explain why these influencers would be valuable for the brand.
              Keep the reasoning concise (max 50 words) and focus on:
              - Their expertise and content style
              - Audience value and engagement
              - Collaboration potential
              
              Structure your response as JSON with the following format:
              {
                "hashtags": [
                  {
                    "category": "${category}",
                    "reasoning": "Concise explanation of value (max 50 words)",
                    "hashtags": [
                      {
                        "tag": "#hashtag",
                        "explanation": "Brief explanation (max 10 words)",
                        "reach": "Approximate number of posts"
                      }
                    ]
                  }
                ]
              }`
            : `You are a social media expert who analyzes brands and suggests relevant hashtag categories for finding influencers. 
              For each category, provide exactly 5 hashtags and explain why these influencers would be valuable for the brand.
              Keep the reasoning concise (max 50 words) and focus on:
              - Their expertise and content style
              - Audience value and engagement
              - Collaboration potential
              
              Structure your response as JSON with the following format:
              {
                "hashtags": [
                  {
                    "category": "Category name",
                    "reasoning": "Concise explanation of value (max 50 words)",
                    "hashtags": [
                      {
                        "tag": "#hashtag",
                        "explanation": "Brief explanation (max 10 words)",
                        "reach": "Approximate number of posts"
                      }
                    ]
                  }
                ]
              }
              Each category MUST have exactly 5 hashtags.`
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    console.log('OpenAI API response received');

    // Parse the response
    const response = JSON.parse(completion.choices[0].message.content);
    console.log('Successfully parsed OpenAI response');
    
    return NextResponse.json({ 
      success: true,
      hashtags: response.hashtags
    })

  } catch (error) {
    console.error('Error generating hashtags:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Provide a more user-friendly error message
    let userMessage = 'Failed to generate hashtags. Please try again.';
    if (errorMessage.includes('403')) {
      userMessage = "We couldn't access the website directly, but we'll still try to analyze the brand. Please try again.";
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    )
  }
} 