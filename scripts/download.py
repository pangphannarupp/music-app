#!/usr/bin/env python3
"""
YouTube Audio Downloader using yt-dlp
Downloads YouTube videos as MP3 files with metadata
"""

import sys
import json
import os
from pathlib import Path

def check_dependencies():
    """Check if yt-dlp is installed and up to date"""
    try:
        import yt_dlp
        # Optional: verify version or force update periodically
        return True
    except ImportError:
        print(json.dumps({
            "status": "installing",
            "message": "Installing yt-dlp..."
        }), flush=True)
        
        try:
            import subprocess
            import sys
            
            # Install/Upgrade with --user flag
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", 
                "--user", "--upgrade", "--quiet", "yt-dlp"
            ])
            
            # Force reload of sys.path
            import site
            import importlib
            importlib.reload(site)
            
            import yt_dlp
            return True
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": f"Failed to install yt-dlp: {str(e)}"
            }), flush=True)
            return False

def download_audio(video_id, output_path, artist="Unknown Artist", title="Unknown Title"):
    """Download YouTube video as MP3"""
    if not check_dependencies():
        return False
    
    import yt_dlp
    import warnings
    
    # Suppress deprecation warnings
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    
    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Remove .mp3 extension if present
    if output_path.endswith('.mp3'):
        output_path = output_path[:-4]
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            try:
                if 'downloaded_bytes' in d and 'total_bytes' in d and d['total_bytes']:
                    percent = int((d['downloaded_bytes'] / d['total_bytes']) * 100)
                    percent_str = f"{percent}%"
                elif '_percent_str' in d:
                    import re
                    percent_str = re.sub(r'\x1b\[[0-9;]*m', '', d['_percent_str']).strip()
                else:
                    percent_str = "..."
                
                print(json.dumps({
                    "status": "progress",
                    "progress": percent_str,
                    "message": f"Downloading {title}... {percent_str}"
                }), flush=True)
            except Exception:
                pass
        elif d['status'] == 'finished':
            print(json.dumps({
                "status": "converting",
                "progress": "100%",
                "message": "Converting to MP3..."
            }), flush=True)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        # FFmpeg explicitly disabled
        'postprocessors': [], 
        'outtmpl': output_path, 
        'quiet': False,
        'no_warnings': True,
        'progress_hooks': [progress_hook],
        # workaround for 403 forbidden: Use Android client
        'extractor_args': {
            'youtube': {
                'player_client': ['android']
            }
        },
    }
    
    try:
        url = f'https://www.youtube.com/watch?v={video_id}'
        
        print(json.dumps({
            "status": "downloading",
            "message": f"Downloading {title}..."
        }), flush=True)
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        print(json.dumps({
            "status": "success",
            "message": "Download complete",
            "file": output_path
        }), flush=True)
        
        return True
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Download failed: {str(e)}"
        }), flush=True)
        return False

def get_stream_url(video_id):
    """Get direct audio stream URL"""
    if not check_dependencies():
        return False
        
    import yt_dlp
    import warnings
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['android']
            }
        },
    }
    
    try:
        url = f'https://www.youtube.com/watch?v={video_id}'
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            stream_url = info.get('url')
            
            # If no top-level URL, look for best audio in formats
            if not stream_url and 'formats' in info:
                formats = info['formats']
                # Filter for audio only
                audio_formats = [f for f in formats if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
                if not audio_formats:
                     # Fallback to any format with audio
                     audio_formats = [f for f in formats if f.get('acodec') != 'none']
                
                if audio_formats:
                    # Sort by bitrate (abr) descending
                    audio_formats.sort(key=lambda x: x.get('abr', 0) or 0, reverse=True)
                    stream_url = audio_formats[0].get('url')

            if stream_url:
                print(json.dumps({
                    "status": "success",
                    "url": stream_url
                }), flush=True)
                return True
            else:
                print(json.dumps({
                    "status": "error",
                    "message": "No URL found in info"
                }), flush=True)
                return False
                
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Failed to get URL: {str(e)}"
        }), flush=True)
        return False

def search_videos(query, limit=10):
    """Search for videos using yt-dlp"""
    if not check_dependencies():
        return False
        
    import yt_dlp
    import warnings
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True, # Fast search, no details
        'extractor_args': {
            'youtube': {
                'player_client': ['android']
            }
        },
    }
    
    try:
        # Piped/Invidious are failing, so we use yt-dlp as a robust backup
        search_query = f"ytsearch{limit}:{query}"
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_query, download=False)
            
            results = []
            if 'entries' in info:
                for entry in info['entries']:
                    # Build simple song object
                    video_id = entry.get('id')
                    title = entry.get('title')
                    uploader = entry.get('uploader') or "Unknown Artist"
                    
                    if video_id and title:
                        results.append({
                            "id": video_id,
                            "title": title,
                            "artist": uploader,
                            # Construct standard thumbnail (flat search doesn't always have it)
                            "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
                        })
            
            print(json.dumps({
                "status": "success",
                "results": results
            }), flush=True)
            return True
                
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Search failed: {str(e)}"
        }), flush=True)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "message": "Usage: download.py <command> [args...]"
        }), flush=True)
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "get_url":
        if len(sys.argv) < 3:
             print(json.dumps({
                "status": "error",
                "message": "Usage: download.py get_url <video_id>"
            }), flush=True)
             sys.exit(1)
        video_id = sys.argv[2]
        success = get_stream_url(video_id)
        sys.exit(0 if success else 1)

    elif command == "search":
        if len(sys.argv) < 3:
             print(json.dumps({
                "status": "error",
                "message": "Usage: download.py search <query> [limit]"
            }), flush=True)
             sys.exit(1)
        query = sys.argv[2]
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        success = search_videos(query, limit)
        sys.exit(0 if success else 1)
        
    elif command == "download":
        if len(sys.argv) < 4:
            print(json.dumps({
                "status": "error",
                "message": "Usage: download.py download <video_id> <output_path> [artist] [title]"
            }), flush=True)
            sys.exit(1)
            
        video_id = sys.argv[2]
        output_path = sys.argv[3]
        artist = sys.argv[4] if len(sys.argv) > 4 else "Unknown Artist"
        title = sys.argv[5] if len(sys.argv) > 5 else "Unknown Title"
        
        success = download_audio(video_id, output_path, artist, title)
        sys.exit(0 if success else 1)
        
    else:
        # Backward compatibility for old calls: <video_id> <output_path> ...
        if len(sys.argv) >= 3:
            video_id = sys.argv[1]
            output_path = sys.argv[2]
            artist = sys.argv[3] if len(sys.argv) > 3 else "Unknown Artist"
            title = sys.argv[4] if len(sys.argv) > 4 else "Unknown Title"
            success = download_audio(video_id, output_path, artist, title)
            sys.exit(0 if success else 1)
        else:
            print(json.dumps({
                "status": "error",
                "message": "Invalid arguments"
            }), flush=True)
            sys.exit(1)
