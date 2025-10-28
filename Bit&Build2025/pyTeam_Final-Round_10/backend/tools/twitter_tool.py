import tweepy
import requests
import os
from pathlib import Path
import tempfile
import time

class TwitterTool:
    def __init__(self):
        # Get credentials from environment
        self.api_key = os.getenv("TWITTER_API_KEY")
        self.api_secret = os.getenv("TWITTER_API_SECRET")
        self.access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        self.access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        
        # Initialize Tweepy with OAuth 1.0a
        try:
            auth = tweepy.OAuth1UserHandler(
                self.api_key,
                self.api_secret,
                self.access_token,
                self.access_token_secret
            )
            self.api = tweepy.API(auth)
            
            # For v2 endpoints
            self.client = tweepy.Client(
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_token_secret
            )
        except Exception as e:
            print(f"⚠️ Twitter API initialization warning: {str(e)}")
            self.api = None
            self.client = None
    
    def post_tweet(self, text, image_paths=None):
        """Post a tweet with optional images (up to 4)"""
        try:
            if not self.api or not self.client:
                return {
                    "success": False,
                    "error": "Twitter API not initialized. Check credentials in .env file."
                }
            
            print(f"🐦 Posting tweet...")
            print(f"📝 Text: {text[:100]}{'...' if len(text) > 100 else ''}")
            
            # Truncate text to 280 characters
            if len(text) > 280:
                text = text[:277] + "..."
                print(f"✂️ Truncated to 280 chars")
            
            media_ids = []
            
            # Upload images if provided (max 4 for Twitter)
            if image_paths and len(image_paths) > 0:
                print(f"📸 Uploading {min(len(image_paths), 4)} image(s)...")
                
                for i, image_path in enumerate(image_paths[:4]):  # Twitter max 4 images
                    try:
                        # Extract URL if image_path is a dict (from Visual Agent)
                        if isinstance(image_path, dict):
                            # Image object has structure: {'url': '...', 'selected': True, ...}
                            image_url = image_path.get('url') or image_path.get('thumbnail')
                            print(f"   🔍 Extracted URL from image object: {image_url}")
                            image_path = image_url
                        
                        if not image_path:
                            print(f"   ⚠️ Skipping empty image path")
                            continue
                        
                        # Download image if it's a URL
                        local_path = self._download_image(image_path)
                        
                        # Upload to Twitter
                        print(f"   Uploading image {i+1}/{min(len(image_paths), 4)}...")
                        media = self.api.media_upload(local_path)
                        media_ids.append(media.media_id)
                        print(f"   ✅ Image {i+1} uploaded: {media.media_id}")
                        
                        # Clean up temp file if it was downloaded
                        if local_path != image_path and os.path.exists(local_path):
                            os.remove(local_path)
                    
                    except Exception as e:
                        print(f"   ⚠️ Failed to upload image {i+1}: {str(e)}")
                        continue
            
            # Post tweet
            print(f"📤 Posting to Twitter...")
            
            if media_ids:
                print(f"   With {len(media_ids)} image(s)")
                tweet = self.client.create_tweet(
                    text=text,
                    media_ids=media_ids
                )
            else:
                print(f"   Text only (no images)")
                tweet = self.client.create_tweet(text=text)
            
            tweet_id = tweet.data['id']
            
            # Get tweet URL - need to fetch username
            try:
                user = self.client.get_me()
                username = user.data.username
                tweet_url = f"https://twitter.com/{username}/status/{tweet_id}"
            except:
                # Fallback URL
                tweet_url = f"https://twitter.com/i/web/status/{tweet_id}"
            
            print(f"🎉 Posted to Twitter!")
            print(f"   Tweet ID: {tweet_id}")
            print(f"   URL: {tweet_url}")
            
            return {
                "success": True,
                "tweet_id": tweet_id,
                "tweet_url": tweet_url,
                "message": "Successfully posted to Twitter!"
            }
        
        except Exception as e:
            print(f"❌ Twitter post failed: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to post tweet: {str(e)}"
            }
    
    def post_thread(self, tweets_list):
        """Post a thread of multiple tweets"""
        try:
            if not self.client:
                return {
                    "success": False,
                    "error": "Twitter API not initialized"
                }
            
            print(f"🧵 Posting thread with {len(tweets_list)} tweets...")
            
            tweet_ids = []
            previous_tweet_id = None
            
            for i, tweet_text in enumerate(tweets_list):
                # Truncate each tweet to 280 characters
                if len(tweet_text) > 280:
                    tweet_text = tweet_text[:277] + "..."
                
                print(f"   Posting tweet {i+1}/{len(tweets_list)}...")
                
                if previous_tweet_id:
                    # Reply to previous tweet
                    tweet = self.client.create_tweet(
                        text=tweet_text,
                        in_reply_to_tweet_id=previous_tweet_id
                    )
                else:
                    # First tweet in thread
                    tweet = self.client.create_tweet(text=tweet_text)
                
                tweet_id = tweet.data['id']
                tweet_ids.append(tweet_id)
                previous_tweet_id = tweet_id
                
                print(f"   ✅ Tweet {i+1} posted: {tweet_id}")
                
                # Wait a bit between tweets
                if i < len(tweets_list) - 1:
                    time.sleep(1)
            
            # Get first tweet URL
            try:
                user = self.client.get_me()
                username = user.data.username
                thread_url = f"https://twitter.com/{username}/status/{tweet_ids[0]}"
            except:
                thread_url = f"https://twitter.com/i/web/status/{tweet_ids[0]}"
            
            print(f"🎉 Thread posted!")
            print(f"   Thread URL: {thread_url}")
            
            return {
                "success": True,
                "tweet_ids": tweet_ids,
                "thread_url": thread_url,
                "message": f"Successfully posted thread with {len(tweet_ids)} tweets!"
            }
        
        except Exception as e:
            print(f"❌ Thread posting failed: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to post thread: {str(e)}"
            }
    
    def get_account_info(self):
        """Get Twitter account information"""
        try:
            if not self.client:
                return {
                    "success": False,
                    "error": "Twitter API not initialized"
                }
            
            # Get authenticated user info
            user = self.client.get_me(
                user_fields=['public_metrics', 'description', 'profile_image_url']
            )
            
            if user.data:
                account_data = {
                    "id": user.data.id,
                    "username": user.data.username,
                    "name": user.data.name,
                    "description": user.data.description if hasattr(user.data, 'description') else "",
                    "followers_count": user.data.public_metrics['followers_count'] if hasattr(user.data, 'public_metrics') else 0,
                    "following_count": user.data.public_metrics['following_count'] if hasattr(user.data, 'public_metrics') else 0,
                    "tweet_count": user.data.public_metrics['tweet_count'] if hasattr(user.data, 'public_metrics') else 0,
                    "profile_image_url": user.data.profile_image_url if hasattr(user.data, 'profile_image_url') else ""
                }
                
                return {
                    "success": True,
                    "account": account_data
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to get account info"
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get account info: {str(e)}"
            }
    
    def _download_image(self, image_path):
        """Get local path for image (no downloading needed!)"""
        # Handle None or empty string
        if not image_path:
            raise Exception("Image path is empty or None")
        
        # Convert to string if needed
        image_path = str(image_path)
        
        # If it's already a local file path, return it
        if os.path.exists(image_path):
            print(f"   ✅ Using local file: {image_path}")
            return image_path
        
        # Extract filename from localhost URL (e.g., "http://localhost:8000/assets/img.png")
        # Images are ALREADY in storage/assets folder - no need to download!
        if 'localhost' in image_path or '127.0.0.1' in image_path:
            if 'assets/' in image_path:
                filename = image_path.split('assets/')[-1]
                local_path = os.path.join('./storage/assets', filename)
                
                if os.path.exists(local_path):
                    print(f"   ✅ Using local file: {local_path}")
                    return local_path
                else:
                    # Try absolute path
                    abs_local_path = os.path.join(os.getcwd(), 'storage', 'assets', filename)
                    if os.path.exists(abs_local_path):
                        print(f"   ✅ Using local file: {abs_local_path}")
                        return abs_local_path
        
        # For external URLs, download them
        if image_path.startswith('http://') or image_path.startswith('https://'):
            try:
                print(f"   📥 Downloading external image: {image_path}")
                response = requests.get(image_path, timeout=30)
                response.raise_for_status()
                
                # Save to temp file
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
                temp_file.write(response.content)
                temp_file.close()
                
                print(f"   ✅ Downloaded to: {temp_file.name}")
                return temp_file.name
            
            except Exception as e:
                print(f"   ❌ Download failed: {str(e)}")
                raise Exception(f"Failed to download image: {str(e)}")
        
        raise Exception(f"Image not found: {image_path}")

