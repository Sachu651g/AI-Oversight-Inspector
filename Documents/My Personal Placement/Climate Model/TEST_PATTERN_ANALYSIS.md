# Pattern Analysis Testing Guide

## ✅ Testing Your Two Requirements

### Requirement 1: Auto-Refresh Every 10 Minutes

**Test Steps**:

1. **Start the backend server**:
```bash
cd backend
npm run dev
```

2. **Start auto-refresh for Chennai**:
```bash
curl -X POST http://localhost:5000/api/pattern/auto-refresh/start \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "weatherParameters": {
      "rainfall": 120,
      "windSpeed": 65,
      "humidity": 92,
      "soilMoisture": 85,
      "temperature": 28,
      "earthquakeMagnitude": 0
    }
  }'
```

3. **Expected Response**:
```json
{
  "success": true,
  "message": "Auto-refresh started for Chennai. Analysis will run every 10 minutes.",
  "data": {
    "location": "Chennai",
    "refreshInterval": "10 minutes",
    "nextRefresh": "2026-04-15T19:00:00.000Z"
  }
}
```

4. **Check status**:
```bash
curl http://localhost:5000/api/pattern/auto-refresh/status
```

5. **Expected Response**:
```json
{
  "success": true,
  "data": {
    "activeLocations": ["Chennai"],
    "count": 1,
    "refreshInterval": "10 minutes"
  }
}
```

6. **Wait 10 minutes and check logs** - You should see:
```
Auto-refreshing pattern analysis for Chennai
Pattern analysis completed for Chennai - Risk: High
```

7. **Stop auto-refresh**:
```bash
curl -X POST http://localhost:5000/api/pattern/auto-refresh/stop \
  -H "Content-Type: application/json" \
  -d '{"location": "Chennai"}'
```

---

### Requirement 2: Pattern-Based Pinpoint Prediction

**Test Steps**:

1. **Analyze patterns for Chennai**:
```bash
curl -X POST http://localhost:5000/api/pattern/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "weatherParameters": {
      "rainfall": 120,
      "windSpeed": 65,
      "humidity": 92,
      "soilMoisture": 85,
      "temperature": 28,
      "earthquakeMagnitude": 0
    }
  }'
```

2. **Expected Response** (with pinpoint prediction):
```json
{
  "success": true,
  "data": {
    "location": "Chennai",
    "predictedRiskLevel": "High",
    "confidence": 85,
    "patternMatch": 72,
    "historicalDisasters": 5,
    "recommendation": "HIGH ALERT: Pattern analysis shows 72% match with disaster conditions. Historical data shows 5 past events. Prepare evacuation resources and issue public advisory.",
    "nextAnalysisTime": "2026-04-15T19:00:00.000Z",
    "analysisTimestamp": "2026-04-15T18:50:00.000Z"
  }
}
```

3. **Test with different parameters** (Low risk):
```bash
curl -X POST http://localhost:5000/api/pattern/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "weatherParameters": {
      "rainfall": 15,
      "windSpeed": 25,
      "humidity": 70,
      "soilMoisture": 40,
      "temperature": 30,
      "earthquakeMagnitude": 0
    }
  }'
```

4. **Expected Response** (Low risk):
```json
{
  "success": true,
  "data": {
    "location": "Chennai",
    "predictedRiskLevel": "Low",
    "confidence": 75,
    "patternMatch": 15,
    "historicalDisasters": 5,
    "recommendation": "NORMAL: Current conditions within normal parameters. Pattern match: 15%. Continue routine monitoring.",
    "nextAnalysisTime": "2026-04-15T19:00:00.000Z",
    "analysisTimestamp": "2026-04-15T18:50:00.000Z"
  }
}
```

5. **Test with Critical conditions**:
```bash
curl -X POST http://localhost:5000/api/pattern/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "weatherParameters": {
      "rainfall": 180,
      "windSpeed": 120,
      "humidity": 98,
      "soilMoisture": 95,
      "temperature": 26,
      "earthquakeMagnitude": 6.5
    }
  }'
```

