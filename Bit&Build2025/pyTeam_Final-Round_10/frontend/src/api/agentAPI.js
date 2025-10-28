import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Toggle between mock and real API
const USE_REAL_API = true;  // Set to false for mock data

// Mock responses for development - uses actual user input!
const mockAgentResponses = {
  strategy: (input) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userInput = input || 'brand campaign';
        resolve({
          core_concept: `Strategic positioning for ${userInput}`,
          tagline: generateTagline(userInput),
          target_audience: `Target audience based on: ${userInput}`,
          key_messages: [
            `Core value proposition for ${userInput}`,
            'Unique differentiator',
            'Call to action message',
          ],
          tone: detectTone(userInput),
          channels: detectChannels(userInput),
          user_brief: userInput,
        });
      }, 1500);
    });
  },

  copywriting: (input) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userInput = input || 'product';
        const keywords = extractKeywords(userInput);
        
        // Extract main theme from first keyword or input
        const mainTheme = keywords[0] || 'Product';
        const secondaryTheme = keywords[1] || 'Innovation';
        
        resolve({
          captions: [
            `✨ ${mainTheme} that makes a difference. ${generateHashtag(mainTheme)}`,
            `🚀 Transform your experience with ${mainTheme}. Join the movement!`,
            `💫 ${mainTheme} redefined. ${generateEmoji(userInput)} ${generateHashtag(secondaryTheme)}`,
          ],
          cta: `Get Your ${mainTheme} Now`,
          hashtags: `#${mainTheme.replace(/\s+/g, '')} #${secondaryTheme.replace(/\s+/g, '')} #NewLaunch`,
          input_context: `Generated from: ${keywords.slice(0, 3).join(', ')}`,
        });
      }, 1200);
    });
  },

  visual: async (input) => {
    const userInput = input || 'brand visual';
    const keywords = extractKeywords(userInput);
    const mainTheme = keywords.slice(0, 3).join(' ');
    const theme = detectTheme(userInput);
    
    // Generate image prompts
    const imagePrompts = [
      `Professional marketing image: ${mainTheme}, ${theme.style}, high quality, detailed`,
      `Hero shot: ${mainTheme} with ${theme.description}, photorealistic, studio lighting`,
      `Product photography: ${mainTheme}, clean background, modern aesthetic`,
    ];

    // Generate actual images (using placeholder for now, will call backend)
    const generatedImages = await Promise.all(
      imagePrompts.map(async (prompt, index) => {
        try {
          // For now, use placeholder images
          // In production, this would call your backend's image generation
          return {
            id: `img_${Date.now()}_${index}`,
            prompt: prompt,
            url: `https://placehold.co/512x512/png?text=Generating+${mainTheme.replace(/\s+/g, '+')}`,
            thumbnail: `https://placehold.co/256x256/png?text=Image+${index + 1}`,
            selected: index === 0, // First one selected by default
          };
        } catch (error) {
          return {
            id: `img_error_${index}`,
            prompt: prompt,
            url: null,
            error: error.message,
            selected: false,
          };
        }
      })
    );

    return {
      image_concepts: imagePrompts,
      images: generatedImages,
      selected_image: generatedImages[0],
      color_palette: theme.colors,
      style: theme.description,
      status: `Images generated for: ${mainTheme}`,
      context: userInput,
      type: 'visual_with_images',
    };
  },

  research: (input) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userInput = input || 'market';
        const keywords = extractKeywords(userInput);
        const mainTheme = keywords[0] || 'Market';
        const secondaryTheme = keywords[1] || 'Innovation';
        
        resolve({
          trends: [
            `Rising trend in ${mainTheme} sector`,
            `Growing demand for ${secondaryTheme.toLowerCase()} solutions`,
            'Consumer behavior shifting towards digital channels',
          ],
          competitors: [
            `Market leader in ${mainTheme} category`,
            'Fast-growing competitor with unique positioning',
            'Traditional player with strong brand recognition',
          ],
          influencers: [
            `@${mainTheme.toLowerCase().replace(/\s+/g, '')}pro (150K+ followers, high engagement)`,
            `@${secondaryTheme.toLowerCase().replace(/\s+/g, '')}guru (80K+ followers, niche expert)`,
          ],
          best_posting_times: ['7-9 AM', '12-1 PM', '7-9 PM'],
          research_context: `Analysis based on: ${keywords.slice(0, 3).join(', ')}`,
        });
      }, 1800);
    });
  },

  media: (input) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userInput = input || 'campaign';
        const keywords = extractKeywords(userInput);
        const mainTheme = keywords[0] || 'Campaign';
        const platforms = detectPlatforms(userInput);
        const today = new Date();
        
        resolve({
          schedule: [
            { 
              date: formatDate(addDays(today, 1)), 
              platform: platforms[0], 
              content: `Launch announcement: ${mainTheme} campaign kickoff` 
            },
            { 
              date: formatDate(addDays(today, 3)), 
              platform: platforms[1], 
              content: `Behind the scenes: How ${mainTheme} came to life` 
            },
            { 
              date: formatDate(addDays(today, 7)), 
              platform: platforms[0], 
              content: `User testimonials and ${mainTheme} success stories` 
            },
          ],
          budget_allocation: {
            [`${platforms[0]} Ads`]: '35%',
            [`${platforms[1]} Ads`]: '25%',
            'Influencer Partnerships': '25%',
            'Content Creation': '15%',
          },
          kpis: ['Reach: 100K+', 'Engagement Rate: 5%+', 'Conversions: 1000+'],
          campaign_context: `Media plan for: ${keywords.slice(0, 2).join(' & ')}`,
        });
      }, 1600);
    });
  },
};

