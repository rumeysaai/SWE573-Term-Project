import requests
import logging
from django.core.cache import cache
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

CACHE_TIMEOUT = 3600  # 1 hour in seconds

def search_wikidata(query: str) -> List[Dict]:
    """
    Search Wikidata for entities matching the query.
    Results are cached for 1 hour to improve performance.
    
    Args:
        query: Search query string
        
    Returns:
        List of dictionaries with 'label', 'id', and 'description' keys
    """
    if not query or len(query.strip()) < 2:
        return []
    
    query = query.strip()
    cache_key = f'wikidata_search_{query.lower()}'
    
    # Check cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        logger.info(f"Cache hit for Wikidata search: {query}")
        return cached_result
    
    try:
        url = "https://www.wikidata.org/w/api.php"
        params = {
            'action': 'wbsearchentities',
            'language': 'en',
            'format': 'json',
            'search': query,
            'limit': 10,  # Limit results to 10
        }
        
        # Wikidata API requires User-Agent header
        headers = {
            'User-Agent': 'TheHive/1.0 (https://thehive.example.com; contact@example.com)'
        }
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        results = []
        
        if 'search' in data:
            for item in data['search']:
                result = {
                    'label': item.get('label', ''),
                    'id': item.get('id', ''),  # Q identifier (e.g., Q42)
                    'description': item.get('description', ''),
                }
                # Only add if we have a label and ID
                if result['label'] and result['id']:
                    results.append(result)
        
        # Cache the results
        cache.set(cache_key, results, CACHE_TIMEOUT)
        logger.info(f"Cached Wikidata search results for: {query}")
        
        return results
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching from Wikidata API: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in search_wikidata: {e}")
        return []

def get_wikidata_entity(wikidata_id: str) -> Optional[Dict]:
    """
    Get entity details from Wikidata by Q ID.
    
    Args:
        wikidata_id: Wikidata Q identifier (e.g., 'Q17' for Japan)
        
    Returns:
        Dictionary with 'label' and 'description' keys, or None if not found
    """
    if not wikidata_id or not wikidata_id.startswith('Q'):
        return None
    
    cache_key = f'wikidata_entity_{wikidata_id}'
    
    # Check cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        logger.info(f"Cache hit for Wikidata entity: {wikidata_id}")
        return cached_result
    
    try:
        url = "https://www.wikidata.org/w/api.php"
        params = {
            'action': 'wbgetentities',
            'ids': wikidata_id,
            'languages': 'en',
            'format': 'json',
            'props': 'labels|descriptions'
        }
        
        headers = {
            'User-Agent': 'TheHive/1.0 (https://thehive.example.com; contact@example.com)'
        }
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if 'entities' in data and wikidata_id in data['entities']:
            entity = data['entities'][wikidata_id]
            label = entity.get('labels', {}).get('en', {}).get('value', wikidata_id)
            description = entity.get('descriptions', {}).get('en', {}).get('value', '')
            
            result = {
                'label': label,
                'description': description,
                'id': wikidata_id
            }
            
            # Cache the result
            cache.set(cache_key, result, CACHE_TIMEOUT)
            logger.info(f"Cached Wikidata entity: {wikidata_id}")
            
            return result
        
        return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching entity from Wikidata API: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in get_wikidata_entity: {e}")
        return None

