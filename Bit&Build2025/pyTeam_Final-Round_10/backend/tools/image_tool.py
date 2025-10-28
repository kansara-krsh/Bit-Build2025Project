import requests
import os
from typing import Dict, Any
import time
import base64
from pathlib import Path

class ImageTool:
    def __init__(self):
        self.api_token = os.getenv("HUGGINGFACE_API_TOKEN")
        if not self.api_token:
            raise ValueError("HUGGINGFACE_API_TOKEN not found in environment variables")
        
        # Using Stable Diffusion XL on Hugging Face
        self.api_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        self.headers = {"Authorization": f"Bearer {self.api_token}"}
        
    def generate_image(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate image using Hugging Face Inference API
        Expected input: {
            "prompt": str,
            "size": str (e.g., "1024x1024"),
            "seed": int|None,
            "n": int (number of variants, default 1)
        }
        """
        try:
            prompt = tool_input.get("prompt", "")
            seed = tool_input.get("seed")
            n = tool_input.get("n", 1)
            
            # Hugging Face API payload
            payload = {
                "inputs": prompt,
                "parameters": {
                    "num_inference_steps": 30,
                }
            }
            
            if seed is not None:
                payload["parameters"]["seed"] = seed
            
            # Make request
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 503:
                # Model is loading, wait and retry
                time.sleep(20)
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=60
                )
            
            if response.status_code == 200:
                # Save image
                image_data = response.content
                
                return {
                    "success": True,
                    "image_data": base64.b64encode(image_data).decode('utf-8'),
                    "format": "png",
                    "provider": "huggingface",
                    "model": "stable-diffusion-xl-base-1.0"
                }
            else:
                return {
                    "success": False,
                    "error": f"API returned status {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def save_image(self, image_data: str, asset_id: str, assets_dir: str) -> str:
        """Save base64 image data to file"""
        try:
            Path(assets_dir).mkdir(parents=True, exist_ok=True)
            
            image_bytes = base64.b64decode(image_data)
            file_path = os.path.join(assets_dir, f"{asset_id}.png")
            
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            
            return file_path
        except Exception as e:
            raise Exception(f"Failed to save image: {str(e)}")
