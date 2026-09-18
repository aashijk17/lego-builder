import requests
import json
import os
from urllib.parse import urlencode
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Configuration
REBRICKABLE_API_KEY = os.getenv('REBRICKABLE_API_KEY', 'd1c40f76bbe16d85dd0bccf66b004a56')
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://admin:password@mongodb:27017/lego_builder?authSource=admin')
REBRICKABLE_BASE_URL = 'https://rebrickable.com/api/v3'

def connect_mongodb():
    """Connect to MongoDB"""
    client = MongoClient(MONGO_URI)
    db = client['lego_builder']
    return db

def fetch_all_sets():
    """Fetch all sets from Rebrickable, sorted by piece count"""
    print('🟧 Starting LEGO data fetch from Rebrickable...')
    
    all_sets = []
    page = 1
    
    # Fetch sets until we have enough
    while len(all_sets) < 500:  # Fetch extra to ensure we get top 200 after filtering
        print(f'Fetching page {page}...')
        
        params = {
            'key': REBRICKABLE_API_KEY,
            'ordering': '-num_parts',  # Sort by piece count descending
            'page_size': 100,
            'page': page
        }
        
        try:
            response = requests.get(
                f'{REBRICKABLE_BASE_URL}/lego/sets/',
                params=params,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get('results'):
                break
            
            all_sets.extend(data['results'])
            print(f'✅ Fetched {len(data["results"])} sets (total: {len(all_sets)})')
            
            page += 1
        except requests.exceptions.RequestException as e:
            print(f'❌ Error fetching page {page}: {e}')
            break
    
    # Sort by piece count descending and take top 200
    all_sets.sort(key=lambda x: x.get('num_parts', 0), reverse=True)
    top_sets = all_sets[:200]
    
    print(f'\n✅ Selected top 200 sets by piece count')
    print(f'Piece count range: {top_sets[-1].get("num_parts")} - {top_sets[0].get("num_parts")} pieces\n')
    
    return top_sets

def fetch_set_parts(set_id):
    """Fetch parts for a specific set"""
    params = {'key': REBRICKABLE_API_KEY}
    
    try:
        response = requests.get(
            f'{REBRICKABLE_BASE_URL}/lego/sets/{set_id}/parts/',
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json().get('results', [])
    except requests.exceptions.RequestException as e:
        print(f'⚠️  Error fetching parts for {set_id}: {e}')
        return []

def process_sets(sets, db):
    """Process and store sets in MongoDB"""
    print(f'Processing {len(sets)} sets...\n')
    
    sets_collection = db['sets']
    errors = 0
    
    # Clear existing data
    sets_collection.delete_many({})
    
    for idx, set_data in enumerate(sets, 1):
        try:
            set_id = set_data.get('set_num')
            print(f'Processing set {idx}/200: {set_data.get("name")} ({set_data.get("num_parts")} pieces)', end='')
            
            # Fetch parts for this set
            parts = fetch_set_parts(set_id)
            
            # Normalize brick data
            brick_list = []
            for part in parts:
                brick_list.append({
                    'brickId': part.get('part', {}).get('part_num'),
                    'brickName': part.get('part', {}).get('name'),
                    'quantity': part.get('quantity'),
                    'colorId': part.get('color', {}).get('id'),
                    'colorName': part.get('color', {}).get('name')
                })
            
            # Store in MongoDB
            set_doc = {
                'setId': set_id,
                'name': set_data.get('name'),
                'year': set_data.get('year'),
                'piecesCount': set_data.get('num_parts'),
                'imageUrl': set_data.get('set_img_url'),
                'rebrickableUrl': f'https://rebrickable.com/sets/{set_id}/',
                'theme': set_data.get('theme', {}).get('id'),
                'brickList': brick_list,
                'fetchedAt': __import__('datetime').datetime.utcnow()
            }
            
            sets_collection.insert_one(set_doc)
            print(' ✅')
        
        except Exception as e:
            print(f' ❌')
            print(f'  Error: {e}')
            errors += 1
    
    return errors

def main():
    try:
        # Connect to database
        db = connect_mongodb()
        
        # Fetch sets
        sets = fetch_all_sets()
        
        # Process and store
        errors = process_sets(sets, db)
        
        # Summary
        sets_collection = db['sets']
        count = sets_collection.count_documents({})
        
        print(f'\n✅ Successfully stored {count} sets ({errors} errors)')
        print('✅ Data fetch complete!')
    
    except Exception as e:
        print(f'❌ Fatal error: {e}')
        exit(1)

if __name__ == '__main__':
    main()
