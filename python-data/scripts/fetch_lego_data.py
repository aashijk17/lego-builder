#!/usr/bin/env python3
"""
Fetch LEGO sets and parts from Rebrickable API
Stores normalized data in MongoDB for the LEGO Builder app
"""

import requests
import json
import time
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
REBRICKABLE_API_KEY = os.getenv("REBRICKABLE_API_KEY", "0")  # Get free key from rebrickable.com
MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:password@mongodb:27017/lego_builder")
REBRICKABLE_BASE_URL = "https://rebrickable.com/api/v3"

# API rate limiting (Rebrickable free tier: 100 req/hour)
REQUEST_DELAY = 0.5  # seconds between requests

class LegoDataFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json'
        })
        # Note: Rebrickable API key is optional for basic queries
        if REBRICKABLE_API_KEY != "0":
            self.session.headers.update({
                'Authorization': f'key {REBRICKABLE_API_KEY}'
            })
        
        self.mongo_client = MongoClient(MONGO_URI)
        self.db = self.mongo_client['lego_builder']
        self.sets_collection = self.db['sets']
        self.colors_collection = self.db['colors']
        
        # Create indexes
        self.sets_collection.create_index('setId', unique=True)
        self.colors_collection.create_index('colorId', unique=True)

    def fetch_sets(self, limit=200):
        """Fetch most recent LEGO sets"""
        print(f"Fetching up to {limit} LEGO sets...")
        
        url = f"{REBRICKABLE_BASE_URL}/lego/sets"
        params = {
            'page_size': 100,
            'ordering': '-year,-set_num'  # Most recent first
        }
        
        all_sets = []
        page = 1
        
        while len(all_sets) < limit:
            params['page'] = page
            print(f"Fetching page {page}...")
            
            try:
                response = self.session.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                sets = data.get('results', [])
                if not sets:
                    break
                
                all_sets.extend(sets)
                
                # Rate limiting
                time.sleep(REQUEST_DELAY)
                
                # Check if more pages exist
                if not data.get('next'):
                    break
                
                page += 1
                
            except requests.RequestException as e:
                print(f"Error fetching sets: {e}")
                break
        
        return all_sets[:limit]

    def fetch_set_parts(self, set_num):
        """Fetch parts for a specific set"""
        url = f"{REBRICKABLE_BASE_URL}/lego/sets/{set_num}/parts"
        params = {'page_size': 1000}
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            time.sleep(REQUEST_DELAY)
            return data.get('results', [])
        except requests.RequestException as e:
            print(f"Error fetching parts for set {set_num}: {e}")
            return []

    def normalize_set(self, raw_set, parts):
        """Normalize Rebrickable set data to our schema"""
        
        brick_list = []
        for part in parts:
            brick_list.append({
                'brickId': part['part']['part_num'],
                'brickName': part['part']['name'],
                'colorId': part['color']['id'],
                'colorName': part['color']['name'],
                'quantity': part['quantity']
            })
        
        normalized = {
            'setId': raw_set['set_num'],
            'name': raw_set['name'],
            'year': int(raw_set['year']),
            'theme': raw_set.get('theme_id', 'unknown'),
            'piecesCount': int(raw_set['num_parts']),
            'imageUrl': raw_set.get('set_img_url', ''),
            'rebrickableUrl': raw_set.get('set_url', ''),
            'brickList': brick_list,
            'fetchedAt': datetime.utcnow()
        }
        
        return normalized

    def store_sets(self, sets_data):
        """Store sets in MongoDB"""
        print(f"Storing {len(sets_data)} sets in MongoDB...")
        
        stored = 0
        errors = 0
        
        for set_data in sets_data:
            try:
                # Upsert - update if exists, insert if doesn't
                self.sets_collection.update_one(
                    {'setId': set_data['setId']},
                    {'$set': set_data},
                    upsert=True
                )
                stored += 1
                
                if stored % 10 == 0:
                    print(f"  Stored {stored} sets...")
                    
            except Exception as e:
                print(f"Error storing set {set_data.get('setId')}: {e}")
                errors += 1
        
        print(f"✅ Successfully stored {stored} sets ({errors} errors)")
        return stored

    def run(self, limit=200):
        """Run the full data fetch pipeline"""
        print("🟧 Starting LEGO data fetch from Rebrickable...")
        print(f"Target: {limit} sets\n")
        
        # Fetch sets
        raw_sets = self.fetch_sets(limit=limit)
        print(f"✅ Fetched {len(raw_sets)} sets\n")
        
        if not raw_sets:
            print("❌ No sets found. Check your internet connection.")
            return False
        
        # Fetch parts for each set and normalize
        normalized_sets = []
        for i, raw_set in enumerate(raw_sets, 1):
            print(f"Processing set {i}/{len(raw_sets)}: {raw_set['name']}")
            
            parts = self.fetch_set_parts(raw_set['set_num'])
            normalized = self.normalize_set(raw_set, parts)
            normalized_sets.append(normalized)
        
        print()
        
        # Store in database
        self.store_sets(normalized_sets)
        
        print("\n✅ Data fetch complete!")
        
        # Print summary
        count = self.sets_collection.count_documents({})
        total_pieces = sum(s['piecesCount'] for s in normalized_sets)
        print(f"\nDatabase Summary:")
        print(f"  Total sets: {count}")
        print(f"  Sets just fetched: {len(normalized_sets)}")
        print(f"  Total pieces: {total_pieces:,}")
        
        return True

if __name__ == "__main__":
    fetcher = LegoDataFetcher()
    try:
        fetcher.run(limit=200)
    except KeyboardInterrupt:
        print("\n\n⚠️ Fetch interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
