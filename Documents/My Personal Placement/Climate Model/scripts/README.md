# Climate Guardian - Data Collection Scripts

## 📊 Automated Data Collection from Open Sources

This directory contains scripts to automatically download and integrate climate data from various open-source platforms including:

- ✅ India Meteorological Department (IMD)
- ✅ Open Government Data Platform India
- ✅ GitHub repositories (Chennai climate data)
- ✅ INDOFLOODS database (IIT Delhi)
- ✅ Research datasets

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd scripts
pip install -r requirements.txt
```

### 2. Set Up Environment Variables
Create a `.env` file:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=climate_guardian
DB_USER=postgres
DB_PASSWORD=your_password

# API Keys (if required)
IMD_API_KEY=your_imd_api_key  # Optional
OPEN_GOV_API_KEY=your_api_key  # Optional
```

### 3. Run Data Collector
```bash
python data_collector.py
```

---

## 📁 Files

### `data_collector.py`
Main script that:
- Fetches data from IMD API
- Downloads Open Government Data
- Processes and cleans data
- Imports to PostgreSQL database
- Handles errors and logging

### `requirements.txt`
Python dependencies for data collection

### `.env.example`
Example environment configuration

---

## 🔧 Configuration

### Locations
Edit the `locations` list in `data_collector.py`:

```python
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
    }
]
```

### Date Range
By default, collects last 5 years of data. Modify in `collect_all_data()`:

```python
start_date = end_date - timedelta(days=5*365)  # 5 years
```

---

## 📊 Data Sources

### 1. IMD (India Meteorological Department)
**URL**: https://mausam.imd.gov.in  
**Data**: Real-time weather, historical rainfall, cyclone warnings  
**Format**: JSON API  
**Update**: Hourly

**Usage**:
```python
imd_data = collector.fetch_imd_data('Chennai', '2020-01-01', '2025-12-31')
```

### 2. Open Government Data Platform
**URL**: https://data.gov.in  
**Data**: Monthly rainfall, seasonal patterns  
**Format**: JSON API, CSV  
**Update**: Monthly

**Usage**:
```python
gov_data = collector.fetch_open_gov_data(resource_id='your_resource_id')
```

### 3. GitHub Datasets
**URL**: Various GitHub repositories  
**Data**: Historical climate data (CSV)  
**Format**: CSV  
**Update**: Static

**Usage**:
```python
github_data = collector.fetch_github_csv('https://raw.githubusercontent.com/...')
```

---

## 🗄️ Database Schema

### Data is imported to these tables:

#### `historical_climate_data`
```sql
- location_name (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)
- recorded_date (TIMESTAMP)
- rainfall (DECIMAL)
- wind_speed (DECIMAL)
- humidity (DECIMAL)
- soil_moisture (DECIMAL)
- temperature (DECIMAL)
- earthquake_magnitude (DECIMAL)
- disaster_occurred (BOOLEAN)
```

#### `historical_disasters`
```sql
- location_name (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)
- disaster_date (TIMESTAMP)
- disaster_type (VARCHAR)
- severity (VARCHAR)
- casualties (INTEGER)
- affected_population (INTEGER)
- economic_loss (DECIMAL)
- description (TEXT)
- source (VARCHAR)
```

---

## 📈 Data Processing Pipeline

1. **Fetch** - Download data from source
2. **Clean** - Handle missing values, standardize formats
3. **Transform** - Add coordinates, convert units
4. **Validate** - Check data quality
5. **Import** - Insert into PostgreSQL
6. **Log** - Record success/failures

---

## 🔄 Automated Scheduling

### Option 1: Cron Job (Linux/Mac)
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/scripts && python data_collector.py
```

### Option 2: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `python`
6. Arguments: `C:\path\to\scripts\data_collector.py`

### Option 3: Python Schedule (Built-in)
Add to `data_collector.py`:
```python
import schedule
import time

def job():
    collector = DataCollector(db_config)
    collector.collect_all_data(locations)

# Run every day at 2 AM
schedule.every().day.at("02:00").do(job)

while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## 📝 Logging

Logs are written to:
- **Console**: Real-time output
- **File**: `data_collector.log`

Log levels:
- `INFO`: Normal operations
- `WARNING`: Non-critical issues
- `ERROR`: Failed operations

Example log:
```
2026-04-15 18:50:00 - INFO - Starting data collection workflow
2026-04-15 18:50:05 - INFO - Fetching IMD data for Chennai from 2021-04-15 to 2026-04-15
2026-04-15 18:50:10 - INFO - Fetched 1826 records from IMD
2026-04-15 18:50:15 - INFO - Processing climate data
2026-04-15 18:50:20 - INFO - Importing 1826 records to database
2026-04-15 18:50:25 - INFO - Successfully imported 1826 records
2026-04-15 18:50:30 - INFO - Data collection workflow completed successfully
```

---

## 🧪 Testing

### Test Database Connection
```python
from data_collector import DataCollector

db_config = {
    'host': 'localhost',
    'port': '5432',
    'database': 'climate_guardian',
    'user': 'postgres',
    'password': 'password'
}

collector = DataCollector(db_config)
collector.connect_db()
print("Connection successful!")
collector.close_db()
```

### Test Data Fetch
```python
collector = DataCollector(db_config)
data = collector.fetch_imd_data('Chennai', '2025-01-01', '2025-12-31')
print(f"Fetched {len(data)} records")
print(data.head())
```

---

## 🔍 Troubleshooting

### Issue: Database connection failed
**Solution**: Check database credentials in `.env` file

### Issue: API request timeout
**Solution**: Increase timeout in `requests.get(timeout=60)`

### Issue: Missing data columns
**Solution**: Check data source format, update column mapping

### Issue: Import fails with duplicate key
**Solution**: Script uses `ON CONFLICT` to handle duplicates automatically

---

## 📚 Additional Resources

### Data Sources Documentation
- **IMD API**: https://mausam.imd.gov.in/responsive/apis.php
- **Open Gov Data**: https://data.gov.in/help/api
- **INDOFLOODS**: https://hydrosense.iitd.ac.in/resources/

### Python Libraries
- **pandas**: https://pandas.pydata.org/docs/
- **psycopg2**: https://www.psycopg.org/docs/
- **requests**: https://requests.readthedocs.io/

---

## ✅ Next Steps

1. **Download real datasets** from sources listed in `DATA_SOURCES.md`
2. **Update API endpoints** in `data_collector.py` with actual URLs
3. **Add API keys** to `.env` file if required
4. **Run initial collection** to populate database
5. **Set up automated scheduling** for daily updates
6. **Monitor logs** for any issues

---

**Status**: Ready to collect data  
**Estimated Time**: 30 minutes for initial setup  
**Data Volume**: ~10-50 MB per location  
**Update Frequency**: Daily (automated)
