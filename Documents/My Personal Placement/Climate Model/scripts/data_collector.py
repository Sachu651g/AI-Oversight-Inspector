#!/usr/bin/env python3
"""
Climate Guardian - Automated Data Collector
Downloads and processes climate data from open-source platforms
"""

import requests
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime, timedelta
import json
import logging
import os
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('data_collector.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DataCollector:
    """Collects climate data from various open-source platforms"""
    
    def __init__(self, db_config: Dict[str, str]):
        """
        Initialize data collector
        
        Args:
            db_config: Database configuration dict with keys:
                - host, port, database, user, password
        """
        self.db_config = db_config
        self.conn = None
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def close_db(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
    
    # ==================== IMD DATA ====================
    
    def fetch_imd_data(self, location: str, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Fetch data from India Meteorological Department API
        
        Args:
            location: Location name (e.g., 'Chennai')
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            DataFrame with weather data
        """
        logger.info(f"Fetching IMD data for {location} from {start_date} to {end_date}")
        
        # IMD API endpoint (example - adjust based on actual API)
        base_url = "https://mausam.imd.gov.in/imd_latest/contents/api"
        
        try:
            # Note: This is a placeholder. Actual IMD API may require authentication
            # and have different endpoints. Update based on official documentation.
            
            # For demo, we'll create sample data structure
            # In production, replace with actual API call
            
            logger.warning("Using sample data - replace with actual IMD API call")
            
            # Sample data structure
            dates = pd.date_range(start=start_date, end=end_date, freq='D')
            data = {
                'location_name': [location] * len(dates),
                'recorded_date': dates,
                'rainfall': [round(20 + (i % 100), 2) for i in range(len(dates))],
                'wind_speed': [round(25 + (i % 50), 2) for i in range(len(dates))],
                'humidity': [round(70 + (i % 25), 2) for i in range(len(dates))],
                'temperature': [round(28 + (i % 15), 2) for i in range(len(dates))],
            }
            
            df = pd.DataFrame(data)
            logger.info(f"Fetched {len(df)} records from IMD")
            return df
            
        except Exception as e:
            logger.error(f"Failed to fetch IMD data: {e}")
            return pd.DataFrame()
    
    # ==================== OPEN GOVERNMENT DATA ====================
    
    def fetch_open_gov_data(self, resource_id: str) -> pd.DataFrame:
        """
        Fetch data from Open Government Data Platform India
        
        Args:
            resource_id: Resource ID from data.gov.in
            
        Returns:
            DataFrame with climate data
        """
        logger.info(f"Fetching Open Government Data (resource: {resource_id})")
        
        base_url = "https://data.gov.in/api/datastore/resource.json"
        
        try:
            params = {
                'resource_id': resource_id,
                'limit': 10000  # Adjust based on data size
            }
            
            response = requests.get(base_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'records' in data:
                df = pd.DataFrame(data['records'])
                logger.info(f"Fetched {len(df)} records from Open Government Data")
                return df
            else:
                logger.warning("No records found in response")
                return pd.DataFrame()
                
        except Exception as e:
            logger.error(f"Failed to fetch Open Government Data: {e}")
            return pd.DataFrame()
    
    # ==================== GITHUB DATASETS ====================
    
    def fetch_github_csv(self, url: str) -> pd.DataFrame:
        """
        Fetch CSV data from GitHub repository
        
        Args:
            url: Raw GitHub CSV URL
            
        Returns:
            DataFrame with data
        """
        logger.info(f"Fetching data from GitHub: {url}")
        
        try:
            df = pd.read_csv(url)
            logger.info(f"Fetched {len(df)} records from GitHub")
            return df
        except Exception as e:
            logger.error(f"Failed to fetch GitHub data: {e}")
            return pd.DataFrame()
    
    # ==================== DATA PROCESSING ====================
    
    def process_climate_data(self, df: pd.DataFrame, location_coords: Dict[str, float]) -> pd.DataFrame:
        """
        Process and standardize climate data
        
        Args:
            df: Raw data DataFrame
            location_coords: Dict with 'latitude' and 'longitude'
            
        Returns:
            Processed DataFrame
        """
        logger.info("Processing climate data")
        
        try:
            # Add coordinates if not present
            if 'latitude' not in df.columns:
                df['latitude'] = location_coords['latitude']
            if 'longitude' not in df.columns:
                df['longitude'] = location_coords['longitude']
            
            # Standardize date format
            if 'recorded_date' in df.columns:
                df['recorded_date'] = pd.to_datetime(df['recorded_date'])
            
            # Handle missing values
            numeric_columns = ['rainfall', 'wind_speed', 'humidity', 'soil_moisture', 'temperature']
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = df[col].fillna(df[col].mean())
            
            # Add disaster flag (default False)
            if 'disaster_occurred' not in df.columns:
                df['disaster_occurred'] = False
            
            logger.info("Data processing complete")
            return df
            
        except Exception as e:
            logger.error(f"Data processing failed: {e}")
            return df
    
    # ==================== DATABASE IMPORT ====================
    
    def import_climate_data(self, df: pd.DataFrame):
        """
        Import climate data to historical_climate_data table
        
        Args:
            df: DataFrame with processed climate data
        """
        logger.info(f"Importing {len(df)} records to database")
        
        try:
            cursor = self.conn.cursor()
            
            # Prepare data for insertion
            columns = [
                'location_name', 'latitude', 'longitude', 'recorded_date',
                'rainfall', 'wind_speed', 'humidity', 'soil_moisture',
                'temperature', 'earthquake_magnitude', 'disaster_occurred'
            ]
            
            # Ensure all columns exist
            for col in columns:
                if col not in df.columns:
                    if col == 'soil_moisture':
                        df[col] = 50.0  # Default value
                    elif col == 'earthquake_magnitude':
                        df[col] = None
                    elif col == 'disaster_occurred':
                        df[col] = False
            
            # Convert to list of tuples
            values = df[columns].values.tolist()
            
            # Insert query
            insert_query = """
                INSERT INTO historical_climate_data (
                    location_name, latitude, longitude, recorded_date,
                    rainfall, wind_speed, humidity, soil_moisture,
                    temperature, earthquake_magnitude, disaster_occurred
                ) VALUES %s
                ON CONFLICT (location_name, recorded_date) DO UPDATE SET
                    rainfall = EXCLUDED.rainfall,
                    wind_speed = EXCLUDED.wind_speed,
                    humidity = EXCLUDED.humidity,
                    soil_moisture = EXCLUDED.soil_moisture,
                    temperature = EXCLUDED.temperature,
                    updated_at = CURRENT_TIMESTAMP
            """
            
            execute_values(cursor, insert_query, values)
            self.conn.commit()
            
            logger.info(f"Successfully imported {len(df)} records")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Database import failed: {e}")
            raise
        finally:
            cursor.close()
    
    def import_disaster_data(self, df: pd.DataFrame):
        """
        Import disaster data to historical_disasters table
        
        Args:
            df: DataFrame with disaster data
        """
        logger.info(f"Importing {len(df)} disaster records to database")
        
        try:
            cursor = self.conn.cursor()
            
            columns = [
                'location_name', 'latitude', 'longitude', 'disaster_date',
                'disaster_type', 'severity', 'casualties', 'affected_population',
                'economic_loss', 'description', 'source'
            ]
            
            # Ensure all columns exist
            for col in columns:
                if col not in df.columns:
                    if col in ['casualties', 'affected_population']:
                        df[col] = 0
                    elif col == 'economic_loss':
                        df[col] = 0.0
                    elif col in ['description', 'source']:
                        df[col] = ''
            
            values = df[columns].values.tolist()
            
            insert_query = """
                INSERT INTO historical_disasters (
                    location_name, latitude, longitude, disaster_date,
                    disaster_type, severity, casualties, affected_population,
                    economic_loss, description, source
                ) VALUES %s
                ON CONFLICT (location_name, disaster_date, disaster_type) DO NOTHING
            """
            
            execute_values(cursor, insert_query, values)
            self.conn.commit()
            
            logger.info(f"Successfully imported {len(df)} disaster records")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Disaster data import failed: {e}")
            raise
        finally:
            cursor.close()
    
    # ==================== MAIN COLLECTION WORKFLOW ====================
    
    def collect_all_data(self, locations: List[Dict[str, Any]]):
        """
        Main workflow to collect data from all sources
        
        Args:
            locations: List of dicts with location info:
                - name: Location name
                - latitude: Latitude
                - longitude: Longitude
        """
        logger.info("Starting data collection workflow")
        
        try:
            self.connect_db()
            
            for location in locations:
                logger.info(f"Processing location: {location['name']}")
                
                # Calculate date range (last 5 years)
                end_date = datetime.now()
                start_date = end_date - timedelta(days=5*365)
                
                # Fetch IMD data
                imd_data = self.fetch_imd_data(
                    location['name'],
                    start_date.strftime('%Y-%m-%d'),
                    end_date.strftime('%Y-%m-%d')
                )
                
                if not imd_data.empty:
                    # Process data
                    processed_data = self.process_climate_data(
                        imd_data,
                        {'latitude': location['latitude'], 'longitude': location['longitude']}
                    )
                    
                    # Import to database
                    self.import_climate_data(processed_data)
                
                logger.info(f"Completed processing for {location['name']}")
            
            logger.info("Data collection workflow completed successfully")
            
        except Exception as e:
            logger.error(f"Data collection workflow failed: {e}")
            raise
        finally:
            self.close_db()


# ==================== MAIN EXECUTION ====================

def main():
    """Main execution function"""
    
    # Database configuration
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'climate_guardian'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'password')
    }
    
    # Locations to collect data for
    locations = [
        {
            'name': 'Chennai',
            'latitude': 13.0827,
            'longitude': 80.2707
        },
        {
            'name': 'Coimbatore',
            'latitude': 11.0168,
            'longitude': 76.9558
        },
        {
            'name': 'Madurai',
            'latitude': 9.9252,
            'longitude': 78.1198
        }
    ]
    
    # Initialize collector
    collector = DataCollector(db_config)
    
    # Run collection
    collector.collect_all_data(locations)
    
    logger.info("Data collection complete!")


if __name__ == "__main__":
    main()
