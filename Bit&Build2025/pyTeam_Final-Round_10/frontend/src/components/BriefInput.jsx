import React, { useState } from 'react';
import { api } from '../api';
import { Send, Loader2 } from 'lucide-react';

// Input validation function
const validateCampaignInput = (input) => {
  const trimmedInput = input.trim().toLowerCase();
  
  const invalidInputPatterns = [
    // Generic meaningless requests
    /^(i want|give me|create|make|do|help|please|can you|show me)\s*(a|an|some)?\s*(xyz|abc|test|demo|example|random|generic|simple|basic)\s*(campaign|ad|content|post|strategy|plan|workflow|agent|thing|stuff)?$/i,
    
    // Random gibberish
    /^[a-z]{1,3}[a-z]*[0-9]*[a-z]*$/i,
    
    // Very short meaningless inputs
    /^(test|hi|hello|hey|ok|yes|no|lol|haha|hmm|ugh|meh|blah|abc|xyz|123|asdf|qwerty)$/i,
    
    // Only numbers or special characters
    /^[\d\s\!\@\#\$\%\^\&\*\(\)\-\_\=\+\[\]\{\}\|\\\:\;\"\'\<\>\,\.\?\/\~\`]+$/,
    
    // Empty or only whitespace
    /^\s*$/,
    
    // Keyboard mashing patterns
    /^([a-z])\1{3,}$/i,
    /^[qwertyuiop]{5,}$/i,
    /^[asdfghjkl]{5,}$/i,
    /^[zxcvbnm]{5,}$/i,
    
    // Common spam/test patterns
    /^(lorem ipsum|test test|bla bla|na na|la la|spam|random|garbage|trash|nonsense|meaningless|pointless)$/i
  ];

  const shortMeaninglessWords = ['xyz', 'abc', 'test', 'demo', 'example', 'random', 'generic', 'simple', 'basic', 'thing', 'stuff', 'blah', 'meh', 'whatever'];
  
  // Check if input is too short and meaningful
  if (trimmedInput.length > 0 && trimmedInput.length < 10) {
    const words = trimmedInput.split(/\s+/);
    if (words.length <= 2 && words.every(word => shortMeaninglessWords.includes(word))) {
      return {
        isValid: false,
        error: `Please provide a more detailed and specific campaign description. \n\nFor example:\n• "Create a social media campaign for our eco-friendly coffee brand targeting millennials in Mumbai"\n• "Design Instagram posts for a fitness app launch with motivational quotes and workout tips"\n• "Develop a marketing strategy for sustainable fashion brand focusing on Gen Z consumers"`
      };
    }
  }
  
  // Check against invalid patterns
  for (const pattern of invalidInputPatterns) {
    if (pattern.test(trimmedInput)) {
      return {
        isValid: false,
        error: `Please provide a clear, specific campaign description. \n\nTell us:\n• What product/service you're promoting\n• Who your target audience is\n• What platforms you want to use\n• What goals you want to achieve\n\nExample: "Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day"`
      };
    }
  }

  // Check for minimum meaningful content
  if (trimmedInput.length > 0 && trimmedInput.length < 20) {
    const words = trimmedInput.split(/\s+/).filter(word => word.length > 2);
    if (words.length < 3) {
      return {
        isValid: false,
        error: `Please provide more details about your campaign. Your description is too brief.\n\nInclude information about:\n• Your product or service\n• Target audience\n• Marketing goals\n• Preferred platforms or channels\n\nExample: "Create engaging Instagram content for our plant-based protein bars targeting fitness enthusiasts aged 25-35"`
      };
    }
  }

  return { isValid: true };
};

function BriefInput({ onCampaignGenerated, loading, setLoading }) {
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!brief.trim()) {
      setError('Please enter a campaign brief');
      return;
    }

    // Validate campaign input
    const validation = validateCampaignInput(brief);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.generateCampaign(brief);
      
      if (result.success) {
        // Limit image assets to 2 for quick mode / preview
        try {
          const campaign = { ...result.campaign };
          if (campaign.asset_plan && Array.isArray(campaign.asset_plan)) {
            const imagesOnly = campaign.asset_plan.filter(a => a.type === 'image' || a.type === 'flyer');
            const otherAssets = campaign.asset_plan.filter(a => !(a.type === 'image' || a.type === 'flyer'));
            const limitedImages = imagesOnly.slice(0, 2);
            campaign.asset_plan = [...limitedImages, ...otherAssets];
          }
          onCampaignGenerated(campaign);
        } catch (e) {
          // Fallback if structure unexpected
          onCampaignGenerated(result.campaign);
        }
      } else {
        setError('Failed to generate campaign');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Glass-morphism Card */}
      <div 
        className="rounded-3xl backdrop-blur-md border shadow-2xl p-8 md:p-10"
        style={{
          backgroundColor: 'rgba(173, 248, 45, 0.1)',
          borderColor: 'rgba(173, 248, 45, 0.3)',
        }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Create Your Campaign
        </h2>
        <p className="text-white/80 mb-6 leading-relaxed">
          Describe your marketing campaign in a few sentences. Our AI will generate a complete strategy with visuals, copy, and media planning.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="brief" className="block text-sm font-medium text-white mb-2">
              Campaign Brief
            </label>
            <textarea
              id="brief"
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[rgb(173,248,45)] focus:ring-2 focus:ring-[rgba(173,248,45,0.3)] transition-all duration-200 resize-none custom-scrollbar"
              placeholder="Example: Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <pre className="text-red-400 text-sm whitespace-pre-wrap font-sans leading-relaxed">{error}</pre>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-full font-semibold text-black text-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'rgb(173, 248, 45)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Campaign...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate Campaign
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <h3 className="font-semibold text-white mb-2">What you'll get:</h3>
          <ul className="text-sm text-white/70 space-y-2">
            <li className="flex items-center gap-2">
              <span style={{ color: 'rgb(173, 248, 45)' }}>✓</span>
              Strategic campaign concept and messaging
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'rgb(173, 248, 45)' }}>✓</span>
              Social media captions and content
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'rgb(173, 248, 45)' }}>✓</span>
              AI-generated visuals and graphics
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'rgb(173, 248, 45)' }}>✓</span>
              Instagram Reel scripts
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'rgb(173, 248, 45)' }}>✓</span>
              Influencer recommendations
            </li>
            <li className="flex items-center gap-2">
              <span style={{ color: 'rgb(173, 248, 45)' }}>✓</span>
              Posting calendar and media plan
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BriefInput;
