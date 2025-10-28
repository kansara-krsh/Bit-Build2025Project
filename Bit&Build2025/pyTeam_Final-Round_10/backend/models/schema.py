from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

class RetryPolicy(BaseModel):
    max_attempts: int = 3
    backoff: Literal["exponential", "linear"] = "exponential"

class ToolCall(BaseModel):
    tool: Literal["llm_text", "image_generate", "web_search", "moderation", "store_asset", "compute_embedding"]
    id: str
    input: Dict[str, Any]
    expected_output_schema: Dict[str, Any]
    retry_policy: RetryPolicy = Field(default_factory=lambda: RetryPolicy())
    safety_checks: List[str] = Field(default_factory=list)
    requires_approval: bool = False
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, str]] = None

class AssetSafety(BaseModel):
    moderation_passed: bool = True
    issues: List[str] = Field(default_factory=list)

class Asset(BaseModel):
    id: str
    type: Literal["image", "text", "video_script", "caption", "blog", "flyer"]
    version: int = 1
    seed: Optional[int] = None
    prompt: str
    model: Optional[str] = None
    provider: Optional[str] = None
    url: Optional[str] = None
    content: Optional[str] = None
    safety: AssetSafety = Field(default_factory=AssetSafety)
    tool_calls: List[ToolCall] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class PostingCalendarItem(BaseModel):
    date: str
    channel: str
    asset_ids: List[str]
    caption: Optional[str] = None
    requires_approval: bool = True

class Influencer(BaseModel):
    name: str
    handle: str
    platform: str
    followers: str
    engagement_rate: Optional[str] = None

class LocationTrendsRequest(BaseModel):
    location: str
    coordinates: Optional[Dict[str, float]] = None
    search_context: Optional[str] = "marketing trends"

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class CampaignStrategy(BaseModel):
    core_concept: str
    tagline: str
    target_audience: str
    key_messages: List[str]
    tone: str
    channels: List[str]

class CampaignManifest(BaseModel):
    campaign_id: str
    brief: str
    created_at: str
    timezone: str = "Asia/Kolkata"
    strategy: CampaignStrategy
    asset_plan: List[Asset]
    posting_calendar: List[PostingCalendarItem] = Field(default_factory=list)
    influencers: List[Influencer] = Field(default_factory=list)
    status: Literal["draft", "generating", "ready", "approved"] = "draft"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CampaignManifestWrapper(BaseModel):
    campaign_manifest: CampaignManifest

class BriefRequest(BaseModel):
    brief: str

class RegenerateRequest(BaseModel):
    asset_id: str
    modify_instructions: Optional[str] = None
