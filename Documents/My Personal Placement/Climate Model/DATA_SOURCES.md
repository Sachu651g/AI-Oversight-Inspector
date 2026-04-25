# Climate Guardian - Data Sources & Integration

## ✅ AVAILABLE OPEN-SOURCE DATASETS

### 1. India Meteorological Department (IMD) - Official Government Data
**Source**: [https://mausam.imd.gov.in](https://mausam.imd.gov.in)  
**Type**: Official Government Data (FREE)

**Available Data**:
- ✅ Real-time weather data
- ✅ Historical rainfall data
- ✅ Cyclone warnings
- ✅ District-wise forecasts
- ✅ Port warnings
- ✅ Sea area bulletins

**API Access**: [https://mausam.imd.gov.in/responsive/apis.php](https://mausam.imd.gov.in/responsive/apis.php)

**Data Format**: JSON, XML
**Update Frequency**: Real-time (hourly)
**Coverage**: All India (including Chennai, Tamil Nadu)

---

### 2. Open Government Data (OGD) Platform India
**Source**: [https://data.gov.in](https://data.gov.in/catalog/rainfall-india)  
**Type**: Government Open Data (FREE)

**Available Datasets**:
- ✅ Month-wise all India rainfall data
- ✅ Sub-division wise rainfall
- ✅ Departure from normal rainfall
- ✅ Seasonal data
- ✅ Historical records (1901-present)

**Data Format**: CSV, JSON, XML
**Update Frequency**: Monthly
**Coverage**: All India subdivisions

**Direct Download**: Available in CSV format

---

### 3. INDOFLOODS Database - IIT Delhi
**Source**: [https://hydrosense.iitd.ac.in/resources/](https://hydrosense.iitd.ac.in/resources/)  
**Type**: Academic Research Data (FREE)

**Available Data**:
- ✅ Comprehensive flood events database
- ✅ Catchment attributes
- ✅ Historical flood records
- ✅ Geospatial data

**Data Format**: CSV, Shapefile
**Coverage**: All India flood-prone areas

---

### 4. Flood Risk Prediction Dataset India
**Source**: [https://gts.ai/dataset-download/flood-risk-in-india/](https://gts.ai/dataset-download/flood-risk-in-india/)  
**Type**: Research Dataset (FREE)

**Features**:
- ✅ Meteorological data (rainfall, temperature, humidity)
- ✅ Geographical data (elevation, river discharge)
- ✅ Hydrological data (water levels)
- ✅ Socio-economic factors (population density)
- ✅ Historical flood occurrences

**Data Format**: CSV
**Use Case**: Perfect for ML model training

---

### 5. GitHub - IMD Data Repositories
**Source**: Multiple GitHub repositories

#### a) imdlib - Python Library
**URL**: [https://github.com/iamsaswata/imdlib](https://github.com/iamsaswata/imdlib)  
**Description**: Download and process binary IMD meteorological data in Python  
**Data**: Gridded rainfall, temperature data

#### b) india-weather-rest API
**URL**: [https://github.com/rtdtwo/india-weather-rest](https://github.com/rtdtwo/india-weather-rest)  
**Description**: RESTful API to access IMD weather data  
**Data**: Real-time weather, forecasts

#### c) Chennai Climate Analysis
**URL**: [https://github.com/adityarn/India_Climate_Stripes](https://github.com/adityarn/India_Climate_Stripes)  
**Data**: Chennai climate data 1970-2019 (CSV)

---

### 6. Centre for Science and Environment (CSE) Data
**Source**: Down to Earth magazine reports  
**Type**: Research Data (FREE)

**Available Data**:
- ✅ Extreme weather events (2022-2025)
- ✅ Daily disaster records
- ✅ Casualties and economic loss
- ✅ State-wise breakdown

**Coverage**: All India, daily updates

---

## 📊 RECOMMENDED DATASETS FOR CLIMATE GUARDIAN

### Priority 1: IMD Historical Data (MUST HAVE)
**Why**: Official government data, most reliable
**What to Download**:
1. District-wise rainfall data (last 10 years)
2. Cyclone track data
3. Temperature and humidity records
4. Wind speed data

**Integration**: Direct API or CSV import

---

### Priority 2: INDOFLOODS Database (HIGHLY RECOMMENDED)
**Why**: Comprehensive flood history with geospatial data
**What to Download**:
1. Historical flood events (Chennai, Tamil Nadu)
2. Catchment characteristics
3. Flood frequency data

**Integration**: CSV import to `historical_disasters` table

---

### Priority 3: Open Government Data Platform (RECOMMENDED)
**Why**: Easy access, CSV format, monthly updates
**What to Download**:
1. Sub-division wise rainfall (Tamil Nadu)
2. Seasonal rainfall patterns
3. Departure from normal data

**Integration**: CSV import to `historical_climate_data` table

---

## 🔧 DATA INTEGRATION PLAN

### Step 1: Download Datasets
```bash
# IMD Rainfall Data
wget https://data.gov.in/api/datastore/resource.json?resource_id=<resource_id>

# INDOFLOODS Data
# Visit: https://hydrosense.iitd.ac.in/resources/
# Download: INDOFLOODS database CSV

# Chennai Climate Data
git clone https://github.com/adityarn/India_Climate_Stripes
```

### Step 2: Data Preprocessing
- Clean missing values
- Standardize date formats
- Convert units (if needed)
- Add geospatial coordinates

### Step 3: Database Import
- Import to `historical_climate_data` table
- Import to `historical_disasters` table
- Verify data integrity

### Step 4: API Integration
- Set up IMD API connection
- Schedule daily data updates
- Cache frequently accessed data

---

## 📁 DATA STRUCTURE MAPPING

### IMD Data → historical_climate_data
```sql
INSERT INTO historical_climate_data (
  location_name,
  latitude,
  longitude,
  recorded_date,
  rainfall,
  wind_speed,
  humidity,
  temperature
) VALUES (
  'Chennai',
  13.0827,
  80.2707,
  '2024-01-15',
  45.5,
  35.0,
  78.0,
  32.0
);
```

### INDOFLOODS Data → historical_disasters
```sql
INSERT INTO historical_disasters (
  location_name,
  latitude,
  longitude,
  disaster_date,
  disaster_type,
  severity,
  casualties,
  affected_population,
  economic_loss
) VALUES (
  'Chennai',
  13.0827,
  80.2707,
  '2015-11-15',
  'Flood',
  'Critical',
  500,
  1800000,
  20000.00
);
```

---

## 🚀 AUTOMATED DATA COLLECTION SCRIPT

I'll create a Python script to automatically download and process data from these sources.

### Features:
1. ✅ Download IMD data via API
2. ✅ Download Open Government Data CSV
3. ✅ Process and clean data
4. ✅ Import to PostgreSQL database
5. ✅ Schedule daily updates
6. ✅ Error handling and logging

---

## 📈 DATA QUALITY METRICS

### IMD Data
- **Reliability**: ⭐⭐⭐⭐⭐ (Official government source)
- **Coverage**: All India
- **Frequency**: Hourly/Daily
- **Historical**: 1901-present

### INDOFLOODS
- **Reliability**: ⭐⭐⭐⭐⭐ (IIT Delhi research)
- **Coverage**: Flood-prone areas
- **Frequency**: Event-based
- **Historical**: 1978-present

### Open Government Data
- **Reliability**: ⭐⭐⭐⭐⭐ (Government verified)
- **Coverage**: All India
- **Frequency**: Monthly
- **Historical**: 1901-present

---

## ✅ NEXT STEPS

1. **Download Priority Datasets**
   - IMD historical rainfall data
   - INDOFLOODS database
   - Open Government Data CSV

2. **Create Data Import Scripts**
   - Python script for CSV processing
   - SQL import scripts
   - Data validation scripts

3. **Set Up Automated Updates**
   - Daily IMD API calls
   - Monthly Open Government Data sync
   - Quarterly INDOFLOODS updates

4. **Verify Data Integration**
   - Test pattern analysis with real data
   - Verify geospatial queries
   - Check data completeness

---

## 📚 ADDITIONAL RESOURCES

### APIs
- **IMD API**: [https://mausam.imd.gov.in/responsive/apis.php](https://mausam.imd.gov.in/responsive/apis.php)
- **Indian Weather API**: [https://indianapi.in/weather-api](https://indianapi.in/weather-api)

### Python Libraries
- **imdlib**: IMD data processing
- **pandas**: Data manipulation
- **geopandas**: Geospatial data
- **psycopg2**: PostgreSQL connection

### Documentation
- **IMD**: [https://mausam.imd.gov.in](https://mausam.imd.gov.in)
- **Data.gov.in**: [https://data.gov.in](https://data.gov.in)
- **IIT Delhi**: [https://hydrosense.iitd.ac.in](https://hydrosense.iitd.ac.in)

---

**Status**: Ready to integrate real datasets  
**Estimated Time**: 2-3 hours for initial setup  
**Data Volume**: ~10-50 MB (compressed)  
**Update Frequency**: Daily (automated)
