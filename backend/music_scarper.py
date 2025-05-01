#!/usr/bin/env python3
"""
music_scraper.py
Fetch and print today's Friday music lineup for a given club by auto-discovering the club's official website and Instagram handle,
plus referencing allevents.in/toronto and torontoclubs.com.

Usage:
    pip install requests beautifulsoup4 python-dotenv
    export GOOGLE_PLACES_API_KEY=your_api_key_here
    python music_scraper.py "Club Name"
"""

import os
import sys
import re
import json
import logging
import argparse
import requests
from dotenv import load_dotenv

from datetime import datetime
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Environment check
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
if not GOOGLE_PLACES_API_KEY:
    logger.error("Error: Set GOOGLE_PLACES_API_KEY in your environment.")
    sys.exit(1)

# Common genre keywords to look for
GENRE_KEYWORDS = ["House", "Hip Hop", "Trap", "Top 40", "Dance", "EDM", "Electronic", "Techno", "R&B"]

def discover_official_website(club_name):
    """Discover official website via Google Places Text Search"""
    url = "https://places.googleapis.com/v1/places:searchText"
    payload = {"textQuery": club_name}
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.websiteUri,places.formattedAddress",
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        places = data.get("places", [])
        
        if not places:
            logger.warning(f"No places found for {club_name}")
            return None
            
        place = places[0]
        if place.get("websiteUri"):
            logger.info(f"Found website for {club_name}: {place['websiteUri']}")
            return place["websiteUri"]
            
        logger.warning(f"No website found for {club_name}")
        return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching website for {club_name}: {str(e)}")
        return None

def discover_instagram_handle(website_url):
    """Extract Instagram handle from meta or link on the official site"""
    if not website_url:
        return None
        
    try:
        resp = requests.get(website_url, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Error fetching website {website_url}: {str(e)}")
        return None
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # Check meta tags first
    for meta in soup.find_all('meta', property=re.compile(r'og:url|twitter:url')):
        if meta.get('content') and 'instagram.com' in meta['content']:
            m = re.search(r"instagram\.com/([^/?]+)", meta['content'])
            if m:
                return m.group(1)
    
    # Check links
    for a in soup.find_all('a', href=re.compile(r"instagram\.com/([^/?]+)")):
        m = re.search(r"instagram\.com/([^/?]+)", a['href'])
        if m:
            return m.group(1)
            
    return None

def extract_lines(text, current_date=None):
    """Scrape any free-text page for lines matching Friday + genre keywords"""
    if not current_date:
        current_date = datetime.now()
        
    lines = []
    for sentence in re.split(r'[\.!?]', text):
        # Check for day of week
        day_match = current_date.strftime("%A").lower() in sentence.lower()
        # Check for genre keywords
        genre_match = any(k.lower() in sentence.lower() for k in GENRE_KEYWORDS)
        
        if day_match and genre_match:
            lines.append(sentence.strip())
            
    return list(set(lines))

def scrape_website_genre(website_url):
    """Scrape genre information from official website"""
    if not website_url:
        return []
        
    try:
        resp = requests.get(website_url, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Error scraping website {website_url}: {str(e)}")
        return []
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    return extract_lines(soup.get_text(separator=' ', strip=True))

def scrape_instagram_genre(insta_handle):
    """Scrape genre information from Instagram"""
    if not insta_handle:
        return []
        
    # Note: Instagram scraping requires proper authentication
    # This is a placeholder for a proper Instagram API implementation
    logger.warning("Instagram scraping requires proper API authentication")
    return []

def scrape_allevents_genre(club_name):
    """Scrape genre information from AllEvents"""
    url = "https://allevents.in/toronto"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Error scraping AllEvents: {str(e)}")
        return []
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    matches = []
    for tag in soup.find_all(text=re.compile(club_name, re.IGNORECASE)):
        context = tag.parent.get_text(separator=' ', strip=True)
        if any(k.lower() in context.lower() for k in GENRE_KEYWORDS):
            matches.append(context)
    return list(set(matches))

def scrape_torontoclubs_genre(club_name):
    """Scrape genre information from TorontoClubs"""
    slug = club_name.lower().replace(" ", "-")
    url = f"https://www.torontoclubs.com/{slug}"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Error scraping TorontoClubs: {str(e)}")
        return []
        
    soup = BeautifulSoup(resp.text, 'html.parser')
    matches = []
    for elem in soup.find_all(['p','div','span']):
        text = elem.get_text(separator=' ', strip=True)
        if any(k.lower() in text.lower() for k in GENRE_KEYWORDS):
            matches.append(text)
    return list(set(matches))

def main():
    parser = argparse.ArgumentParser(description='Scrape music lineup information for a club')
    parser.add_argument('club_name', help='Name of the club to search for')
    args = parser.parse_args()

    club_name = args.club_name
    logger.info(f"Searching for information about {club_name}")

    website = discover_official_website(club_name)
    insta = discover_instagram_handle(website) if website else None

    logger.info(f"Official website: {website}")
    logger.info(f"Instagram handle: {insta}\n")

    sources = {
        "Website": scrape_website_genre(website) if website else [],
        "Instagram": scrape_instagram_genre(insta),
        "AllEvents": scrape_allevents_genre(club_name),
        "TorontoClubs": scrape_torontoclubs_genre(club_name)
    }

    for src, results in sources.items():
        logger.info(f"--- {src} lines ---")
        if results:
            for line in results:
                logger.info(f"- {line}")
        else:
            logger.info("No data found.")
        print()

if __name__ == "__main__":
    main()