6. **Expected Response** (Critical risk):
```json
{
  "success": true,
  "data": {
    "location": "Chennai",
    "predictedRiskLevel": "Critical",
    "confidence": 90,
    "patternMatch": 95,
    "historicalDisasters": 5,
    "recommendation": "IMMEDIATE ACTION REQUIRED: Current conditions match 95% of historical disaster patterns. This area has experienced 5 disasters in the past 10 years. Initiate evacuation protocols immediately.",
    "nextAnalysisTime": "2026-04-15T19:00:00.000Z",
    "analysisTimestamp": "2026-04-15T18:50:00.000Z"
  }
}
```

---

## 🔍 What Makes It "Pinpoint"?

### 1. Geospatial Precision
- Uses PostGIS for accurate distance calculations
- Searches within 50km radius of exact coordinates
- Accounts for local geography

### 2. Temporal Accuracy
- Compares current month with historical monthly patterns
- Accounts for seasonal variations (monsoons, summer, etc.)
- Uses 5 years of historical data

### 3. Parameter Matching
- Calculates deviation from historical averages
- Weights multiple parameters (rainfall, wind, humidity, etc.)
- Identifies unusual patterns that match disaster conditions

### 4. Disaster Correlation
- Tracks historical disasters at specific locations
- Correlates current conditions with past disaster patterns
- Provides disaster frequency context

### 5. Confidence Scoring
- Based on data quality (number of historical data points)
- Pattern match strength
- Historical disaster count
- Provides transparency on prediction reliability

---

## 📊 Verification Checklist

### Auto-Refresh (10 Minutes)
- [ ] Start auto-refresh API works
- [ ] Status API shows active location
- [ ] Logs show refresh every 10 minutes
- [ ] Stop auto-refresh API works
- [ ] Multiple locations supported

### Pattern-Based Prediction
- [ ] Analysis API returns predictions
- [ ] Pattern match score calculated (0-100%)
- [ ] Historical disasters counted
- [ ] Confidence score provided
- [ ] Recommendations generated
- [ ] Different risk levels work (Low, Medium, High, Critical)
- [ ] Cache works (10-minute TTL)

### Pinpoint Accuracy
- [ ] Geospatial queries work (PostGIS)
- [ ] Monthly patterns compared
- [ ] Parameter deviations calculated
- [ ] Disaster correlation working
- [ ] Location-specific results

---

## 🎯 Success Criteria

Both requirements are met if:

1. ✅ **Auto-refresh runs every 10 minutes** without manual intervention
2. ✅ **Predictions are based on historical patterns** for the specific location
3. ✅ **Pattern match score** shows how well current conditions match disaster patterns
4. ✅ **Confidence score** indicates prediction reliability
5. ✅ **Recommendations** are actionable and risk-appropriate

---

## 🚀 Quick Start

```bash
# 1. Start backend
cd backend
npm run dev

# 2. In another terminal, test pattern analysis
curl -X POST http://localhost:5000/api/pattern/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "weatherParameters": {
      "rainfall": 120,
      "windSpeed": 65,
      "humidity": 92,
      "soilMoisture": 85,
      "temperature": 28
    }
  }'

# 3. Start auto-refresh
curl -X POST http://localhost:5000/api/pattern/auto-refresh/start \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "weatherParameters": {
      "rainfall": 120,
      "windSpeed": 65,
      "humidity": 92,
      "soilMoisture": 85,
      "temperature": 28
    }
  }'

# 4. Check status
curl http://localhost:5000/api/pattern/auto-refresh/status

# 5. Wait 10 minutes and check logs for auto-refresh
```

---

**Status**: Ready to test  
**Requirements**: PostgreSQL with PostGIS, Node.js, npm  
**Estimated Test Time**: 15 minutes (including 10-minute wait for auto-refresh)
