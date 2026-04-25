# Climate Simulation Model - Design Document

## System Architecture Overview

The Climate Simulation Model is built as a backend service with a modular, scalable architecture designed to support real-time disaster simulation and decision support.

### Architecture Pattern: Microservices-Ready Monolith

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Google Stitch)                │
│              (Separate UI - Not part of this spec)          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Router                     │
│              (Express.js - Request routing)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Risk API   │  │ Simulation   │  │  Alert API   │
│  Controller  │  │  Controller  │  │  Controller  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────────────────────────────────────────┐
│           Service Layer (Business Logic)         │
├──────────────────────────────────────────────────┤
│ • RiskClassificationService                      │
│ • SimulationEngineService                        │
│ • EvacuationRoutingService                       │
│ • DecisionBriefService (Claude AI)               │
│ • AuditTrailService                              │
│ • AlertDispatchService                           │
└──────────────────────────────────────────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────────────────────────────────────────┐
│           Data Access Layer (DAL)                │
├──────────────────────────────────────────────────┤
│ • ZoneRepository                                 │
│ • SimulationRepository                           │
│ • AuditTrailRepository                           │
│ • ParameterRepository                            │
└──────────────────────────────────────────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │    Redis     │  │  External    │
│  (Primary)   │  │   (Cache)    │  │   APIs       │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Core Components

### 1. Risk Classification Engine

**Purpose**: Classify disaster risk for each zone based on weather parameters

**Technology**: XGBoost ML model + Node.js wrapper

**Algorithm Flow**:
```
Input: Weather Parameters (rainfall, wind speed, humidity, soil saturation, temp)
  ↓
Validate Parameters (range checking)
  ↓
Load Zone Characteristics (elevation, proximity to water, soil type, building density)
  ↓
Feature Engineering (combine weather + zone data)
  ↓
XGBoost Model Inference
  ↓
Output: Risk Level (Low/Medium/High/Critical) + Risk Score (0-100) + Confidence (0-100%)
```

**Implementation**:
```javascript
class RiskClassificationService {
  async classifyZones(weatherParams, zoneIds) {
    // 1. Validate parameters
    this.validateWeatherParams(weatherParams);
    
    // 2. Load zone characteristics from DB
    const zones = await this.zoneRepository.getZones(zoneIds);
    
    // 3. Feature engineering
    const features = this.engineerFeatures(weatherParams, zones);
    
    // 4. Run XGBoost model
    const predictions = await this.xgboostModel.predict(features);
    
    // 5. Map predictions to risk levels
    const classifications = this.mapToRiskLevels(predictions);
    
    // 6. Cache results
    await this.cache.set(`risk:${timestamp}`, classifications, 300);
    
    return classifications;
  }
}
```

**Performance**: < 2 seconds for 1000 zones

---

### 2. Disaster Simulation Engine

**Purpose**: Generate 12-frame hour-by-hour disaster evolution animation

**Algorithm**: Rule-based propagation model

**Simulation Logic**:
```
Frame 0 (T+0h): Initial risk classification
  ↓
For each hour (Frame 1-12):
  ├─ Get current zone risk levels
  ├─ Apply propagation rules:
  │  ├─ High-risk zones spread to adjacent zones
  │  ├─ Affected population increases over time
  │  └─ Infrastructure vulnerability increases
  ├─ Calculate affected population for this frame
  ├─ Store frame data
  └─ Move to next hour
  ↓
Output: 12 frames with zone risk evolution
```

**Implementation**:
```javascript
class SimulationEngineService {
  async generateSimulation(weatherParams, zoneIds) {
    const frames = [];
    let currentRisks = await this.classifyZones(weatherParams, zoneIds);
    
    for (let hour = 0; hour < 12; hour++) {
      // Create frame
      const frame = {
        frameNumber: hour,
        timestamp: `T+${hour}h`,
        zoneRisks: currentRisks,
        affectedPopulation: this.calculateAffectedPopulation(currentRisks),
        infrastructureAtRisk: this.identifyInfrastructure(currentRisks)
      };
      
      frames.push(frame);
      
      // Propagate risk to adjacent zones
      currentRisks = this.propagateRisk(currentRisks, zoneIds);
    }
    
    return frames;
  }
  
  propagateRisk(currentRisks, zoneIds) {
    // Rule-based propagation
    const newRisks = { ...currentRisks };
    
    for (const zoneId of zoneIds) {
      if (currentRisks[zoneId].level === 'High' || 'Critical') {
        // Get adjacent zones
        const adjacent = this.getAdjacentZones(zoneId);
        
        // Increase risk in adjacent zones
        for (const adjZone of adjacent) {
          newRisks[adjZone].score += 10;
          newRisks[adjZone].level = this.scoreToLevel(newRisks[adjZone].score);
        }
      }
    }
    
    return newRisks;
  }
}
```

