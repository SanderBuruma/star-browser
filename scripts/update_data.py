import requests
import asyncio
import aiohttp
from bs4 import BeautifulSoup
import json
import re
from pathlib import Path
import sys
from datetime import datetime
import time
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
import threading

# Semaphore for rate limiting
RATE_LIMIT = 10  # Maximum concurrent requests
semaphore = asyncio.Semaphore(RATE_LIMIT)
save_lock = threading.Lock()
last_save_time = 0
SAVE_INTERVAL = 60  # Save every 60 seconds

async def fetch_star_details_async(session: aiohttp.ClientSession, star_name: str, stars_data: dict, index: int) -> tuple[int, Optional[dict]]:
    """Fetch details for a single star asynchronously"""
    base_url = "https://factorio.com/galaxy"
    
    try:
        async with semaphore:  # Rate limit our requests
            async with session.get(f"{base_url}/{star_name}") as response:
                if response.status != 200:
                    print(f"Error {response.status} fetching {star_name}")
                    return index, None
                
                html = await response.text()
                
        soup = BeautifulSoup(html, 'html.parser')
        
        details = {
            'seed': None,
            'time_played': None,
            'comment': None,
            'factorio_version': None,
            'mods': [],
            'player_count': None,
            'uploaded': None
        }
        
        # Extract data from the page
        for dt in soup.find_all('dt'):
            if 'Seed' in dt.text:
                details['seed'] = dt.find_next('dd').text.strip()
            elif 'Time played' in dt.text:
                details['time_played'] = dt.find_next('dd').text.strip()
            elif 'Factorio version' in dt.text:
                details['factorio_version'] = dt.find_next('dd').text.strip()
            elif 'Player count' in dt.text:
                details['player_count'] = dt.find_next('dd').text.strip()
            elif 'Uploaded' in dt.text:
                details['uploaded'] = dt.find_next('dd').text.strip()
        
        comment_elem = soup.find('div', class_='comment')
        if comment_elem:
            details['comment'] = comment_elem.text.strip()
        
        mods_list = soup.find('ul', class_='mods')
        if mods_list:
            details['mods'] = [li.text.strip() for li in mods_list.find_all('li')]
        
        return index, details
        
    except Exception as e:
        print(f"Error fetching details for {star_name}: {e}")
        return index, None

