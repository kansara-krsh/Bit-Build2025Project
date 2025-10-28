"""
Media Planner Agent - Advanced Multi-Step Reasoning AI Agent
Performs comprehensive media planning with platform optimization, scheduling, and influencer recommendations
"""

import google.generativeai as genai
import os
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta
import pytz

class MediaPlannerAgent:
    """
    Autonomous Media Planner Agent that performs:
    1. Audience-Platform Fit Analysis
    2. Channel Role Definition
    3. Content-Format Mapping
    4. Posting Schedule Optimization
    5. Influencer/Partner Selection
    6. Paid vs Organic Mix Strategy
    7. KPI & Metric Setup
    """
    
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Platform engagement data (best times to post)
        self.platform_engagement_times = {
            "instagram": {
                "best_days": ["Wednesday", "Thursday", "Friday"],
                "best_times": ["11:00 AM", "1:00 PM", "7:00 PM"],
                "peak_hours": ["7-9 PM"],
                "content_types": ["Reels", "Stories", "Carousel", "Static Posts"]
            },
            "youtube": {
                "best_days": ["Thursday", "Friday", "Saturday"],
                "best_times": ["2:00 PM", "5:00 PM", "8:00 PM"],
                "peak_hours": ["2-4 PM", "8-10 PM"],
                "content_types": ["Shorts", "Long-form Videos", "Live Streams"]
            },
            "facebook": {
                "best_days": ["Tuesday", "Wednesday", "Thursday"],
                "best_times": ["9:00 AM", "1:00 PM", "3:00 PM"],
                "peak_hours": ["1-3 PM"],
                "content_types": ["Videos", "Images", "Links", "Events"]
            },
            "linkedin": {
                "best_days": ["Tuesday", "Wednesday", "Thursday"],
                "best_times": ["8:00 AM", "12:00 PM", "5:00 PM"],
                "peak_hours": ["7-9 AM", "5-6 PM"],
                "content_types": ["Articles", "Documents", "Images", "Videos"]
            },
            "twitter": {
                "best_days": ["Monday", "Wednesday", "Friday"],
                "best_times": ["9:00 AM", "12:00 PM", "6:00 PM"],
                "peak_hours": ["12-1 PM", "5-6 PM"],
                "content_types": ["Tweets", "Threads", "Images", "Videos"]
            },
            "tiktok": {
                "best_days": ["Tuesday", "Thursday", "Friday"],
                "best_times": ["6:00 AM", "10:00 AM", "7:00 PM"],
                "peak_hours": ["7-9 PM"],
                "content_types": ["Short Videos", "Duets", "Challenges"]
            }
        }
        
    def create_media_plan(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create comprehensive media plan using multi-step reasoning
        """
        brief = campaign_data.get("brief", "")
        strategy = campaign_data.get("strategy", {})
        target_audience = strategy.get("target_audience", "General audience")
        campaign_duration = campaign_data.get("duration", 14)  # Default 2 weeks
        budget = campaign_data.get("budget", "medium")
        location = campaign_data.get("location", "India")
        
        # Step 1: Audience-Platform Fit
        platform_analysis = self._analyze_audience_platform_fit(
            brief, target_audience, location
        )
        
        # Step 2: Channel Role Definition
        channel_roles = self._define_channel_roles(
            platform_analysis["recommended_platforms"], strategy
        )
        
        # Step 3: Content-Format Mapping
        content_mapping = self._map_content_formats(
            platform_analysis["recommended_platforms"], strategy
        )
        
        # Step 4: Posting Schedule Optimization
        posting_schedule = self._optimize_posting_schedule(
            platform_analysis["recommended_platforms"],
            content_mapping,
            campaign_duration,
            location
        )
        
        # Step 5: Influencer/Partner Selection
        influencer_recommendations = self._select_influencers(
            brief, target_audience, platform_analysis["recommended_platforms"], location
        )
        
        # Step 6: Paid vs Organic Mix
        budget_allocation = self._calculate_paid_organic_mix(
            platform_analysis["recommended_platforms"], budget
        )
        
        # Step 7: KPI & Metric Setup
        kpis = self._setup_kpis(
            platform_analysis["recommended_platforms"], strategy
        )
        
        # Compile complete media plan
        media_plan = {
            "plan_id": f"mp_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "created_at": datetime.now(pytz.timezone('Asia/Kolkata')).isoformat(),
            "campaign_brief": brief,
            "platform_analysis": platform_analysis,
            "channel_roles": channel_roles,
            "content_mapping": content_mapping,
            "posting_schedule": posting_schedule,
            "influencer_recommendations": influencer_recommendations,
            "budget_allocation": budget_allocation,
            "kpis": kpis,
            "summary": self._generate_executive_summary(
                platform_analysis, posting_schedule, influencer_recommendations, budget_allocation
            )
        }
        
        return media_plan
    
    def _analyze_audience_platform_fit(self, brief: str, target_audience: str, location: str) -> Dict[str, Any]:
        """Step 1: Analyze which platforms best match the target audience"""
        
        prompt = f"""You are a Media Planning Expert. Analyze the audience-platform fit.

Campaign Brief: {brief}
Target Audience: {target_audience}
Location: {location}

Analyze and recommend the TOP 3-5 digital platforms for this campaign based on:
- Audience demographics and behavior
- Platform user base in {location}
- Content type suitability
- Engagement potential

Return a JSON object with this structure:
{{
    "recommended_platforms": [
        {{
            "platform": "instagram",
            "priority": "high",
            "audience_match_score": 95,
            "reasoning": "Why this platform is ideal",
            "audience_demographics": "Key demographic data",
            "penetration_rate": "% of target audience on this platform"
        }}
    ],
    "platform_ranking": ["instagram", "youtube", "facebook"],
    "audience_insights": {{
        "primary_age_group": "18-34",
        "gender_distribution": "60% Female, 40% Male",
        "interests": ["list", "of", "interests"],
        "online_behavior": "When and how they consume content",
        "device_preference": "Mobile-first / Desktop"
    }}
}}

Be data-driven and specific. Consider {location} market trends."""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,
                    "max_output_tokens": 2000
                }
            )
            
            result = self._extract_json(response.text)
            return result if result else self._get_default_platform_analysis()
            
        except Exception as e:
            print(f"Error in platform analysis: {e}")
            return self._get_default_platform_analysis()
    
    def _define_channel_roles(self, platforms: List[Dict], strategy: Dict) -> Dict[str, Any]:
        """Step 2: Define the strategic role of each platform"""
        
        channel_roles = {}
        
        role_mapping = {
            "instagram": {
                "primary_role": "Visual Storytelling & Community Building",
                "content_focus": "Behind-the-scenes, user-generated content, lifestyle imagery",
                "engagement_type": "High interaction through Stories, Reels, and Comments",
                "funnel_stage": "Awareness & Consideration"
            },
            "youtube": {
                "primary_role": "Educational Content & Thought Leadership",
                "content_focus": "How-to videos, product demos, long-form storytelling",
                "engagement_type": "Deep engagement through video content",
                "funnel_stage": "Consideration & Conversion"
            },
            "facebook": {
                "primary_role": "Community Management & Events",
                "content_focus": "Announcements, events, community discussions",
                "engagement_type": "Group interactions and event participation",
                "funnel_stage": "Consideration & Retention"
            },
            "linkedin": {
                "primary_role": "Professional Networking & B2B Outreach",
                "content_focus": "Industry insights, thought leadership, company updates",
                "engagement_type": "Professional discussions and networking",
                "funnel_stage": "Awareness & Lead Generation"
            },
            "twitter": {
                "primary_role": "Real-time Engagement & Customer Service",
                "content_focus": "News, quick updates, conversations, trending topics",
                "engagement_type": "Fast-paced interactions and conversations",
                "funnel_stage": "Awareness & Engagement"
            },
            "tiktok": {
                "primary_role": "Viral Content & Trend Participation",
                "content_focus": "Short-form video, challenges, trending sounds",
                "engagement_type": "High virality potential and trend-based engagement",
                "funnel_stage": "Awareness & Virality"
            }
        }
        
        for platform in platforms:
            platform_name = platform.get("platform", "").lower()
            if platform_name in role_mapping:
                channel_roles[platform_name] = role_mapping[platform_name]
        
        return {
            "channel_roles": channel_roles,
            "multi_channel_strategy": "Each platform serves a unique purpose in the customer journey"
        }
    
    def _map_content_formats(self, platforms: List[Dict], strategy: Dict) -> Dict[str, Any]:
        """Step 3: Map content types to platforms"""
        
        content_mapping = {}
        
        for platform in platforms:
            platform_name = platform.get("platform", "").lower()
            
            if platform_name in self.platform_engagement_times:
                content_types = self.platform_engagement_times[platform_name]["content_types"]
                
                content_mapping[platform_name] = {
                    "supported_formats": content_types,
                    "recommended_mix": self._get_content_mix(platform_name),
                    "content_examples": self._generate_content_examples(platform_name, strategy)
                }
        
        return {
            "platform_content_mapping": content_mapping,
            "cross_platform_content": self._identify_cross_platform_content()
        }
    
    def _optimize_posting_schedule(
        self, 
        platforms: List[Dict], 
        content_mapping: Dict,
        duration: int,
        location: str
    ) -> List[Dict]:
        """Step 4: Generate optimized posting schedule"""
        
        timezone = pytz.timezone('Asia/Kolkata')
        start_date = datetime.now(timezone)
        schedule = []
        
        # Generate schedule for each platform
        for platform in platforms:
            platform_name = platform.get("platform", "").lower()
            
            if platform_name not in self.platform_engagement_times:
                continue
            
            timing_data = self.platform_engagement_times[platform_name]
            best_days = timing_data["best_days"]
            best_times = timing_data["best_times"]
            content_types = timing_data["content_types"]
            
            # Create posts for the duration
            current_date = start_date
            post_count = 0
            max_posts = duration // 2  # Post every 2 days on average
            
            while post_count < max_posts and (current_date - start_date).days < duration:
                day_name = current_date.strftime("%A")
                
                if day_name in best_days:
                    # Pick a random best time
                    import random
                    post_time = random.choice(best_times)
                    content_type = random.choice(content_types)
                    
                    post = {
                        "date": current_date.strftime("%Y-%m-%d"),
                        "day": day_name,
                        "time": post_time,
                        "platform": platform_name,
                        "content_type": content_type,
                        "status": "scheduled",
                        "requires_approval": True,
                        "priority": platform.get("priority", "medium"),
                        "suggested_theme": self._suggest_theme_for_date(current_date, platform_name)
                    }
                    
                    schedule.append(post)
                    post_count += 1
                
                current_date += timedelta(days=1)
        
        # Sort by date and time
        schedule.sort(key=lambda x: (x["date"], x["time"]))
        
        return schedule
    
    def _select_influencers(
        self, 
        brief: str, 
        target_audience: str, 
        platforms: List[Dict],
        location: str
    ) -> List[Dict]:
        """Step 5: Generate influencer recommendations"""
        
        prompt = f"""You are an Influencer Marketing Expert. Recommend relevant influencers/partners.

Campaign Brief: {brief}
Target Audience: {target_audience}
Location: {location}
Platforms: {[p.get('platform') for p in platforms]}

Recommend 5-8 influencers or content creators who would be perfect for this campaign.

Return JSON array:
[
    {{
        "name": "Influencer Name",
        "handle": "@username",
        "platform": "instagram",
        "followers": "250K",
        "engagement_rate": "4.5%",
        "niche": "Sustainability, Lifestyle",
        "audience_match": "85%",
        "estimated_cost": "₹50,000 - ₹75,000 per post",
        "why_recommended": "Specific reason",
        "content_style": "Description",
        "collaboration_type": "Sponsored Post / Brand Ambassador / Affiliate",
        "location": "Mumbai, India",
        "previous_brand_collabs": ["Brand1", "Brand2"],
        "outreach_priority": "high"
    }}
]

Focus on {location}-based influencers. Be realistic with follower counts and rates."""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.4,
                    "max_output_tokens": 2500
                }
            )
            
            result = self._extract_json(response.text)
            return result if isinstance(result, list) else self._get_default_influencers()
            
        except Exception as e:
            print(f"Error in influencer selection: {e}")
            return self._get_default_influencers()
    
    def _calculate_paid_organic_mix(self, platforms: List[Dict], budget: str) -> Dict[str, Any]:
        """Step 6: Calculate paid vs organic content mix"""
        
        budget_multipliers = {
            "low": 0.5,
            "medium": 1.0,
            "high": 2.0
        }
        
        multiplier = budget_multipliers.get(budget, 1.0)
        
        allocation = {}
        
        for platform in platforms:
            platform_name = platform.get("platform", "").lower()
            priority = platform.get("priority", "medium")
            
            # Base allocation percentages
            if priority == "high":
                paid_percentage = 40 * multiplier if multiplier < 1.5 else 50
                organic_percentage = 60
            elif priority == "medium":
                paid_percentage = 25 * multiplier if multiplier < 1.5 else 35
                organic_percentage = 75
            else:
                paid_percentage = 15 * multiplier if multiplier < 1.5 else 20
                organic_percentage = 85
            
            # Ensure total = 100%
            total = paid_percentage + organic_percentage
            paid_percentage = (paid_percentage / total) * 100
            organic_percentage = (organic_percentage / total) * 100
            
            allocation[platform_name] = {
                "paid_percentage": round(paid_percentage, 1),
                "organic_percentage": round(organic_percentage, 1),
                "recommended_ad_types": self._get_ad_types(platform_name),
                "estimated_reach": self._estimate_reach(platform_name, budget),
                "suggested_daily_budget": self._suggest_daily_budget(platform_name, budget)
            }
        
        return {
            "platform_allocation": allocation,
            "overall_strategy": self._get_paid_organic_strategy(budget),
            "budget_level": budget
        }
    
    def _setup_kpis(self, platforms: List[Dict], strategy: Dict) -> Dict[str, Any]:
        """Step 7: Define KPIs and metrics for tracking"""
        
        kpis = {
            "awareness_metrics": {
                "impressions": {"target": "500K+", "platforms": ["instagram", "facebook", "youtube"]},
                "reach": {"target": "300K+", "platforms": ["instagram", "facebook", "twitter"]},
                "video_views": {"target": "200K+", "platforms": ["youtube", "instagram", "tiktok"]},
                "profile_visits": {"target": "50K+", "platforms": ["instagram", "linkedin"]}
            },
            "engagement_metrics": {
                "engagement_rate": {"target": "4-6%", "platforms": ["instagram", "facebook", "tiktok"]},
                "likes": {"target": "20K+", "platforms": ["instagram", "facebook"]},
                "comments": {"target": "5K+", "platforms": ["instagram", "youtube"]},
                "shares": {"target": "10K+", "platforms": ["facebook", "twitter", "linkedin"]},
                "saves": {"target": "8K+", "platforms": ["instagram"]}
            },
            "conversion_metrics": {
                "click_through_rate": {"target": "2-3%", "platforms": ["all"]},
                "website_visits": {"target": "50K+", "platforms": ["all"]},
                "lead_generation": {"target": "5K+", "platforms": ["facebook", "linkedin"]},
                "conversions": {"target": "1K+", "platforms": ["all"]},
                "cost_per_click": {"target": "₹5-10", "platforms": ["facebook", "instagram"]}
            },
            "platform_specific_metrics": self._get_platform_specific_kpis(platforms)
        }
        
        return kpis
    
    def _generate_executive_summary(
        self,
        platform_analysis: Dict,
        posting_schedule: List[Dict],
        influencer_recommendations: List[Dict],
        budget_allocation: Dict
    ) -> Dict[str, Any]:
        """Generate executive summary of the media plan"""
        
        return {
            "total_platforms": len(platform_analysis.get("recommended_platforms", [])),
            "primary_platforms": platform_analysis.get("platform_ranking", [])[:3],
            "total_scheduled_posts": len(posting_schedule),
            "posting_frequency": f"{len(posting_schedule) // 14} posts per day" if posting_schedule else "0",
            "influencer_collaborations": len(influencer_recommendations),
            "campaign_reach_estimate": "500K+ impressions across all platforms",
            "key_focus_areas": [
                "Visual storytelling on Instagram",
                "Educational content on YouTube",
                "Community building across platforms"
            ],
            "success_criteria": [
                "Achieve 4%+ engagement rate",
                "Generate 50K+ website visits",
                "Build brand awareness in target demographic"
            ]
        }
    
    # Helper methods
    
    def _extract_json(self, text: str) -> Any:
        """Extract JSON from response text"""
        try:
            # Try to find JSON in code blocks
            if "```json" in text:
                json_text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                json_text = text.split("```")[1].split("```")[0].strip()
            else:
                json_text = text.strip()
            
            return json.loads(json_text)
        except:
            return None
    
    def _get_default_platform_analysis(self) -> Dict:
        """Fallback platform analysis"""
        return {
            "recommended_platforms": [
                {
                    "platform": "instagram",
                    "priority": "high",
                    "audience_match_score": 90,
                    "reasoning": "High visual engagement and strong presence in target demographic"
                },
                {
                    "platform": "facebook",
                    "priority": "medium",
                    "audience_match_score": 75,
                    "reasoning": "Broad reach and effective for community building"
                }
            ],
            "platform_ranking": ["instagram", "facebook", "youtube"]
        }
    
    def _get_default_influencers(self) -> List[Dict]:
        """Fallback influencer list"""
        return [
            {
                "name": "Sample Influencer",
                "handle": "@sampleinfluencer",
                "platform": "instagram",
                "followers": "100K",
                "niche": "Lifestyle",
                "why_recommended": "Strong engagement with target audience"
            }
        ]
    
    def _get_content_mix(self, platform: str) -> Dict:
        """Get recommended content mix for platform"""
        mixes = {
            "instagram": {"reels": "40%", "stories": "30%", "posts": "20%", "carousel": "10%"},
            "youtube": {"shorts": "50%", "long_form": "40%", "live": "10%"},
            "facebook": {"videos": "40%", "images": "30%", "links": "20%", "events": "10%"},
            "linkedin": {"articles": "40%", "images": "30%", "videos": "20%", "documents": "10%"},
            "twitter": {"tweets": "50%", "threads": "30%", "images": "15%", "videos": "5%"},
            "tiktok": {"videos": "100%"}
        }
        return mixes.get(platform, {"mixed": "100%"})
    
    def _generate_content_examples(self, platform: str, strategy: Dict) -> List[str]:
        """Generate content examples for platform"""
        return [
            f"Example 1: Behind-the-scenes content",
            f"Example 2: User testimonial",
            f"Example 3: Product showcase"
        ]
    
    def _identify_cross_platform_content(self) -> Dict:
        """Identify content that can be repurposed across platforms"""
        return {
            "repurposable_content": [
                "Hero images can be used across Instagram, Facebook, LinkedIn",
                "Video content can be edited into Reels, Shorts, and TikToks",
                "Blog posts can become LinkedIn articles and Twitter threads"
            ]
        }
    
    def _suggest_theme_for_date(self, date: datetime, platform: str) -> str:
        """Suggest content theme based on date"""
        themes = [
            "Product Spotlight",
            "Customer Story",
            "Behind The Scenes",
            "Tips & Tricks",
            "Community Highlight",
            "Special Offer",
            "Educational Content"
        ]
        import random
        return random.choice(themes)
    
    def _get_ad_types(self, platform: str) -> List[str]:
        """Get recommended ad types for platform"""
        ad_types = {
            "instagram": ["Story Ads", "Reel Ads", "Feed Ads", "Explore Ads"],
            "facebook": ["News Feed Ads", "Video Ads", "Carousel Ads", "Collection Ads"],
            "youtube": ["Pre-roll Ads", "Mid-roll Ads", "Display Ads", "Overlay Ads"],
            "linkedin": ["Sponsored Content", "Message Ads", "Dynamic Ads", "Text Ads"],
            "twitter": ["Promoted Tweets", "Promoted Trends", "Promoted Accounts"],
            "tiktok": ["In-Feed Ads", "TopView Ads", "Branded Hashtag Challenge"]
        }
        return ad_types.get(platform, ["Standard Ads"])
    
    def _estimate_reach(self, platform: str, budget: str) -> str:
        """Estimate reach based on platform and budget"""
        estimates = {
            "low": {"instagram": "50K-100K", "facebook": "75K-150K", "youtube": "40K-80K"},
            "medium": {"instagram": "150K-300K", "facebook": "200K-400K", "youtube": "100K-200K"},
            "high": {"instagram": "400K-800K", "facebook": "500K-1M", "youtube": "300K-600K"}
        }
        return estimates.get(budget, {}).get(platform, "50K-100K")
    
    def _suggest_daily_budget(self, platform: str, budget: str) -> str:
        """Suggest daily budget for platform"""
        budgets = {
            "low": {"instagram": "₹500-1000", "facebook": "₹500-1000", "youtube": "₹750-1500"},
            "medium": {"instagram": "₹2000-3000", "facebook": "₹2000-3000", "youtube": "₹2500-4000"},
            "high": {"instagram": "₹5000-8000", "facebook": "₹5000-8000", "youtube": "₹6000-10000"}
        }
        return budgets.get(budget, {}).get(platform, "₹1000-2000")
    
    def _get_platform_specific_kpis(self, platforms: List[Dict]) -> Dict:
        """Get platform-specific KPIs"""
        kpis = {}
        for platform in platforms:
            name = platform.get("platform", "").lower()
            if name == "instagram":
                kpis["instagram"] = {"story_completion_rate": "70%+", "reel_plays": "100K+"}
            elif name == "youtube":
                kpis["youtube"] = {"watch_time": "50K+ hours", "subscribers_gained": "5K+"}
            elif name == "linkedin":
                kpis["linkedin"] = {"connection_requests": "2K+", "article_reads": "20K+"}
        return kpis
    
    def _get_paid_organic_strategy(self, budget: str) -> str:
        """Get overall paid/organic strategy description"""
        strategies = {
            "low": "Focus primarily on organic growth with selective paid boosts for high-performing content",
            "medium": "Balanced approach with 30-40% budget on paid ads to amplify organic reach",
            "high": "Aggressive paid strategy with 50%+ budget on ads for maximum reach and conversions"
        }
        return strategies.get(budget, "Balanced paid and organic approach")
