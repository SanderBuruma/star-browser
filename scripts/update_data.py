import requests
from bs4 import BeautifulSoup
import json
import re
from pathlib import Path
import sys
from datetime import datetime

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
        r'const\s+data\s*=\s*({[^;]+});',  # Try looking for 'data' instead of 'stars'
        r'"stars"\s*:\s*({[^}]+})',  # JSON-style pattern
        r'{\s*"names"\s*:\s*\[[^\]]+\].*"colors"\s*:\s*\[[^\]]+\].*"creation_update"\s*:\s*\[[^\]]+\]}',  # Direct object pattern
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
                if all(key in stars_data for key in ['names', 'colors', 'creation_update']):
                    print("Successfully extracted stars data!")
                    return stars_data
                else:
                    print(f"Found JSON but missing required keys. Keys found: {list(stars_data.keys())}")
            except json.JSONDecodeError as e:
                print(f"JSON parsing failed for pattern {pattern}: {e}")
                print(f"JSON string preview: {json_str[:100]}...")
                continue
    
    print("Could not find stars data in the JavaScript content")
    sys.exit(1)

def update_data_file(stars_data):
    # Get the path to data.json relative to this script
    script_dir = Path(__file__).parent
    data_file_path = script_dir.parent / 'src' / 'app' / 'data.json'
    
    # Create the data structure
    data = {
        "stars": {
            "names": stars_data.get("names", []),
            "colors": stars_data.get("colors", []),
            "creation_update": stars_data.get("creation_update", [])
        }
    }
    
    # Ensure the directory exists
    data_file_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Write the data to file with proper formatting
        with open(data_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Successfully updated {data_file_path}")
        
        # Print some stats
        print(f"Total stars: {len(data['stars']['names'])}")
        print(f"Last update: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except IOError as e:
        print(f"Error writing to file: {e}")
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