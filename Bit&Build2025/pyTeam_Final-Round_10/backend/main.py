from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
import os
import json
import re
import shutil
from pathlib import Path
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets
from io import BytesIO
import zipfile
from typing import Dict, List

from models.schema import BriefRequest, RegenerateRequest, CampaignManifest, LocationTrendsRequest, RegisterRequest, LoginRequest
from agents.orchestrator import CampaignOrchestrator

# Load environment variables from parent directory or current directory
env_path = Path(__file__).parent.parent / '.env'
if not env_path.exists():
    env_path = Path(__file__).parent / '.env'

print(f"Loading .env from: {env_path}")
print(f".env exists: {env_path.exists()}")

# Try loading with override=True to force reload
load_dotenv(dotenv_path=env_path, override=True)

# Debug: Read file directly to see what's in it
if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"\n.env file content (first 200 chars):\n{content[:200]}")
        print(f"\nSearching for GOOGLE_API_KEY in file: {'GOOGLE_API_KEY' in content}")

print(f"\nGOOGLE_API_KEY loaded: {os.getenv('GOOGLE_API_KEY') is not None}")
if os.getenv('GOOGLE_API_KEY'):
    print(f"GOOGLE_API_KEY value (first 10 chars): {os.getenv('GOOGLE_API_KEY')[:10]}")
else:
    print("GOOGLE_API_KEY is None or empty")