**Performance**: < 5 seconds for 12 frames

---

### 3. Evacuation Route Optimization

**Purpose**: Calculate equity-weighted evacuation routes

**Algorithm**: Modified Dijkstra with equity weighting

**Route Calculation**:
```
Input: High-risk zones, safe assembly points, vulnerability scores
  ↓
For each high-risk zone:
  ├─ Find 3 shortest paths to assembly points
  ├─ Apply equity weighting (prioritize vulnerable zones)
  ├─ Avoid predicted hazardous areas
  ├─ Calculate capacity constraints
  └─ Rank routes by efficiency + equity
  ↓
Output: 3 alternative routes per zone with details
```

**Implementation**:
```javascript
class EvacuationRoutingService {
  async calculateRoutes(highRiskZones, assemblyPoints) {
    const routes = [];
    
    for (const zone of highRiskZones) {
      const vulnerabilityScore = await this.getVulnerabilityScore(zone);
      
      // Find 3 shortest paths
      const paths = this.dijkstra(zone, assemblyPoints, 3);
      
      // Apply equity weighting
      const weightedPaths = paths.map(path => ({
        ...path,
        equityScore: vulnerabilityScore * 0.4 + path.efficiency * 0.6,
        avoidHazards: this.removeHazardousAreas(path),
        capacity: this.calculateCapacity(path)
      }));
      
      // Sort by equity score
      weightedPaths.sort((a, b) => b.equityScore - a.equityScore);
      
      routes.push({
        zone,
        alternatives: weightedPaths.slice(0, 3)
      });
    }
    
    return routes;
  }
}
```

**Performance**: < 3 seconds for 100 zones

---

### 4. Claude AI Decision Brief Service

**Purpose**: Generate AI-powered decision briefs

**Integration**: Anthropic Claude API

**Prompt Engineering**:
```
System Prompt:
"You are an emergency management AI assistant. Generate concise, actionable decision briefs for disaster response."

User Prompt Template:
"
Situation:
- Zone: {zoneName}
- Risk Level: {riskLevel}
- Affected Population: {population}
- Weather: {weatherSummary}

Generate a decision brief with:
1. Situation summary (2-3 sentences)
2. Immediate actions (3-5 bullet points)
3. Hospital pre-positioning checklist
4. Evacuation priority ranking
5. Estimated impact window

Language: {language}
"
```

**Implementation**:
```javascript
class DecisionBriefService {
  async generateBrief(riskData, language = 'English') {
    try {
      const prompt = this.buildPrompt(riskData, language);
      
      const response = await this.claudeClient.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      const brief = response.content[0].text;
      const confidenceScore = this.calculateConfidence(riskData);
      
      // Log to audit trail
      await this.auditTrailService.log({
        type: 'DECISION_BRIEF_GENERATED',
        brief,
        confidenceScore,
        timestamp: new Date()
      });
      
      return { brief, confidenceScore };
    } catch (error) {
      // Fallback to template-based brief
      return this.generateTemplateBrief(riskData, language);
    }
  }
  
  generateTemplateBrief(riskData, language) {
    // Rule-based fallback when Claude API unavailable
    const templates = {
      'Critical': 'CRITICAL ALERT: Immediate evacuation required...',
      'High': 'HIGH RISK: Prepare evacuation procedures...',
      'Medium': 'MEDIUM RISK: Monitor situation closely...',
      'Low': 'LOW RISK: Continue normal operations...'
    };
    
    return {
      brief: templates[riskData.riskLevel],
      confidenceScore: 60
    };
  }
}
```

**Performance**: < 10 seconds (including API latency)

---

### 5. Audit Trail Service

**Purpose**: Maintain tamper-proof audit trail with hash chain

**Data Structure**:
```javascript
{
  recordId: UUID,
  timestamp: ISO8601,
  zone: string,
  riskLevel: string,
  decisionBrief: string,
  userId: string,
  parameters: object,
  hash: SHA256,
  previousHash: SHA256,
  status: 'ACTIVE' | 'TAMPERED'
}
```

**Hash Chain Implementation**:
```javascript
class AuditTrailService {
  async logAlert(alertData) {
    // Get previous record
    const previousRecord = await this.getLastRecord();
    
    // Create new record
    const record = {
      recordId: uuid(),
      timestamp: new Date(),
      ...alertData,
      previousHash: previousRecord?.hash || 'GENESIS'
    };
    
    // Generate hash
    record.hash = this.generateHash(record);
    
    // Store in append-only database
    await this.auditRepository.append(record);
    
    return record;
  }
  
  generateHash(record) {
    const data = JSON.stringify({
      recordId: record.recordId,
      timestamp: record.timestamp,
      zone: record.zone,
      riskLevel: record.riskLevel,
      userId: record.userId,
      previousHash: record.previousHash
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  async verifyIntegrity() {
    const records = await this.auditRepository.getAll();
    let previousHash = 'GENESIS';
    
    for (const record of records) {
      const expectedHash = this.generateHash({
        ...record,
        previousHash
      });
      
      if (record.hash !== expectedHash) {
        record.status = 'TAMPERED';
        await this.auditRepository.update(record);
      }
      
      previousHash = record.hash;
    }
  }
}
```