def save_current_progress(data: dict, completed: int, total: int):
    """Save current progress to data.json"""
    global last_save_time
    
    current_time = time.time()
    if current_time - last_save_time < SAVE_INTERVAL:
        return
    
    with save_lock:
        try:
            script_dir = Path(__file__).parent
            data_file_path = script_dir.parent / 'src' / 'app' / 'data.json'
            
            with open(data_file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            
            last_save_time = current_time
            print(f"\nProgress saved: {completed}/{total} stars processed")
            
        except Exception as e:
            print(f"Error saving progress: {e}")

async def fetch_all_star_details(stars_data: dict) -> List[Optional[dict]]:
    """Fetch details for all stars in parallel"""
    details = [None] * len(stars_data['names'])
    completed = 0
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i, name in enumerate(stars_data['names']):
            if name:  # Only fetch details for named stars
                task = fetch_star_details_async(session, name, stars_data, i)
                tasks.append(task)
        
        # Process stars in chunks to avoid overwhelming the server
        chunk_size = 50
        for i in range(0, len(tasks), chunk_size):
            chunk = tasks[i:i + chunk_size]
            results = await asyncio.gather(*chunk)
            
            for index, result in results:
                if result:
                    details[index] = result
                    completed += 1
                    
                    # Save progress periodically
                    if completed % 10 == 0:  # Every 10 stars
                        current_data = {
                            "stars": {
                                "names": stars_data.get("names", []),
                                "colors": stars_data.get("colors", []),
                                "creation_update": stars_data.get("creation_update", []),
                                "users": stars_data.get("users", []),
                                "details": details
                            }
                        }
                        save_current_progress(current_data, completed, len(tasks))
            
            # Small delay between chunks
            await asyncio.sleep(1)
    
    return details

def update_data_file(stars_data: dict):
    """Update the data file with star details"""
    # Run the async fetch operation
    details = asyncio.run(fetch_all_star_details(stars_data))
    
    # Create the final data structure
    data = {
        "stars": {
            "names": stars_data.get("names", []),
            "colors": stars_data.get("colors", []),
            "creation_update": stars_data.get("creation_update", []),
            "users": stars_data.get("users", []),
            "details": details
        }
    }
    
    # Final save
    script_dir = Path(__file__).parent
    data_file_path = script_dir.parent / 'src' / 'app' / 'data.json'
    
    with open(data_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    
    # Print final stats
    total_details = sum(1 for d in details if d is not None)
    print(f"\nFinal Statistics:")
    print(f"Total stars: {len(data['stars']['names'])}")
    print(f"Stars with details: {total_details}")
    print(f"Last update: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def fetch_galaxy_data():
    base_url = "https://factorio.com"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    
    try:
        # First fetch the main page
        main_response = requests.get(f"{base_url}/galaxy", headers=headers)
        main_response.raise_for_status()
        
        # Save the HTML content for debugging
        debug_file = Path(__file__).parent / 'debug_galaxy.html'
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(main_response.text)
        
        # Parse the HTML
        soup = BeautifulSoup(main_response.text, 'html.parser')
        
        # Look for any script tags that might contain our data
        script_tags = soup.find_all('script')
        
        print(f"Found {len(script_tags)} script tags")
        
        # Save all script contents for debugging
        for i, script in enumerate(script_tags):
            if script.string:
                debug_script_file = Path(__file__).parent / f'debug_script_{i}.js'
                with open(debug_script_file, 'w', encoding='utf-8') as f:
                    f.write(script.string)
                
                # Print first 100 chars of each script for debugging
                print(f"\nScript {i} preview:")
                print(script.string[:100])
                
                # Look for potential data indicators
                if any(keyword in script.string.lower() for keyword in ['star', 'galaxy', 'names', 'colors', 'creation']):
                    print(f"Found promising data in script {i}")
                    return script.string
        
        # If we haven't found inline data, try external scripts
        for script in script_tags:
            if script.get('src'):
                src = script['src']
                if not src.startswith('http'):
                    src = f"{base_url}{src}" if src.startswith('/') else f"{base_url}/{src}"
                
                print(f"\nFetching external script: {src}")
                js_response = requests.get(src, headers=headers)
                js_response.raise_for_status()
                
                content = js_response.text
                # Save external script content
                debug_script_file = Path(__file__).parent / f'debug_external_{src.split("/")[-1]}'
                with open(debug_script_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                if any(keyword in content.lower() for keyword in ['star', 'galaxy', 'names', 'colors', 'creation']):
                    print(f"Found promising data in external script: {src}")
                    return content
        
        print("\nCouldn't find the stars data. Check debug files for the full content.")
        sys.exit(1)
        
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        sys.exit(1)

def extract_stars_data(js_content):
    # Save the JS content for debugging
    debug_file = Path(__file__).parent / 'debug_spacemap.js'
    with open(debug_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    # Print the first 500 characters of content for debugging
    print("\nJS Content Preview:")
    print(js_content[:500])
    
    # Look for the stars data with more flexible patterns
    patterns = [
        r'const\s+stars\s*=\s*({[^;]+});',
        r'let\s+stars\s*=\s*({[^;]+});',
        r'var\s+stars\s*=\s*({[^;]+});',
        r'stars:\s*({[^}]+})',
        r'window\.stars\s*=\s*({[^;]+});',
        r'export\s+const\s+stars\s*=\s*({[^;]+});',
        r'const\s+data\s*=\s*({[^;]+});',
        r'"stars"\s*:\s*({[^}]+})',
        r'{\s*"names"\s*:\s*\[[^\]]+\].*"colors"\s*:\s*\[[^\]]+\].*"creation_update"\s*:\s*\[[^\]]+\].*"users"\s*:\s*\[[^\]]+\]}',  # Updated pattern
    ]
    
    for pattern in patterns:
        match = re.search(pattern, js_content, re.DOTALL)
        if match:
            try:
                json_str = match.group(1)
                json_str = json_str.strip()
                if json_str.endswith(','):
                    json_str = json_str[:-1]
                
                # Print the matched JSON string for debugging
                print("\nFound potential JSON data:")
                print(json_str[:200])
                
                stars_data = json.loads(json_str)
                if all(key in stars_data for key in ['names', 'colors', 'creation_update', 'users']):
                    print("Successfully extracted stars data with users!")
                    return stars_data
                else:
                    print(f"Found JSON but missing required keys. Keys found: {list(stars_data.keys())}")
            except json.JSONDecodeError as e:
                print(f"JSON parsing failed for pattern {pattern}: {e}")
                print(f"JSON string preview: {json_str[:100]}...")
                continue
    
    print("Could not find stars data in the JavaScript content")
    sys.exit(1)

def main():
    print("Fetching data from factorio.com/galaxy...")
    js_content = fetch_galaxy_data()
    
    print("Extracting stars data...")
    stars_data = extract_stars_data(js_content)
    
    print("Updating data.json...")
    update_data_file(stars_data)

if __name__ == "__main__":
    main() 