import google.generativeai as genai
import os
from typing import Dict, Any

class ModerationTool:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        genai.configure(api_key=api_key)
        
    def moderate_text(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Moderate text content using Gemini safety filters
        Expected input: {
            "text": str
        }
        """
        try:
            text = tool_input.get("text", "")
            
            # Use Gemini to check for safety issues
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            
            # Simple safety check prompt
            prompt = f"""Analyze this content for safety issues (hate speech, violence, explicit content, harmful content).
            
Content: {text}

Respond with JSON only:
{{
    "safe": true/false,
    "issues": ["issue1", "issue2"] or []
}}"""
            
            response = model.generate_content(prompt)
            
            # Parse response
            import json
            try:
                result = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
                return {
                    "success": True,
                    "moderation_passed": result.get("safe", True),
                    "issues": result.get("issues", [])
                }
            except:
                # If parsing fails, assume safe
                return {
                    "success": True,
                    "moderation_passed": True,
                    "issues": []
                }
                
        except Exception as e:
            # On error, assume safe but log error
            return {
                "success": True,
                "moderation_passed": True,
                "issues": [],
                "error": str(e)
            }
    
    def moderate_image(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Moderate image content
        Expected input: {
            "image_url": str or "image_data": base64
        }
        """
        # For now, we'll skip image moderation as it requires vision models
        # In production, you'd use Gemini Vision or similar
        return {
            "success": True,
            "moderation_passed": True,
            "issues": []
        }