**Performance**: < 5 seconds for 1000+ records

---

## API Endpoints

### Risk Classification Endpoints

```
POST /api/risk/classify
├─ Input: { weatherParams, zoneIds }
├─ Output: { zones: [{ zoneId, riskLevel, riskScore, confidence }] }
└─ Performance: < 2 seconds

POST /api/risk/update
├─ Input: { weatherParams }
├─ Output: { updated: true, timestamp }
└─ Performance: < 1 second
```

### Simulation Endpoints

```
POST /api/simulate/generate
├─ Input: { weatherParams, zoneIds }
├─ Output: { simulationId, frames: [12 frames] }
└─ Performance: < 5 seconds

GET /api/simulate/frames/:simulationId
├─ Input: { frameNumber }
├─ Output: { frame data }
└─ Performance: < 500ms

GET /api/simulate/history
├─ Input: { limit, offset }
├─ Output: { simulations: [...] }
└─ Performance: < 1 second
```

### Decision Brief Endpoints

```
POST /api/alert/generate
├─ Input: { riskData, language }
├─ Output: { brief, confidenceScore }
└─ Performance: < 10 seconds

POST /api/alert/dispatch
├─ Input: { alertId, channels: ['SMS', 'Email', 'WhatsApp'] }
├─ Output: { dispatchId, status }
└─ Performance: < 2 seconds

GET /api/alert/status/:dispatchId
├─ Input: {}
├─ Output: { status, deliveryStatus }
└─ Performance: < 500ms
```

### Evacuation Route Endpoints

```
POST /api/evacuation-routes/calculate
├─ Input: { highRiskZones, assemblyPoints }
├─ Output: { routes: [{ zone, alternatives: [...] }] }
└─ Performance: < 3 seconds

GET /api/evacuation-routes/:zoneId
├─ Input: {}
├─ Output: { routes: [...] }
└─ Performance: < 500ms

POST /api/evacuation-routes/optimize
├─ Input: { currentRoutes, constraints }
├─ Output: { optimizedRoutes: [...] }
└─ Performance: < 3 seconds
```

### Audit Trail Endpoints

```
GET /api/audit-trail
├─ Input: { limit, offset, filters }
├─ Output: { records: [...], total }
└─ Performance: < 1 second

POST /api/audit-trail/verify
├─ Input: { recordId }
├─ Output: { verified: boolean, status }
└─ Performance: < 5 seconds

GET /api/transparency
├─ Input: {}
├─ Output: { metrics: { totalAlerts, acknowledged%, avgResponseTime } }
└─ Performance: < 500ms
```

---

## Database Schema

### PostgreSQL Tables

```sql
-- Zones table
CREATE TABLE zones (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  coordinates GEOMETRY(POLYGON),
  population INTEGER,
  elevation FLOAT,
  proximity_to_water FLOAT,
  soil_type VARCHAR(50),
  building_density FLOAT,
  created_at TIMESTAMP
);

-- Risk Classifications table
CREATE TABLE risk_classifications (
  id UUID PRIMARY KEY,
  zone_id UUID REFERENCES zones(id),
  risk_level VARCHAR(20),
  risk_score FLOAT,
  confidence FLOAT,
  weather_params JSONB,
  timestamp TIMESTAMP,
  created_at TIMESTAMP
);

-- Simulations table
CREATE TABLE simulations (
  id UUID PRIMARY KEY,
  weather_params JSONB,
  frames JSONB,
  affected_population INTEGER,
  created_at TIMESTAMP,
  created_by UUID
);

-- Simulation Frames table
CREATE TABLE simulation_frames (
  id UUID PRIMARY KEY,
  simulation_id UUID REFERENCES simulations(id),
  frame_number INTEGER,
  timestamp VARCHAR(10),
  zone_risks JSONB,
  affected_population INTEGER,
  infrastructure_at_risk JSONB
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  zone_id UUID REFERENCES zones(id),
  risk_level VARCHAR(20),
  decision_brief TEXT,
  confidence FLOAT,
  language VARCHAR(20),
  created_at TIMESTAMP,
  created_by UUID
);

-- Audit Trail table (Append-only)
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY,
  record_id UUID UNIQUE,
  timestamp TIMESTAMP,
  zone_id UUID,
  risk_level VARCHAR(20),
  decision_brief TEXT,
  user_id UUID,
  parameters JSONB,
  hash VARCHAR(64),
  previous_hash VARCHAR(64),
  status VARCHAR(20),
  created_at TIMESTAMP
);

-- Evacuation Routes table
CREATE TABLE evacuation_routes (
  id UUID PRIMARY KEY,
  zone_id UUID REFERENCES zones(id),
  assembly_point_id UUID,
  distance FLOAT,
  estimated_time INTEGER,
  capacity INTEGER,
  route_geometry GEOMETRY(LINESTRING),
  equity_score FLOAT,
  created_at TIMESTAMP
);

-- Parameters History table
CREATE TABLE parameter_history (
  id UUID PRIMARY KEY,
  rainfall FLOAT,
  wind_speed FLOAT,
  humidity FLOAT,
  soil_saturation FLOAT,
  temperature FLOAT,
  source VARCHAR(50),
  user_id UUID,
  timestamp TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## Caching Strategy (Redis)

```javascript
// Cache keys and TTLs
const CACHE_KEYS = {
  RISK_SCORES: 'risk:scores:{timestamp}',      // TTL: 5 min
  SIMULATION: 'sim:{simulationId}',             // TTL: 1 hour
  ROUTES: 'routes:{zoneId}',                    // TTL: 30 min
  VULNERABILITY: 'vuln:{zoneId}',               // TTL: 24 hours
  ZONE_DATA: 'zone:{zoneId}',                   // TTL: 24 hours
  PARAMETERS: 'params:{timestamp}'              // TTL: 5 min
};