// Helper functions to generate dynamic content
function generateTagline(input) {
  const keywords = extractKeywords(input);
  const templates = [
    `${keywords[0]} That Works`,
    `${keywords[0]}, Simplified`,
    `The Future of ${keywords[0]}`,
    `${keywords[0]} Redefined`,
    `Experience ${keywords[0]} Differently`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function extractKeywords(input) {
  // If input is a JSON object string, parse it and extract meaningful values
  let textToAnalyze = input;
  
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(input);
    if (typeof parsed === 'object' && parsed !== null) {
      // Extract text from common fields
      const meaningfulFields = [
        parsed.core_concept,
        parsed.tagline,
        parsed.target_audience,
        parsed.user_brief,
        parsed.brief,
        ...(Array.isArray(parsed.key_messages) ? parsed.key_messages : []),
      ].filter(Boolean).join(' ');
      
      textToAnalyze = meaningfulFields || input;
    }
  } catch (e) {
    // Not JSON, use as-is
    textToAnalyze = input;
  }

  const stopWords = [
    'the', 'a', 'an', 'for', 'to', 'of', 'in', 'on', 'with', 'campaign', 
    'brand', 'strategic', 'positioning', 'based', 'that', 'and', 'or',
    'core', 'concept', 'tagline', 'target', 'audience', 'value', 'proposition'
  ];
  
  const words = textToAnalyze.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .map(word => word.charAt(0).toUpperCase() + word.slice(1));
  
  // Get unique keywords
  const uniqueWords = [...new Set(words)];
  
  return uniqueWords.length > 0 ? uniqueWords.slice(0, 5) : ['Product', 'Innovation'];
}

function detectTone(input) {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('eco') || lowerInput.includes('green') || lowerInput.includes('sustain')) {
    return 'Authentic, purpose-driven, conscious';
  } else if (lowerInput.includes('tech') || lowerInput.includes('digital') || lowerInput.includes('ai')) {
    return 'Innovative, cutting-edge, forward-thinking';
  } else if (lowerInput.includes('luxury') || lowerInput.includes('premium')) {
    return 'Sophisticated, elegant, aspirational';
  } else if (lowerInput.includes('fun') || lowerInput.includes('young') || lowerInput.includes('gen z')) {
    return 'Energetic, playful, authentic';
  }
  return 'Professional, engaging, trustworthy';
}

function detectChannels(input) {
  const lowerInput = input.toLowerCase();
  const channels = [];
  
  if (lowerInput.includes('instagram') || lowerInput.includes('visual') || lowerInput.includes('photo')) {
    channels.push('Instagram');
  }
  if (lowerInput.includes('tiktok') || lowerInput.includes('video') || lowerInput.includes('gen z')) {
    channels.push('TikTok');
  }
  if (lowerInput.includes('linkedin') || lowerInput.includes('b2b') || lowerInput.includes('professional')) {
    channels.push('LinkedIn');
  }
  if (lowerInput.includes('facebook') || lowerInput.includes('fb')) {
    channels.push('Facebook');
  }
  if (lowerInput.includes('twitter') || lowerInput.includes('tweet')) {
    channels.push('Twitter');
  }
  
  // Default channels if none detected
  if (channels.length === 0) {
    return ['Instagram', 'Facebook', 'Twitter'];
  }
  
  return channels;
}

function detectPlatforms(input) {
  const channels = detectChannels(input);
  return channels.slice(0, 2).length === 2 ? channels.slice(0, 2) : ['Instagram', 'Facebook'];
}