app = FastAPI(title="Campaign Generator API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager for collaborative editing
class CollaborationManager:
    def __init__(self):
        # workflowId -> List of active connections
        self.active_connections: Dict[str, List[Dict]] = {}
    
    async def connect(self, websocket: WebSocket, workflow_id: str, user_info: dict):
        await websocket.accept()
        if workflow_id not in self.active_connections:
            self.active_connections[workflow_id] = []
        
        connection = {
            "websocket": websocket,
            "user_id": user_info.get("user_id", str(uuid.uuid4())),
            "username": user_info.get("username", "Anonymous"),
            "color": user_info.get("color", f"#{secrets.token_hex(3)}")
        }
        self.active_connections[workflow_id].append(connection)
        
        # Notify others about new user
        await self.broadcast(workflow_id, {
            "type": "user_joined",
            "user": {
                "user_id": connection["user_id"],
                "username": connection["username"],
                "color": connection["color"]
            }
        }, exclude_websocket=websocket)
        
        return connection
    
    def disconnect(self, websocket: WebSocket, workflow_id: str):
        if workflow_id in self.active_connections:
            connection = next((c for c in self.active_connections[workflow_id] if c["websocket"] == websocket), None)
            if connection:
                self.active_connections[workflow_id].remove(connection)
                if not self.active_connections[workflow_id]:
                    del self.active_connections[workflow_id]
                return connection
        return None
    
    async def broadcast(self, workflow_id: str, message: dict, exclude_websocket: WebSocket = None):
        if workflow_id in self.active_connections:
            dead_connections = []
            sent_count = 0
            for connection in self.active_connections[workflow_id]:
                if connection["websocket"] != exclude_websocket:
                    try:
                        await connection["websocket"].send_json(message)
                        sent_count += 1
                    except:
                        dead_connections.append(connection)
            
            print(f"📡 Broadcast {message.get('type')} to {sent_count} users in workflow {workflow_id}")
            
            # Clean up dead connections
            for conn in dead_connections:
                if conn in self.active_connections[workflow_id]:
                    self.active_connections[workflow_id].remove(conn)
    
    def get_active_users(self, workflow_id: str) -> List[dict]:
        if workflow_id not in self.active_connections:
            return []
        return [
            {
                "user_id": c["user_id"],
                "username": c["username"],
                "color": c["color"]
            }
            for c in self.active_connections[workflow_id]
        ]

collaboration_manager = CollaborationManager()

# Initialize orchestrator
orchestrator = CampaignOrchestrator()

# Storage setup
STORAGE_DIR = Path("./storage")
ASSETS_DIR = STORAGE_DIR / "assets"
CAMPAIGNS_DIR = STORAGE_DIR / "campaigns"
REPORTS_DIR = STORAGE_DIR / "reports"

STORAGE_DIR.mkdir(exist_ok=True)
ASSETS_DIR.mkdir(exist_ok=True)
CAMPAIGNS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# Users directory for simple auth storage
USERS_DIR = STORAGE_DIR / "users"
USERS_DIR.mkdir(exist_ok=True)

# Invites directory for workflow invitations
INVITES_DIR = STORAGE_DIR / "invites"
INVITES_DIR.mkdir(exist_ok=True)

# Helper function to convert file paths to URLs
def convert_asset_paths_to_urls(manifest: dict) -> dict:
    """Convert local file paths in assets to HTTP URLs"""
    host = os.getenv("HOST", "localhost")
    port = os.getenv("PORT", "8000")
    base_url = f"http://{host}:{port}"
    
    # Convert asset URLs
    for asset in manifest.get("asset_plan", []):
        if asset.get("url") and isinstance(asset["url"], str):
            # If it's a file path, convert to URL
            if not asset["url"].startswith("http"):
                asset_path = Path(asset["url"])
                if asset_path.exists():
                    # Get just the filename
                    filename = asset_path.name
                    asset["url"] = f"{base_url}/assets/{filename}"
    
    return manifest

# ============================================
# Authentication Endpoints
# ============================================

def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Generate a random auth token"""
    return secrets.token_urlsafe(32)

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    try:
        print(f"Registration attempt: {request.email}")
        name = request.name.strip()
        email = request.email.strip().lower()
        password = request.password
        
        # Validation
        if not name or len(name) < 2:
            print(f"Registration failed: Name too short - {name}")
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
        
        if not email or '@' not in email:
            print(f"Registration failed: Invalid email - {email}")
            raise HTTPException(status_code=400, detail="Invalid email address")
        
        if not password or len(password) < 6:
            print(f"Registration failed: Password too short")
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
        # Check if user already exists
        user_file = USERS_DIR / f"{email.replace('@', '_at_').replace('.', '_')}.json"
        if user_file.exists():
            print(f"Registration failed: Email already exists - {email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "password_hash": hash_password(password),
            "created_at": datetime.now().isoformat(),
            "campaigns": []
        }
        
        print(f"Creating user file: {user_file}")
        with open(user_file, "w") as f:
            json.dump(user_data, f, indent=2)
        
        print(f"Registration successful: {email}")
        return {
            "success": True,
            "message": "Account created successfully",
            "user": {
                "id": user_data["id"],
                "name": user_data["name"],
                "email": user_data["email"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Login user"""
    try:
        print(f"Login attempt: {request.email}")
        email = request.email.strip().lower()
        password = request.password
        
        if not email or not password:
            print(f"Login failed: Missing email or password")
            raise HTTPException(status_code=400, detail="Email and password required")
        
        # Find user
        user_file = USERS_DIR / f"{email.replace('@', '_at_').replace('.', '_')}.json"
        if not user_file.exists():
            print(f"Login failed: User not found - {email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        print(f"Found user file: {user_file}")
        with open(user_file, "r") as f:
            user_data = json.load(f)
        
        # Verify password
        if user_data["password_hash"] != hash_password(password):
            print(f"Login failed: Invalid password for {email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        print(f"Login successful: {email}")
        # Generate token
        token = generate_token()
        
        return {
            "success": True,
            "token": token,
            "user": {
                "id": user_data["id"],
                "name": user_data["name"],
                "email": user_data["email"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Workflow Builder Agent Endpoints
# ============================================

@app.post("/api/agents/strategy")
async def run_strategy_agent(request: dict):
    """Execute Strategy Agent"""
    try:
        user_input = request.get("input", "")
        
        prompt = f"""As a brand strategy expert, analyze this brief and create a strategic foundation:

Brief: {user_input}

Provide a strategic analysis including:
1. Core campaign concept
2. A compelling tagline
3. Target audience definition
4. 3-5 key messages
5. Brand tone recommendation
6. Recommended channels

Return as JSON with keys: core_concept, tagline, target_audience, key_messages (array), tone, channels (array)"""

        result = orchestrator.llm_tool.generate_text({
            "prompt": prompt,
            "model": "gemini-2.0-flash-exp",
            "temperature": 0.3,
            "max_tokens": 800
        })
        
        if result.get("success"):
            # Parse the response
            try:
                content = result.get("text", "")
                # Try to extract JSON from markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                strategy_data = json.loads(content)
                return {"success": True, "output": strategy_data}
            except:
                # If parsing fails, return raw text
                return {"success": True, "output": {"raw_output": result.get("text")}}
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/copywriting")
async def run_copywriting_agent(request: dict):
    """Execute Copywriting Agent"""
    try:
        user_input = request.get("input", "")
        
        prompt = f"""As a creative copywriter, create engaging social media content:

Context: {user_input}

Generate:
1. 3 compelling social media captions (under 140 characters each)
2. A clear call-to-action
3. Relevant hashtags

Return as JSON with keys: captions (array of 3 strings), cta (string), hashtags (string)"""

        result = orchestrator.llm_tool.generate_text({
            "prompt": prompt,
            "model": "gemini-2.0-flash-exp",
            "temperature": 0.7,
            "max_tokens": 500
        })
        
        if result.get("success"):
            try:
                content = result.get("text", "")
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                copy_data = json.loads(content)
                return {"success": True, "output": copy_data}
            except:
                return {"success": True, "output": {"raw_output": result.get("text")}}
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/visual")
async def run_visual_agent(request: dict):
    """Execute Visual Design Agent - Generate Images"""
    try:
        user_input = request.get("input", "")
        
        # Create a prompt for image generation
        image_prompt = f"Professional marketing visual: {user_input}. High quality, modern, clean design, commercial photography style"
        
        print(f"\n🎨 Visual Agent - Generating images for: {user_input}")
        print(f"📝 Image prompt: {image_prompt}")
        
        # Generate 3 image variations
        images = []
        for i in range(3):
            print(f"🖼️ Generating image {i+1}/3...")
            result = orchestrator.image_tool.generate_image({
                "prompt": image_prompt,
                "size": "1024x1024",
                "seed": None,
                "n": 1
            })
            
            if result.get("success"):
                # Save image and get URL
                image_id = f"img_{uuid.uuid4().hex[:8]}"
                image_data = result.get("image_data")
                
                # Save to file
                image_path = ASSETS_DIR / f"{image_id}.png"
                import base64
                with open(image_path, "wb") as f:
                    f.write(base64.b64decode(image_data))
                
                print(f"✅ Image saved: {image_path}")
                
                # Create URL - use HOST and PORT from env
                host = os.getenv("HOST", "localhost")
                port = os.getenv("PORT", "8000")
                image_url = f"http://{host}:{port}/assets/{image_id}.png"
                
                images.append({
                    "id": image_id,
                    "url": image_url,
                    "thumbnail": image_url,  # Same for now
                    "selected": i == 0  # First one selected by default
                })
            else:
                print(f"❌ Image generation failed: {result.get('error')}")
        
        if images:
            print(f"✅ Visual Agent complete - Generated {len(images)} images")
            
            # Extract style info from the user input
            style_description = "Modern, professional"
            if "vintage" in user_input.lower() or "retro" in user_input.lower():
                style_description = "Vintage, retro"
            elif "minimal" in user_input.lower() or "clean" in user_input.lower():
                style_description = "Minimal, clean"
            elif "bold" in user_input.lower() or "vibrant" in user_input.lower():
                style_description = "Bold, vibrant"
            
            # Determine color palette based on input
            color_palette = ["Primary", "Accent", "Background"]
            if "blue" in user_input.lower():
                color_palette = ["Blue", "White", "Gray"]
            elif "red" in user_input.lower():
                color_palette = ["Red", "Black", "White"]
            elif "green" in user_input.lower():
                color_palette = ["Green", "White", "Earth tones"]
            elif "colorful" in user_input.lower():
                color_palette = ["Multi-color", "Vibrant", "Dynamic"]
            
            return {
                "success": True,
                "output": {
                    "images": images,
                    "prompt": image_prompt,
                    "type": "visual_with_images",
                    "style": style_description,
                    "color_palette": color_palette,
                    "selected_image": images[0]  # First image is selected by default
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate images")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/research")
async def run_research_agent(request: dict):
    """Execute Market Research Agent"""
    try:
        user_input = request.get("input", "")
        
        if not user_input:
            raise HTTPException(status_code=400, detail="Input is required")
        
        # Use search tool if available
        search_query = user_input
        search_result = orchestrator.search_tool.web_search({
            "q": search_query,
            "max_results": 5
        })
        
        if not search_result.get("success"):
            # Fallback without web search
            prompt = f"""As a market research analyst, provide insights about: {user_input}

Provide:
1. Key market trends (3-5 points)
2. Target audience insights
3. Competitive landscape
4. Opportunities

Return as JSON with keys: trends (array), audience_insights (string), competitive_landscape (string), opportunities (array)"""

            llm_result = orchestrator.llm_tool.generate_text({
                "prompt": prompt,
                "model": "gemini-2.0-flash-exp",
                "temperature": 0.3,
                "max_tokens": 600
            })
            
            if llm_result.get("success"):
                try:
                    content = llm_result.get("text", "")
                    # Extract JSON from markdown code blocks
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()
                    
                    research_data = json.loads(content)
                    return {"success": True, "output": research_data}
                except json.JSONDecodeError:
                    # Return raw text if JSON parsing fails
                    return {"success": True, "output": {
                        "analysis": llm_result.get("text"),
                        "note": "Research completed without web search data"
                    }}
            else:
                raise HTTPException(status_code=500, detail="LLM generation failed")
        
        # Process search results
        results = search_result.get("results", [])
        
        # Summarize findings
        prompt = f"""As a market research analyst, analyze these search results about: {user_input}

Search Results:
{json.dumps(results, indent=2)}

Provide:
1. Key market trends (3-5 points)
2. Target audience insights
3. Competitive landscape
4. Opportunities

Return as JSON with keys: trends (array), audience_insights (string), competitive_landscape (string), opportunities (array)"""

        llm_result = orchestrator.llm_tool.generate_text({
            "prompt": prompt,
            "model": "gemini-2.0-flash-exp",
            "temperature": 0.3,
            "max_tokens": 600
        })
        
        if llm_result.get("success"):
            try:
                content = llm_result.get("text", "")
                # Extract JSON from markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                research_data = json.loads(content)
                research_data["sources"] = results[:3]  # Add top 3 sources
                return {"success": True, "output": research_data}
            except json.JSONDecodeError as e:
                # Return formatted text if JSON parsing fails
                return {"success": True, "output": {
                    "analysis": llm_result.get("text"),
                    "sources": results[:3],
                    "note": "Research completed successfully"
                }}
        else:
            raise HTTPException(status_code=500, detail="LLM analysis failed")
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Research agent error: {str(e)}")


@app.post("/api/agents/media")
async def run_media_agent(request: dict):
    """Execute Media Planning Agent"""
    try:
        user_input = request.get("input", "")
        
        # Parse the input to extract campaign data
        # If input is a string (brief), wrap it in campaign data structure
        if isinstance(user_input, str):
            campaign_data = {
                "brief": user_input,
                "strategy": {},
                "duration": 14,  # Default 2 weeks
                "budget": "medium",
                "location": "India"
            }
        else:
            campaign_data = user_input
        
        # Call the MediaPlannerAgent to create comprehensive media plan
        media_plan = orchestrator.generate_media_plan(campaign_data)
        
        return {"success": True, "output": media_plan}
            
    except Exception as e:
        print(f"Error in media agent: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/agents/influencer")
async def run_influencer_agent(request: dict):
    """Execute Influencer Search Agent"""
    try:
        user_input = request.get("input", "")
        
        if not user_input:
            raise HTTPException(status_code=400, detail="Input is required")
        
        # Try to use web search for current influencer data
        search_query = f"top influencers {user_input} 2025 social media collaboration"
        search_result = orchestrator.search_tool.web_search({
            "q": search_query,
            "max_results": 5
        })
        
        if not search_result.get("success"):
            # Fallback without web search - simpler prompt for better JSON generation
            prompt = f"""As an influencer marketing expert, recommend 5 influencers for: {user_input}

For EACH influencer provide:
- name: Full name and handle (e.g., "Sarah Johnson @sarahjfit")
- platform: Main platform (Instagram, TikTok, YouTube, etc.)
- followers: Follower count
- niche: Category/niche
- engagement_rate: Percentage
- fit_reason: Why they're a good fit (1-2 sentences)
- content_style: Brief description

IMPORTANT: Return ONLY valid JSON, no extra text. Format:
{{"influencers": [{{"name": "...", "platform": "...", "followers": "...", "niche": "...", "engagement_rate": "...", "fit_reason": "...", "content_style": "..."}}]}}"""

            llm_result = orchestrator.llm_tool.generate_text({
                "prompt": prompt,
                "model": "gemini-2.0-flash-exp",
                "temperature": 0.3,
                "max_tokens": 1500
            })
            
            if llm_result.get("success"):
                content = llm_result.get("text", "")
                
                # Try multiple extraction methods
                extracted_json = None
                
                # Method 1: Extract from markdown code blocks
                if "```json" in content:
                    try:
                        extracted = content.split("```json")[1].split("```")[0].strip()
                        extracted_json = json.loads(extracted)
                    except:
                        pass
                
                # Method 2: Try without json marker
                if not extracted_json and "```" in content:
                    try:
                        extracted = content.split("```")[1].split("```")[0].strip()
                        extracted_json = json.loads(extracted)
                    except:
                        pass
                
                # Method 3: Regex pattern search
                if not extracted_json:
                    try:
                        json_match = re.search(r'\{[\s\S]*?"influencers"\s*:\s*\[[\s\S]*?\][\s\S]*?\}', content)
                        if json_match:
                            json_str = json_match.group(0)
                            # Try to fix incomplete JSON
                            if json_str.count('{') > json_str.count('}'):
                                json_str += '}'
                            if json_str.count('[') > json_str.count(']'):
                                json_str += ']'
                            extracted_json = json.loads(json_str)
                    except:
                        pass
                
                # Method 4: Try the whole content
                if not extracted_json:
                    try:
                        extracted_json = json.loads(content)
                    except:
                        pass
                
                if extracted_json and extracted_json.get("influencers"):
                    influencer_data = extracted_json
                    
                    # Ensure profile URLs are present
                    for inf in influencer_data.get("influencers", []):
                        if not inf.get("profile_url"):
                            # Extract handle from name field
                            name = inf.get("name", "")
                            # Look for @handle pattern
                            handle_match = re.search(r'@(\w+)', name)
                            if handle_match:
                                handle = handle_match.group(1)
                            else:
                                # Use first word of name
                                handle = name.split()[0].lower().replace("(", "").replace(")", "")
                            
                            platform = inf.get("platform", "").lower()
                            if "instagram" in platform:
                                inf["profile_url"] = f"https://instagram.com/{handle}"
                            elif "tiktok" in platform:
                                inf["profile_url"] = f"https://tiktok.com/@{handle}"
                            elif "youtube" in platform:
                                inf["profile_url"] = f"https://youtube.com/@{handle}"
                            elif "twitter" in platform or "x" in platform:
                                inf["profile_url"] = f"https://x.com/{handle}"
                            else:
                                inf["profile_url"] = f"https://instagram.com/{handle}"
                    
                    influencer_data["search_method"] = "AI-powered analysis"
                    influencer_data["type"] = "influencer_list"
                    return {"success": True, "output": influencer_data}
                else:
                    # Failed to extract valid JSON
                    return {"success": True, "output": {
                        "error": "Could not parse influencer data",
                        "note": "The AI response was incomplete. Please try a shorter, more specific query.",
                        "raw_preview": content[:300] + "..."
                    }}
            else:
                raise HTTPException(status_code=500, detail="Influencer analysis failed")
        
        # Process search results
        results = search_result.get("results", [])
        
        # Analyze search results - simpler prompt for better JSON
        prompt = f"""Analyze these search results and recommend 5 influencers for: {user_input}

Search Results:
{json.dumps(results[:3], indent=2)}

For EACH influencer:
- name: Name and handle
- platform: Main platform
- followers: Follower count
- niche: Category
- engagement_rate: Percentage
- fit_reason: Why good fit (1-2 sentences)
- content_style: Brief style description
- collaboration_potential: High/Medium/Low

Return ONLY valid JSON:
{{"influencers": [...]}}"""

        llm_result = orchestrator.llm_tool.generate_text({
            "prompt": prompt,
            "model": "gemini-2.0-flash-exp",
            "temperature": 0.3,
            "max_tokens": 1500
        })
        
        if llm_result.get("success"):
            content = llm_result.get("text", "")
            extracted_json = None
            
            # Try extraction methods
            if "```json" in content:
                try:
                    extracted = content.split("```json")[1].split("```")[0].strip()
                    extracted_json = json.loads(extracted)
                except:
                    pass
            
            if not extracted_json and "```" in content:
                try:
                    extracted = content.split("```")[1].split("```")[0].strip()
                    extracted_json = json.loads(extracted)
                except:
                    pass
            
            if not extracted_json:
                try:
                    json_match = re.search(r'\{[\s\S]*?"influencers"\s*:\s*\[[\s\S]*?\][\s\S]*?\}', content)
                    if json_match:
                        json_str = json_match.group(0)
                        if json_str.count('{') > json_str.count('}'):
                            json_str += '}'
                        if json_str.count('[') > json_str.count(']'):
                            json_str += ']'
                        extracted_json = json.loads(json_str)
                except:
                    pass
            
            if not extracted_json:
                try:
                    extracted_json = json.loads(content)
                except:
                    pass
            
            if extracted_json and extracted_json.get("influencers"):
                influencer_data = extracted_json
                
                # Ensure profile URLs
                for inf in influencer_data.get("influencers", []):
                    if not inf.get("profile_url"):
                        name = inf.get("name", "")
                        handle_match = re.search(r'@(\w+)', name)
                        if handle_match:
                            handle = handle_match.group(1)
                        else:
                            handle = name.split()[0].lower() if name else "unknown"
                        
                        platform = inf.get("platform", "").lower()
                        if "instagram" in platform:
                            inf["profile_url"] = f"https://instagram.com/{handle}"
                        elif "tiktok" in platform:
                            inf["profile_url"] = f"https://tiktok.com/@{handle}"
                        elif "youtube" in platform:
                            inf["profile_url"] = f"https://youtube.com/@{handle}"
                        elif "twitter" in platform or "x" in platform:
                            inf["profile_url"] = f"https://x.com/{handle}"
                        else:
                            inf["profile_url"] = f"https://instagram.com/{handle}"
                
                influencer_data["sources"] = results[:3]
                influencer_data["search_method"] = "Web search + AI analysis"
                influencer_data["type"] = "influencer_list"
                return {"success": True, "output": influencer_data}
            else:
                return {"success": True, "output": {
                    "error": "Could not parse influencer data",
                    "note": "The AI response was incomplete. Try a shorter query.",
                    "raw_preview": content[:300] + "..."
                }}
        else:
            raise HTTPException(status_code=500, detail="Influencer analysis failed")
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Influencer agent error: {str(e)}")


@app.post("/api/analyze-location-trends")
async def analyze_location_trends(request: LocationTrendsRequest):
    """Analyze marketing trends for a specific geographic location"""
    try:
        location = request.location
        coordinates = request.coordinates or {}
        search_context = request.search_context or "marketing trends"
        
        if not location:
            raise HTTPException(status_code=400, detail="Location is required")
        
        # Try web search for location-specific trends
        search_query = f"{location} {search_context} consumer demographics 2025"
        search_result = orchestrator.search_tool.web_search({
            "q": search_query,
            "max_results": 5
        })
        
        # Prepare search context
        search_context_str = ""
        if search_result.get("success"):
            results = search_result.get("results", [])
            search_context_str = f"\nWeb Search Results:\n{json.dumps(results[:3], indent=2)}\n"
        
        # Analyze with LLM
        prompt = f"""As a marketing and demographic analyst, provide insights for: {location}

{search_context_str}

Analyze and return ONLY valid JSON with these keys:
- demographics: {{"population": "...", "median_age": "...", "income_level": "...", "urban_rural": "..."}}
- trending_topics: [{{"name": "...", "volume": "..."}}] (top 5 trends)
- consumer_behavior: "Brief description of local consumer patterns"
- opportunities: ["Marketing opportunity 1", "Marketing opportunity 2", "Marketing opportunity 3"]

Format: {{"demographics": {{}}, "trending_topics": [], "consumer_behavior": "...", "opportunities": []}}"""

        llm_result = orchestrator.llm_tool.generate_text({
            "prompt": prompt,
            "model": "gemini-2.0-flash-exp",
            "temperature": 0.3,
            "max_tokens": 1000
        })
        
        if llm_result.get("success"):
            content = llm_result.get("text", "")
            
            # Extract JSON
            extracted_json = None
            if "```json" in content:
                try:
                    extracted = content.split("```json")[1].split("```")[0].strip()
                    extracted_json = json.loads(extracted)
                except:
                    pass
            
            if not extracted_json and "```" in content:
                try:
                    extracted = content.split("```")[1].split("```")[0].strip()
                    extracted_json = json.loads(extracted)
                except:
                    pass
            
            if not extracted_json:
                try:
                    json_match = re.search(r'\{[\s\S]*?"demographics"[\s\S]*?\}', content)
                    if json_match:
                        json_str = json_match.group(0)
                        extracted_json = json.loads(json_str)
                except:
                    pass
            
            if not extracted_json:
                try:
                    extracted_json = json.loads(content)
                except:
                    pass
            
            if extracted_json:
                return {
                    "success": True,
                    "location": location,
                    "coordinates": coordinates,
                    "trends": extracted_json
                }
            else:
                # Fallback response
                return {
                    "success": True,
                    "location": location,
                    "coordinates": coordinates,
                    "trends": {
                        "demographics": {
                            "population": "Data unavailable",
                            "median_age": "Data unavailable",
                            "income_level": "Data unavailable",
                            "urban_rural": "Mixed"
                        },
                        "trending_topics": [
                            {"name": "Local events", "volume": "Medium"},
                            {"name": "Community interests", "volume": "High"}
                        ],
                        "consumer_behavior": "Local consumer patterns vary. Consider conducting targeted research for specific insights.",
                        "opportunities": [
                            "Target local communities with personalized campaigns",
                            "Leverage regional cultural events",
                            "Partner with local influencers"
                        ]
                    }
                }
        else:
            raise HTTPException(status_code=500, detail="Analysis failed")
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Location analysis error: {str(e)}")


# ============================================
# Marketplace Endpoints
# ============================================

# Marketplace storage directories
MARKETPLACE_DIR = STORAGE_DIR / "marketplace"
MARKETPLACE_DIR.mkdir(exist_ok=True)
MARKETPLACE_WORKFLOWS_FILE = MARKETPLACE_DIR / "workflows.json"
MARKETPLACE_IMAGES_DIR = MARKETPLACE_DIR / "images"
MARKETPLACE_IMAGES_DIR.mkdir(exist_ok=True)

def load_marketplace_workflows():
    """Load marketplace workflows from JSON file"""
    if MARKETPLACE_WORKFLOWS_FILE.exists():
        with open(MARKETPLACE_WORKFLOWS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_marketplace_workflows(workflows):
    """Save marketplace workflows to JSON file"""
    with open(MARKETPLACE_WORKFLOWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(workflows, f, indent=2, ensure_ascii=False)

@app.get("/api/marketplace/workflows")
async def get_marketplace_workflows(
    category: str = None,
    price_type: str = None,
    search: str = None,
    sort_by: str = "newest"
):
    """Get all marketplace workflows with optional filters"""
    try:
        workflows = load_marketplace_workflows()
        
        # Filter by category
        if category and category != "all":
            workflows = [w for w in workflows if w.get("category") == category]
        
        # Filter by price type (free/paid)
        if price_type:
            if price_type == "free":
                workflows = [w for w in workflows if w.get("price", 0) == 0]
            elif price_type == "paid":
                workflows = [w for w in workflows if w.get("price", 0) > 0]
        
        # Search by title or description
        if search:
            search_lower = search.lower()
            workflows = [
                w for w in workflows 
                if search_lower in w.get("title", "").lower() or 
                   search_lower in w.get("description", "").lower() or
                   search_lower in w.get("author", "").lower()
            ]
        
        # Sort workflows
        if sort_by == "newest":
            workflows.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        elif sort_by == "popular":
            workflows.sort(key=lambda x: x.get("downloads", 0), reverse=True)
        elif sort_by == "rating":
            workflows.sort(key=lambda x: x.get("rating", 0), reverse=True)
        elif sort_by == "price_low":
            workflows.sort(key=lambda x: x.get("price", 0))
        elif sort_by == "price_high":
            workflows.sort(key=lambda x: x.get("price", 0), reverse=True)
        
        return {"success": True, "workflows": workflows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/marketplace/workflows/{workflow_id}")
async def get_workflow_detail(workflow_id: str):
    """Get detailed information about a specific workflow"""
    try:
        workflows = load_marketplace_workflows()
        workflow = next((w for w in workflows if w.get("id") == workflow_id), None)
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return {"success": True, "workflow": workflow}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/marketplace/workflows")
async def create_marketplace_workflow(workflow_data: dict):
    """Create a new marketplace workflow listing"""
    try:
        workflows = load_marketplace_workflows()
        
        # Generate unique ID
        workflow_id = str(uuid.uuid4())
        
        # Create workflow object
        new_workflow = {
            "id": workflow_id,
            "title": workflow_data.get("title"),
            "description": workflow_data.get("description"),
            "category": workflow_data.get("category", "marketing"),
            "price": workflow_data.get("price", 0),
            "author": workflow_data.get("author"),
            "author_email": workflow_data.get("author_email"),
            "thumbnail": workflow_data.get("thumbnail", ""),
            "images": workflow_data.get("images", []),
            "workflow_data": workflow_data.get("workflow_data", {}),
            "tags": workflow_data.get("tags", []),
            "downloads": 0,
            "rating": 0,
            "reviews": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        workflows.append(new_workflow)
        save_marketplace_workflows(workflows)
        
        return {"success": True, "workflow": new_workflow}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/marketplace/workflows/{workflow_id}")
async def update_marketplace_workflow(workflow_id: str, workflow_data: dict):
    """Update an existing marketplace workflow"""
    try:
        workflows = load_marketplace_workflows()
        workflow_index = next((i for i, w in enumerate(workflows) if w.get("id") == workflow_id), None)
        
        if workflow_index is None:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Update workflow
        workflow = workflows[workflow_index]
        workflow.update({
            "title": workflow_data.get("title", workflow.get("title")),
            "description": workflow_data.get("description", workflow.get("description")),
            "category": workflow_data.get("category", workflow.get("category")),
            "price": workflow_data.get("price", workflow.get("price")),
            "thumbnail": workflow_data.get("thumbnail", workflow.get("thumbnail")),
            "images": workflow_data.get("images", workflow.get("images")),
            "workflow_data": workflow_data.get("workflow_data", workflow.get("workflow_data")),
            "tags": workflow_data.get("tags", workflow.get("tags")),
            "updated_at": datetime.now().isoformat()
        })
        
        workflows[workflow_index] = workflow
        save_marketplace_workflows(workflows)
        
        return {"success": True, "workflow": workflow}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/marketplace/workflows/{workflow_id}")
async def delete_marketplace_workflow(workflow_id: str):
    """Delete a marketplace workflow"""
    try:
        workflows = load_marketplace_workflows()
        workflows = [w for w in workflows if w.get("id") != workflow_id]
        save_marketplace_workflows(workflows)
        
        return {"success": True, "message": "Workflow deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/marketplace/workflows/{workflow_id}/download")
async def download_workflow(workflow_id: str):
    """Download a workflow (increment download count)"""
    try:
        workflows = load_marketplace_workflows()
        workflow = next((w for w in workflows if w.get("id") == workflow_id), None)
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Increment download count
        workflow["downloads"] = workflow.get("downloads", 0) + 1
        
        # Save updated workflows
        workflow_index = next(i for i, w in enumerate(workflows) if w.get("id") == workflow_id)
        workflows[workflow_index] = workflow
        save_marketplace_workflows(workflows)
        
        return {
            "success": True, 
            "workflow_data": workflow.get("workflow_data", {}),
            "downloads": workflow["downloads"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/marketplace/workflows/{workflow_id}/review")
async def add_workflow_review(workflow_id: str, review_data: dict):
    """Add a review to a workflow"""
    try:
        workflows = load_marketplace_workflows()
        workflow = next((w for w in workflows if w.get("id") == workflow_id), None)
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Create review
        review = {
            "id": str(uuid.uuid4()),
            "user": review_data.get("user"),
            "rating": review_data.get("rating", 5),
            "comment": review_data.get("comment", ""),
            "created_at": datetime.now().isoformat()
        }
        
        # Add review
        if "reviews" not in workflow:
            workflow["reviews"] = []
        workflow["reviews"].append(review)
        
        # Update average rating
        all_ratings = [r.get("rating", 0) for r in workflow["reviews"]]
        workflow["rating"] = sum(all_ratings) / len(all_ratings) if all_ratings else 0
        
        # Save updated workflows
        workflow_index = next(i for i, w in enumerate(workflows) if w.get("id") == workflow_id)
        workflows[workflow_index] = workflow
        save_marketplace_workflows(workflows)
        
        return {"success": True, "review": review, "new_rating": workflow["rating"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/marketplace/upload-image")
async def upload_marketplace_image(file: UploadFile = File(...)):
    """Upload an image for a marketplace workflow"""
    try:
        # Generate unique filename
        file_ext = Path(file.filename).suffix
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = MARKETPLACE_IMAGES_DIR / filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return URL
        host = os.getenv("HOST", "localhost")
        port = os.getenv("PORT", "8000")
        url = f"http://{host}:{port}/marketplace/images/{filename}"
        
        return {"success": True, "url": url, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/marketplace/categories")
async def get_marketplace_categories():
    """Get all available workflow categories"""
    categories = [
        {"id": "marketing", "name": "Marketing Campaigns", "icon": "📢"},
        {"id": "social", "name": "Social Media", "icon": "📱"},
        {"id": "email", "name": "Email Marketing", "icon": "✉️"},
        {"id": "content", "name": "Content Creation", "icon": "✍️"},
        {"id": "analytics", "name": "Analytics & Reports", "icon": "📊"},
        {"id": "automation", "name": "Automation", "icon": "🤖"},
        {"id": "design", "name": "Design & Creative", "icon": "🎨"},
        {"id": "other", "name": "Other", "icon": "📦"}
    ]
    return {"success": True, "categories": categories}


@app.post("/api/agents/twitter")
async def post_to_twitter(request: dict):
    """Post to Twitter - Tweet with optional images (up to 4)"""
    try:
        from tools.twitter_tool import TwitterTool
        
        print(f"\n🐦 Twitter Agent - Raw request data: {request}")
        
        # Handle both direct format and nested input format
        input_data = request.get("input", request)
        
        # Handle case where input is a JSON string
        if isinstance(input_data, str):
            try:
                import json
                input_data = json.loads(input_data)
                print(f"📦 Parsed JSON input: {input_data}")
            except:
                # If it's just a plain string, treat it as tweet text
                input_data = {"text": input_data}
        
        print(f"📝 Processed input_data: {input_data}")
        
        text = input_data.get("text", input_data.get("caption", ""))
        images = input_data.get("images", [])
        strategy_data = input_data.get("strategy_data")
        
        print(f"🔍 Received - Text: {bool(text)}, Images: {len(images)}, Strategy: {bool(strategy_data)}")
        print(f"📦 Full input_data: {input_data}")
        
        # ALWAYS use Gemini AI to create dynamic tweet from strategy
        if strategy_data and isinstance(strategy_data, dict):
            print(f"🤖 GEMINI AI: Creating tweet from campaign strategy")
            print(f"📊 Strategy keys: {list(strategy_data.keys())}")
            
            core_concept = strategy_data.get('core_concept', '')
            tagline = strategy_data.get('tagline', '')
            target_audience = strategy_data.get('target_audience', '')
            key_messages = strategy_data.get('key_messages', [])
            tone = strategy_data.get('tone', '')
            
            # Build comprehensive context
            context_parts = []
            if core_concept:
                context_parts.append(f"Campaign: {core_concept}")
            if tagline:
                context_parts.append(f"Tagline: {tagline}")
            if target_audience:
                context_parts.append(f"Audience: {target_audience}")
            if key_messages:
                context_parts.append(f"Messages: {' | '.join(key_messages[:3])}")
            if tone:
                context_parts.append(f"Tone: {tone}")
            
            full_context = "\n".join(context_parts)
            print(f"📝 Full context:\n{full_context}\n")
            
            prompt = f"""Create a compelling Twitter post (MAX 280 chars) for this campaign:

{full_context}

Write a tweet that:
- Captures the campaign essence
- Speaks directly to the target audience
- Includes key value proposition
- Uses 2-3 strategic emojis
- Is engaging and actionable
- NO hashtags

Output ONLY the tweet text:"""
            
            print(f"🚀 Calling Gemini AI...")
            result = orchestrator.llm_tool.generate_text({
                "prompt": prompt,
                "model": "gemini-2.0-flash-exp",
                "temperature": 0.9,
                "max_tokens": 250
            })
            
            if result.get("success"):
                ai_text = result.get("text", "").strip()
                ai_text = ai_text.strip('"').strip("'").strip()
                if ai_text.lower().startswith("tweet:"):
                    ai_text = ai_text[6:].strip()
                
                if len(ai_text) > 280:
                    ai_text = ai_text[:277] + "..."
                
                print(f"✅ GEMINI TWEET ({len(ai_text)} chars): {ai_text}")
                text = ai_text
            else:
                print(f"⚠️ Gemini error: {result.get('error')}")
                # Smart fallback from strategy
                if tagline and target_audience:
                    text = f"{tagline} - {target_audience[:150]}"
                elif tagline:
                    text = tagline
                elif core_concept:
                    text = core_concept[:250]
                else:
                    text = "Check out our latest campaign!"
        
        # If no strategy but we have copywriting text, use it
        elif text:
            print(f"📝 Using provided text (no strategy data): {text[:80]}...")
        
        # Final check - if still no text, throw error
        if not text:
            print(f"❌ ERROR: No text generated!")
            print(f"   - Strategy data: {strategy_data}")
            print(f"   - Text field: {input_data.get('text')}")
            print(f"   - Caption field: {input_data.get('caption')}")
            raise HTTPException(
                status_code=400, 
                detail="No tweet content. Connect Strategy Agent → Visual Agent → Twitter Agent in workflow."
            )
        
        # Ensure 280 char limit
        if len(text) > 280:
            text = text[:277] + "..."
        
        print(f"📸 Images: {len(images)}")
        print(f"✍️ Final tweet ({len(text)} chars): {text}")
        
        # Initialize Twitter tool
        twitter_tool = TwitterTool()
        
        # Post tweet (Twitter max 4 images)
        print(f"🐦 Posting tweet with {min(len(images), 4)} image(s)...")
        result = twitter_tool.post_tweet(text, images[:4])
        
        if result.get("success"):
            print(f"✅ Twitter post successful!")
            return {
                "success": True,
                "output": {
                    "message": result.get("message"),
                    "tweet_id": result.get("tweet_id"),
                    "tweet_url": result.get("tweet_url"),
                    "type": "twitter_post",
                    "tweet_text": text  # Include the tweet text in response
                }
            }
        else:
            print(f"❌ Twitter post failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=result.get("error"))
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/twitter/thread")
async def post_twitter_thread(request: dict):
    """Post a thread to Twitter - Multiple connected tweets"""
    try:
        from tools.twitter_tool import TwitterTool
        
        print(f"\n🧵 Twitter Thread Agent - Raw request data: {request}")
        
        # Handle both direct format and nested input format
        input_data = request.get("input", request)
        
        # Handle case where input is a JSON string
        if isinstance(input_data, str):
            try:
                import json
                input_data = json.loads(input_data)
            except:
                input_data = {"tweets": [input_data]}
        
        tweets = input_data.get("tweets", [])
        
        if not tweets or len(tweets) == 0:
            raise HTTPException(status_code=400, detail="No tweets provided for thread")
        
        print(f"🧵 Posting thread with {len(tweets)} tweets...")
        
        # Initialize Twitter tool
        twitter_tool = TwitterTool()
        
        # Post thread
        result = twitter_tool.post_thread(tweets)
        
        if result.get("success"):
            print(f"✅ Twitter thread posted!")
            return {
                "success": True,
                "output": {
                    "message": result.get("message"),
                    "tweet_ids": result.get("tweet_ids"),
                    "thread_url": result.get("thread_url"),
                    "type": "twitter_thread"
                }
            }
        else:
            print(f"❌ Twitter thread failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=result.get("error"))
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/twitter/account")
async def get_twitter_account():
    """Get Twitter account information"""
    try:
        from tools.twitter_tool import TwitterTool
        
        twitter_tool = TwitterTool()
        result = twitter_tool.get_account_info()
        
        if result.get("success"):
            return {
                "success": True,
                "account": result.get("account")
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error"))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Mount assets directory (after agent endpoints to avoid route conflicts)
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")
app.mount("/marketplace/images", StaticFiles(directory=str(MARKETPLACE_IMAGES_DIR)), name="marketplace_images")
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

@app.get("/")
def read_root():
    return {"message": "Campaign Generator API", "status": "running"}

@app.post("/api/generate-campaign")
async def generate_campaign(request: BriefRequest):
    """Generate campaign from brief"""
    try:
        # Generate manifest
        result = orchestrator.generate_campaign_manifest(request.brief)
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        manifest = result["manifest"]
        
        # Execute asset generation
        manifest = orchestrator.execute_asset_generation(manifest)
        
        # Generate media plan
        media_plan_result = orchestrator.generate_media_plan(manifest)
        if media_plan_result.get("success"):
            print("✅ Media plan generated successfully")
        
        # Convert file paths to URLs
        manifest = convert_asset_paths_to_urls(manifest)
        
        # Save campaign
        campaign_id = manifest["campaign_id"]
        campaign_file = CAMPAIGNS_DIR / f"{campaign_id}.json"
        
        with open(campaign_file, "w") as f:
            json.dump(manifest, f, indent=2)
        
        return {"success": True, "campaign": manifest}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-media-plan/{campaign_id}")
async def generate_media_plan(campaign_id: str):
    """Generate or regenerate media plan for existing campaign"""
    try:
        campaign_file = CAMPAIGNS_DIR / f"{campaign_id}.json"
        
        if not campaign_file.exists():
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        with open(campaign_file, "r") as f:
            manifest = json.load(f)
        
        # Generate media plan
        result = orchestrator.generate_media_plan(manifest)
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        # Save updated campaign
        with open(campaign_file, "w") as f:
            json.dump(manifest, f, indent=2)
        
        return {
            "success": True, 
            "media_plan": result.get("media_plan"),
            "message": "Media plan generated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaign/{campaign_id}")
async def get_campaign(campaign_id: str):
    """Get campaign by ID"""
    campaign_file = CAMPAIGNS_DIR / f"{campaign_id}.json"
    
    if not campaign_file.exists():
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    with open(campaign_file, "r") as f:
        campaign = json.load(f)
    
    # Convert file paths to URLs
    campaign = convert_asset_paths_to_urls(campaign)
    
    return {"success": True, "campaign": campaign}

@app.post("/api/regenerate-asset")
async def regenerate_asset(request: RegenerateRequest):
    """Regenerate a specific asset"""
    try:
        # Find campaign containing this asset
        for campaign_file in CAMPAIGNS_DIR.glob("*.json"):
            with open(campaign_file, "r") as f:
                manifest = json.load(f)
            
            # Check if asset exists in this campaign
            asset_ids = [a["id"] for a in manifest.get("asset_plan", [])]
            if request.asset_id in asset_ids:
                # Regenerate
                result = orchestrator.regenerate_asset(
                    manifest, 
                    request.asset_id, 
                    request.modify_instructions
                )
                
                if not result.get("success"):
                    raise HTTPException(status_code=500, detail=result.get("error"))
                
                # Convert file paths to URLs
                result["manifest"] = convert_asset_paths_to_urls(result["manifest"])
                
                # Save updated manifest
                with open(campaign_file, "w") as f:
                    json.dump(result["manifest"], f, indent=2)
                
                return {"success": True, "campaign": result["manifest"]}
        
        raise HTTPException(status_code=404, detail="Asset not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/campaigns")
async def list_campaigns():
    """List all campaigns"""
    campaigns = []
    for campaign_file in CAMPAIGNS_DIR.glob("*.json"):
        with open(campaign_file, "r") as f:
            campaign = json.load(f)
            campaigns.append({
                "campaign_id": campaign["campaign_id"],
                "brief": campaign["brief"],
                "created_at": campaign["created_at"],
                "status": campaign["status"]
            })
    
    return {"success": True, "campaigns": campaigns}

@app.post("/api/export-campaign/{campaign_id}")
async def export_campaign(campaign_id: str):
    """Export campaign as ZIP"""
    import zipfile
    from io import BytesIO
    
    campaign_file = CAMPAIGNS_DIR / f"{campaign_id}.json"
    
    if not campaign_file.exists():
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    with open(campaign_file, "r") as f:
        campaign = json.load(f)
    
    # Create ZIP in memory
    zip_buffer = BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Add manifest
        zip_file.writestr("campaign_manifest.json", json.dumps(campaign, indent=2))
        
        # Add assets
        for asset in campaign.get("asset_plan", []):
            if asset.get("url"):
                asset_path = Path(asset["url"])
                if asset_path.exists():
                    zip_file.write(asset_path, f"assets/{asset_path.name}")
            
            if asset.get("content"):
                filename = f"assets/{asset['id']}.txt"
                zip_file.writestr(filename, asset["content"])
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=campaign_{campaign_id}.zip"}
    )

@app.post("/api/generate-campaign-report")
async def generate_campaign_report(workflow_data: dict):
    """Generate a comprehensive campaign report from workflow data"""
    try:
        from tools.report_generator import generate_campaign_summary, create_pdf_report
        
        # Extract nodes from workflow data
        nodes = workflow_data.get("nodes", [])
        workflow_name = workflow_data.get("workflowName", "Untitled Campaign")
        
        # Generate summary using LLM
        summary = await generate_campaign_summary(nodes, workflow_name)
        
        # Create PDF report
        pdf_path = create_pdf_report(summary, nodes, workflow_name)
        
        # Get the filename
        filename = pdf_path.name
        
        # Return both summary and PDF URL
        return {
            "success": True,
            "summary": summary,
            "pdfUrl": f"http://{os.getenv('HOST', 'localhost')}:{os.getenv('PORT', '8000')}/storage/reports/{filename}",
            "filename": filename
        }
        
    except Exception as e:
        print(f"Error generating campaign report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@app.get("/api/download-report/{filename}")
async def download_report(filename: str):
    """Download a generated campaign report PDF"""
    report_path = STORAGE_DIR / "reports" / filename
    
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Workflow Invitation System
@app.post("/api/invites/send")
async def send_invite(invite: dict):
    """Send a workflow collaboration invite to a user"""
    workflow_id = invite.get("workflow_id")
    from_user = invite.get("from_user")  # {user_id, username, email}
    to_email = invite.get("to_email")
    message = invite.get("message", "")
    
    if not workflow_id or not from_user or not to_email:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Create invite ID
    invite_id = str(uuid.uuid4())
    
    # Store invite
    invite_data = {
        "invite_id": invite_id,
        "workflow_id": workflow_id,
        "from_user": from_user,
        "to_email": to_email,
        "message": message,
        "status": "pending",  # pending, accepted, rejected
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    invite_file = INVITES_DIR / f"{invite_id}.json"
    with open(invite_file, "w") as f:
        json.dump(invite_data, f, indent=2)
    
    return {
        "success": True,
        "invite_id": invite_id,
        "message": f"Invite sent to {to_email}"
    }

@app.get("/api/invites/pending/{email}")
async def get_pending_invites(email: str):
    """Get all pending invites for a user email"""
    pending_invites = []
    
    for invite_file in INVITES_DIR.glob("*.json"):
        with open(invite_file, "r") as f:
            invite = json.load(f)
            
        # Check if invite is for this email and still pending
        if (invite.get("to_email") == email and 
            invite.get("status") == "pending"):
            
            # Check if not expired
            expires_at = datetime.fromisoformat(invite.get("expires_at"))
            if expires_at > datetime.now():
                pending_invites.append(invite)
    
    return {"invites": pending_invites}

@app.post("/api/invites/{invite_id}/accept")
async def accept_invite(invite_id: str, user_info: dict):
    """Accept a workflow invitation"""
    invite_file = INVITES_DIR / f"{invite_id}.json"
    
    if not invite_file.exists():
        raise HTTPException(status_code=404, detail="Invite not found")
    
    with open(invite_file, "r") as f:
        invite = json.load(f)
    
    if invite.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Invite already processed")
    
    # Update invite status
    invite["status"] = "accepted"
    invite["accepted_by"] = user_info
    invite["accepted_at"] = datetime.now().isoformat()
    
    with open(invite_file, "w") as f:
        json.dump(invite, f, indent=2)
    
    return {
        "success": True,
        "workflow_id": invite.get("workflow_id"),
        "message": "Invite accepted"
    }

@app.post("/api/invites/{invite_id}/reject")
async def reject_invite(invite_id: str):
    """Reject a workflow invitation"""
    invite_file = INVITES_DIR / f"{invite_id}.json"
    
    if not invite_file.exists():
        raise HTTPException(status_code=404, detail="Invite not found")
    
    with open(invite_file, "r") as f:
        invite = json.load(f)
    
    if invite.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Invite already processed")
    
    # Update invite status
    invite["status"] = "rejected"
    invite["rejected_at"] = datetime.now().isoformat()
    
    with open(invite_file, "w") as f:
        json.dump(invite, f, indent=2)
    
    return {"success": True, "message": "Invite rejected"}

# WebSocket endpoint for collaborative workflow editing
@app.websocket("/ws/collaborate/{workflow_id}")
async def websocket_collaborate(websocket: WebSocket, workflow_id: str):
    """
    WebSocket endpoint for real-time collaboration on workflows
    Supports:
    - Cursor position sharing
    - Workflow updates (nodes/edges)
    - Chat messages
    - User presence
    """
    try:
        # Accept connection with user info from query params
        user_id = websocket.query_params.get("user_id", str(uuid.uuid4()))
        username = websocket.query_params.get("username", "Anonymous")
        color = websocket.query_params.get("color", f"#{secrets.token_hex(3)}")
        
        user_info = {
            "user_id": user_id,
            "username": username,
            "color": color
        }
        
        connection = await collaboration_manager.connect(websocket, workflow_id, user_info)
    except Exception as e:
        print(f"❌ WebSocket connection error: {str(e)}")
        await websocket.close(code=1008, reason=str(e))
        return
    
    try:
        # Send current active users to the new connection
        active_users = collaboration_manager.get_active_users(workflow_id)
        await websocket.send_json({
            "type": "active_users",
            "users": active_users
        })
        
        # Listen for messages
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "cursor_move":
                # Broadcast cursor position to other users
                await collaboration_manager.broadcast(workflow_id, {
                    "type": "cursor_move",
                    "user_id": connection["user_id"],
                    "username": connection["username"],
                    "color": connection["color"],
                    "x": data.get("x"),
                    "y": data.get("y")
                }, exclude_websocket=websocket)
            
            elif message_type == "workflow_update":
                # Broadcast workflow changes (nodes/edges)
                print(f"🔄 User {connection['user_id']} sending workflow update: {data.get('action')}")
                print(f"   Nodes: {len(data.get('nodes', []))}, Edges: {len(data.get('edges', []))}")
                
                await collaboration_manager.broadcast(workflow_id, {
                    "type": "workflow_update",
                    "user_id": connection["user_id"],
                    "username": connection["username"],
                    "nodes": data.get("nodes"),
                    "edges": data.get("edges"),
                    "action": data.get("action")  # "add_node", "remove_node", "update_node", "add_edge", "remove_edge"
                }, exclude_websocket=websocket)
            
            elif message_type == "chat_message":
                # Broadcast chat message to all users
                await collaboration_manager.broadcast(workflow_id, {
                    "type": "chat_message",
                    "user_id": connection["user_id"],
                    "username": connection["username"],
                    "color": connection["color"],
                    "message": data.get("message"),
                    "timestamp": datetime.now().isoformat()
                }, exclude_websocket=None)  # Include sender for confirmation
            
            elif message_type == "ping":
                # Keep-alive ping
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        # User disconnected
        disconnected_user = collaboration_manager.disconnect(websocket, workflow_id)
        if disconnected_user:
            await collaboration_manager.broadcast(workflow_id, {
                "type": "user_left",
                "user_id": disconnected_user["user_id"],
                "username": disconnected_user["username"]
            })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