// Cache invalidation on parameter change
async function invalidateCache(changedParams) {
  await redis.del('risk:scores:*');
  await redis.del('sim:*');
  await redis.del('routes:*');
  await redis.del('params:*');
}
```

---

## Error Handling & Fallbacks

```javascript
class ErrorHandler {
  async handleRiskClassificationError(error) {
    logger.error('Risk classification failed', error);
    
    // Fallback: Use conservative estimates
    return {
      riskLevel: 'Medium',
      riskScore: 50,
      confidence: 30,
      fallback: true
    };
  }
  
  async handleClaudeAPIError(error) {
    logger.error('Claude API failed', error);
    
    // Fallback: Use template-based brief
    return this.generateTemplateBrief();
  }
  
  async handleDatabaseError(error) {
    logger.error('Database error', error);
    
    // Retry with exponential backoff
    return this.retryWithBackoff(3);
  }
}
```

---

## Security Architecture

```
┌─────────────────────────────────────────┐
│         API Request                     │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Authentication (OAuth 2.0 / JWT)     │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Authorization (Role-based)           │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Rate Limiting & Request Signing      │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Business Logic (Encrypted)           │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Data Encryption (AES-256)            │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Audit Logging                        │
└─────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│         Docker Container                 │
├──────────────────────────────────────────┤
│  Node.js Application                     │
│  ├─ Express Server                       │
│  ├─ Service Layer                        │
│  └─ Data Access Layer                    │
└──────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │PostgreSQL   │ Redis   │   │External │
    │ Database    │ Cache   │   │ APIs    │
    └─────────┘   └─────────┘   └─────────┘
```

---

## Performance Optimization

1. **Caching**: Redis for frequently accessed data (80%+ hit rate target)
2. **Database Indexing**: Indexes on zone_id, timestamp, risk_level
3. **Connection Pooling**: PostgreSQL connection pool (10-20 connections)
4. **Async Processing**: Queue-based alert dispatch (Bull.js)
5. **Batch Operations**: Batch risk classifications for multiple zones
6. **CDN**: Static assets served via CDN

---

## Testing Strategy

### Unit Tests
- Risk classification algorithm
- Vulnerability score calculation
- Route optimization logic
- Hash chain generation

### Integration Tests
- End-to-end simulation generation
- Claude API integration with fallback
- Database persistence and retrieval
- SMS dispatch with tracking

### Property-Based Tests
- Risk classification invariants
- Simulation consistency
- Route optimization properties
- Audit trail integrity

### Performance Tests
- Risk classification < 2 seconds
- Simulation generation < 5 seconds
- Concurrent request handling (100+)
- Cache effectiveness

---

## Implementation Phases

### Phase 1: Core Services (Week 1)
- Risk Classification Service
- Simulation Engine Service
- Database setup

### Phase 2: Integration (Week 2)
- Claude AI integration
- Evacuation Routing Service
- Audit Trail Service

### Phase 3: APIs & Deployment (Week 3)
- REST API endpoints
- Error handling & fallbacks
- Docker deployment

### Phase 4: Testing & Optimization (Week 4)
- Unit & integration tests
- Performance optimization
- Security hardening

---

**Design Document Complete**

This design is ready for implementation. The backend is UI-agnostic and will serve APIs that the Google Stitch frontend will consume.

