#!/usr/bin/env python3
"""
Weather Data Fetcher Script
Fetches weather data from Open-Meteo API and saves it to JSON files.
"""

import requests
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
LOCATIONS = {
    'oneonta': {
        'name': 'Oneonta, NY',
        'latitude': 42.4534,
        'longitude': -75.0510
    },
    'greenville': {
        'name': 'Greenville, SC',
        'latitude': 34.8526,
        'longitude': -82.3940
    }
}

BASE_URL = 'https://api.open-meteo.com/v1'
DATA_DIR = Path(__file__).parent.parent / 'data'

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

def fetch_forecast_data(latitude, longitude, location_name):
    """Fetch forecast data for the next 16 days."""
    params = {
        'latitude': latitude,
        'longitude': longitude,
        'hourly': 'temperature_2m,precipitation,sunshine_duration,is_day',
        'daily': 'sunrise,sunset',
        'temperature_unit': 'fahrenheit',
        'precipitation_unit': 'inch',
        'timezone': 'auto',
        'forecast_days': 16
    }
    
    try:
        response = requests.get(f'{BASE_URL}/forecast', params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"✓ Forecast data fetched for {location_name}")
        return data
    except requests.exceptions.RequestException as e:
        print(f"✗ Error fetching forecast data for {location_name}: {e}")
        return None

def fetch_historical_data(latitude, longitude, location_name, past_days=30):
    """Fetch historical data for the past 30 days."""
    start_date = (datetime.now() - timedelta(days=past_days)).strftime('%Y-%m-%d')
    end_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    params = {
        'latitude': latitude,
        'longitude': longitude,
        'hourly': 'temperature_2m,precipitation,sunshine_duration,is_day',
        'temperature_unit': 'fahrenheit',
        'precipitation_unit': 'inch',
        'timezone': 'auto',
        'start_date': start_date,
        'end_date': end_date
    }
    
    try:
        response = requests.get(f'{BASE_URL}/forecast', params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"✓ Historical data fetched for {location_name}")
        return data
    except requests.exceptions.RequestException as e:
        print(f"✗ Error fetching historical data for {location_name}: {e}")
        return None

def save_data(data, filename):
    """Save data to a JSON file."""
    try:
        filepath = DATA_DIR / filename
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✓ Data saved to {filename}")
    except IOError as e:
        print(f"✗ Error saving data to {filename}: {e}")

def main():
    """Main function to fetch and save weather data."""
    print(f"Starting data fetch at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    for location_key, location_info in LOCATIONS.items():
        print(f"\nProcessing {location_info['name']}...")
        
        # Fetch forecast data
        forecast_data = fetch_forecast_data(
            location_info['latitude'],
            location_info['longitude'],
            location_info['name']
        )
        if forecast_data:
            save_data(forecast_data, f'{location_key}_forecast.json')
        
        # Fetch historical data
        historical_data = fetch_historical_data(
            location_info['latitude'],
            location_info['longitude'],
            location_info['name']
        )
        if historical_data:
            save_data(historical_data, f'{location_key}_historical.json')
    
    print("\n" + "-" * 50)
    print(f"Data fetch completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == '__main__':
    main()

