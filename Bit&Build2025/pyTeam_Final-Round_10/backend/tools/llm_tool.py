import google.generativeai as genai
import os
from typing import Dict, Any
import json

class LLMTool:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        genai.configure(api_key=api_key)
        
    def generate_text(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate text using Gemini API
        Expected input: {
            "prompt": str,
            "model": str (default: "gemini-2.0-flash-exp"),
            "temperature": float,
            "max_tokens": int
        }
        """
        try:
            model_name = tool_input.get("model", "gemini-2.0-flash-exp")
            prompt = tool_input.get("prompt", "")
            temperature = tool_input.get("temperature", 0.7)
            max_tokens = tool_input.get("max_tokens", 1024)
            
            generation_config = {
                "temperature": temperature,
                "max_output_tokens": max_tokens,
            }
            
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=generation_config
            )
            
            response = model.generate_content(prompt)
            
            return {
                "success": True,
                "text": response.text,
                "model": model_name,
                "usage": {
                    "prompt_tokens": response.usage_metadata.prompt_token_count if hasattr(response, 'usage_metadata') else 0,
                    "completion_tokens": response.usage_metadata.candidates_token_count if hasattr(response, 'usage_metadata') else 0,
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def compute_embedding(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compute embeddings using Gemini
        Expected input: {
            "text": str
        }
        """
        try:
            text = tool_input.get("text", "")
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text
            )
            
            return {
                "success": True,
                "embedding": result['embedding'],
                "dimensions": len(result['embedding'])
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