function detectTheme(input) {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('eco') || lowerInput.includes('green') || lowerInput.includes('nature')) {
    return {
      style: 'Natural, organic, earth-toned',
      colors: ['#2D5016', '#8DB600', '#F4E4C1', '#A0826D'],
      description: 'Earthy, warm, natural aesthetic with organic elements'
    };
  } else if (lowerInput.includes('tech') || lowerInput.includes('digital') || lowerInput.includes('ai')) {
    return {
      style: 'Modern, sleek, minimalist',
      colors: ['#0066FF', '#00D9FF', '#1E1E2E', '#E2E8F0'],
      description: 'Futuristic, clean, tech-forward with blue accents'
    };
  } else if (lowerInput.includes('luxury') || lowerInput.includes('premium')) {
    return {
      style: 'Elegant, sophisticated, high-end',
      colors: ['#000000', '#D4AF37', '#FFFFFF', '#2C2C2C'],
      description: 'Luxurious, refined aesthetic with gold accents'
    };
  } else if (lowerInput.includes('fun') || lowerInput.includes('young') || lowerInput.includes('colorful')) {
    return {
      style: 'Vibrant, energetic, playful',
      colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'],
      description: 'Bold, colorful, youthful with dynamic elements'
    };
  }
  
  return {
    style: 'Professional, clean, modern',
    colors: ['#5B9DFE', '#1E1E2E', '#E2E8F0', '#64748B'],
    description: 'Professional, trustworthy aesthetic with brand colors'
  };
}

function generateHashtag(keyword) {
  return `#${keyword.replace(/\s+/g, '')}`;
}

function generateEmoji(input) {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('eco') || lowerInput.includes('green')) return '🌱';
  if (lowerInput.includes('tech') || lowerInput.includes('ai')) return '🚀';
  if (lowerInput.includes('food') || lowerInput.includes('coffee')) return '☕';
  if (lowerInput.includes('fashion') || lowerInput.includes('style')) return '👗';
  if (lowerInput.includes('travel')) return '✈️';
  if (lowerInput.includes('fitness') || lowerInput.includes('health')) return '💪';
  return '✨';
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export const agentAPI = {
  // Run individual agent
  runAgent: async (agentType, input) => {
    console.log(`🚀 Running ${agentType} agent with input:`, input);
    console.log(`📡 USE_REAL_API: ${USE_REAL_API}`);

    // Use real API if enabled
    if (USE_REAL_API) {
      try {
        console.log(`📞 Calling backend: POST ${API_BASE_URL}/api/agents/${agentType}`);
        const response = await axios.post(`${API_BASE_URL}/api/agents/${agentType}`, {
          input: input
        });
        
        console.log(`✅ Backend response:`, response.data);
        
        // Backend returns { success: true, output: {...} }
        if (response.data.success) {
          return response.data.output;
        } else {
          throw new Error(response.data.error || 'Agent execution failed');
        }
      } catch (error) {
        console.error(`❌ Backend API call failed for ${agentType}:`, error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          throw new Error(error.response.data.detail || `Failed to run ${agentType} agent`);
        }
        throw error;
      }
    }

    // Fallback to mock responses
    console.log(`🔧 Using mock response for ${agentType}`);
    if (mockAgentResponses[agentType]) {
      return await mockAgentResponses[agentType](input);
    }

    throw new Error(`Unknown agent type: ${agentType}`);
  },

  // Run full workflow (optional - for backend orchestration)
  runWorkflow: async (workflowData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/workflow/run`, workflowData);
      return response.data;
    } catch (error) {
      console.error('Workflow execution failed:', error);
      throw error;
    }
  },

  // Save workflow to backend (optional)
  saveWorkflow: async (workflowData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/workflow/save`, workflowData);
      return response.data;
    } catch (error) {
      console.error('Workflow save failed:', error);
      throw error;
    }
  },
};

// Real API integration functions (comment out the mock ones above when ready)
export const realAgentAPI = {
  strategy: async (input) => {
    const response = await axios.post(`${API_BASE_URL}/api/agents/strategy`, { input });
    return response.data;
  },

  copywriting: async (input) => {
    const response = await axios.post(`${API_BASE_URL}/api/agents/copywriting`, { input });
    return response.data;
  },

  visual: async (input) => {
    const response = await axios.post(`${API_BASE_URL}/api/agents/visual`, { input });
    return response.data;
  },

  research: async (input) => {
    const response = await axios.post(`${API_BASE_URL}/api/agents/research`, { input });
    return response.data;
  },

  media: async (input) => {
    const response = await axios.post(`${API_BASE_URL}/api/agents/media`, { input });
    return response.data;
  },

  influencer: async (input) => {
    const response = await axios.post(`${API_BASE_URL}/api/agents/influencer`, { input });
    return response.data;
  },
};

