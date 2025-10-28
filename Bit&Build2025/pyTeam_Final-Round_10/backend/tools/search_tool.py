import os
from typing import Dict, Any, List
from tavily import TavilyClient

class SearchTool:
    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            print("WARNING: TAVILY_API_KEY not found in environment variables")
            self.client = None
        else:
            try:
                self.client = TavilyClient(api_key=api_key)
            except Exception as e:
                print(f"WARNING: Failed to initialize Tavily client: {str(e)}")
                self.client = None
        
    def web_search(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform web search using Tavily
        Expected input: {
            "q": str (query),
            "location": str (optional),
            "max_results": int (default 5)
        }
        """
        if not self.client:
            return {
                "success": False,
                "error": "Tavily API client not initialized",
                "results": []
            }
            
        try:
            query = tool_input.get("q", "")
            max_results = tool_input.get("max_results", 5)
            
            if not query:
                return {
                    "success": False,
                    "error": "No query provided",
                    "results": []
                }
            
            response = self.client.search(
                query=query,
                max_results=max_results,
                search_depth="basic"
            )
            
            results = []
            for item in response.get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "content": item.get("content", ""),
                    "score": item.get("score", 0)
                })
            
            return {
                "success": True,
                "results": results,
                "query": query
            }
            
        except Exception as e:
            print(f"Search error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "results": []
            }
