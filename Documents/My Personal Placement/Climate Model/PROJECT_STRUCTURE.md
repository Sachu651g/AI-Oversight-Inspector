# Climate Guardian - Project Structure & Setup Guide

## 📁 Recommended Directory Structure

```
climate-guardian/
├── README.md                          # Main documentation (Google Stitch UI specs)
├── PROJECT_STRUCTURE.md               # This file
├── .gitignore
├── .env.example
│
├── frontend/                          # React + Google Stitch UI
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── components/                # Reusable components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── RiskMap.tsx
│   │   │   ├── SimulationPlayer.tsx
│   │   │   ├── AlertPanel.tsx
│   │   │   ├── DecisionBrief.tsx
│   │   │   ├── EvacuationRoutes.tsx
│   │   │   ├── AuditTrail.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Slider.tsx
│   │   │       └── Badge.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── AuditTrailFull.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   ├── useRiskData.ts
│   │   │   ├── useSimulation.ts
│   │   │   └── useAlert.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts                 # API client
│   │   │   ├── riskAPI.ts
│   │   │   ├── simulationAPI.ts
│   │   │   ├── alertAPI.ts
│   │   │   └── routingAPI.ts
│   │   │
│   │   ├── store/                     # Redux state management
│   │   │   ├── store.ts
│   │   │   ├── slices/
│   │   │   │   ├── riskSlice.ts
│   │   │   │   ├── simulationSlice.ts
│   │   │   │   ├── alertSlice.ts
│   │   │   │   └── uiSlice.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── themes/                    # Google Stitch themes
│   │   │   ├── default.ts
│   │   │   ├── googleStitch.ts
│   │   │   ├── lightMode.ts
│   │   │   ├── darkMode.ts
│   │   │   └── highContrast.ts
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── components.css
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── validators.ts
│   │   │
│   │   └── types/
│   │       ├── index.ts
│   │       ├── risk.ts
│   │       ├── alert.ts
│   │       └── simulation.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                           # Node.js + Express
│   ├── src/
│   │   ├── index.ts
│   │   ├── server.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── risk.routes.ts
│   │   │   ├── simulation.routes.ts
│   │   │   ├── alert.routes.ts
│   │   │   ├── routing.routes.ts
│   │   │   └── audit.routes.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── riskController.ts
│   │   │   ├── simulationController.ts
│   │   │   ├── alertController.ts
│   │   │   ├── routingController.ts
│   │   │   └── auditController.ts
│   │   │
│   │   ├── services/
│   │   │   ├── riskService.ts         # XGBoost model integration
│   │   │   ├── simulationService.ts   # Cellular automaton
│   │   │   ├── claudeService.ts       # Claude AI integration
│   │   │   ├── routingService.ts      # Evacuation routing
│   │   │   └── auditService.ts        # Audit trail
│   │   │
│   │   ├── models/
│   │   │   ├── Zone.ts
│   │   │   ├── Alert.ts
│   │   │   ├── Hospital.ts
│   │   │   ├── Shelter.ts
│   │   │   └── AuditLog.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── database.ts
│   │   │   ├── cache.ts
│   │   │   └── validators.ts
│   │   │
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── ml/
│   │   ├── models/
│   │   │   ├── xgboost_model.pkl      # Trained model
│   │   │   └── model_config.json
│   │   │
│   │   ├── scripts/
│   │   │   ├── train_model.py
│   │   │   ├── generate_mock_data.py
│   │   │   └── evaluate_model.py
│   │   │
│   │   └── requirements.txt
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── database/
│   ├── migrations/
│   │   ├── 001_create_zones.sql
│   │   ├── 002_create_alerts.sql
│   │   ├── 003_create_audit_log.sql
│   │   └── 004_create_hospitals.sql
│   │
│   ├── seeds/
│   │   ├── zones.sql
│   │   ├── hospitals.sql
│   │   └── shelters.sql
│   │
│   └── schema.sql
│
├── docs/
│   ├── API.md                         # API documentation
│   ├── ARCHITECTURE.md                # System architecture
│   ├── DEPLOYMENT.md                  # Deployment guide
│   ├── GOOGLE_STITCH_GUIDE.md         # Google Stitch integration
│   └── TESTING.md                     # Testing guide
│
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js >= 18.x
Python >= 3.9
PostgreSQL >= 14
Redis >= 6.x
```

### 1. Clone & Setup
```bash
git clone https://github.com/your-org/climate-guardian.git
cd climate-guardian

# Setup frontend
cd frontend
npm install

# Setup backend
cd ../backend
npm install
pip install -r ml/requirements.txt

# Setup database
cd ../database
psql -U postgres -f schema.sql
```

### 2. Environment Variables
```bash
# .env file
DATABASE_URL=postgresql://user:pass@localhost:5432/climate_db
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=your_anthropic_key
OPENWEATHER_API_KEY=your_openweather_key
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 3. Run Development Servers
```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: ML Service (if needed)
cd backend/ml
python -m uvicorn app:app --reload
```

---

## 📊 Data Models

### Zone
```typescript
interface Zone {
  id: string
  name: string
  district: string
  population: number
  coordinates: GeoJSON.Polygon
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  riskScore: number
  lastUpdated: Date
}
```

### Alert
```typescript
interface Alert {
  id: string
  zoneId: string
  timestamp: Date
  riskLevel: string
  aiConfidence: number
  claudeBrief: string
  status: 'Issued' | 'Acknowledged' | 'Resolved'
  acknowledgedBy?: string
  acknowledgedAt?: Date
  hashChain: string
}
```

### SimulationFrame
```typescript
interface SimulationFrame {
  frameNumber: number
  timestamp: string  // T+0h to T+12h
  zones: Zone[]
  affectedPopulation: number
  floodZones: GeoJSON.Polygon[]
}
```

---

## 🔌 API Endpoints

### Risk Intelligence
```
POST   /api/risk/classify
       Input: { rainfall, windSpeed, humidity, soilSaturation }
       Output: { riskLevel, confidence, affectedZones }

GET    /api/risk/zones
       Output: Zone[]

POST   /api/risk/update
       Input: { zoneId, parameters }
       Output: { success, updatedZone }
```

### Simulation
```
POST   /api/simulate/generate
       Input: { initialRiskMap, parameters }
       Output: { frames: SimulationFrame[], duration }

GET    /api/simulate/frames/:id
       Output: SimulationFrame
```

### Alerts
```
POST   /api/alert/generate
       Input: { zoneId, riskLevel, parameters }
       Output: { brief, actions, hospitals, routes }

POST   /api/alert/dispatch
       Input: { alertId, channels: ['SMS', 'Email', 'WhatsApp'] }
       Output: { success, deliveryStatus }

GET    /api/audit-trail
       Output: Alert[]
```

### Routing
```
GET    /api/evacuation-routes
       Input: { zoneId, destination }
       Output: { routes: Route[], optimized: Route }
```

---

## 🎨 Google Stitch Integration

### Theme System
```typescript
// themes/googleStitch.ts
export const googleStitchTheme = {
  colors: {
    primary: '#2196F3',
    secondary: '#9C27B0',
    success: '#4CAF50',
    warning: '#FFC107',
    danger: '#F44336',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
}
```

### Component Library
All components should be:
- ✅ Headless (no built-in styling)
- ✅ Theme-aware (accept theme prop)
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Responsive (mobile-first)
- ✅ Documented (Storybook)

---

## 🧪 Testing

### Frontend Tests
```bash
npm run test                    # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

### Backend Tests
```bash
npm run test                    # Run all tests
npm run test:integration       # Integration tests
npm run test:e2e               # End-to-end tests
```

---

## 📦 Deployment

### Docker
```bash
# Build images
docker-compose build

# Run containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### Cloud Deployment
- AWS: EC2 + RDS + S3
- Azure: App Service + SQL Database + Blob Storage
- GCP: Compute Engine + Cloud SQL + Cloud Storage

---

## 📚 Documentation

- **API.md** - Complete API reference
- **ARCHITECTURE.md** - System design & data flow
- **GOOGLE_STITCH_GUIDE.md** - UI design specifications
- **DEPLOYMENT.md** - Production deployment guide
- **TESTING.md** - Testing strategies & coverage

---

## 🔄 Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**
   - Follow code style guide
   - Write tests
   - Update documentation

3. **Commit & push**
   ```bash
   git commit -m "feat: add your feature"
   git push origin feature/your-feature
   ```

4. **Create pull request**
   - Link to issue
   - Describe changes
   - Request review

5. **Merge to main**
   - All tests pass
   - Code review approved
   - CI/CD pipeline succeeds

---

## 🎯 Next Steps

1. **Setup project structure** (this guide)
2. **Create Google Stitch design** (use README.md specs)
3. **Implement frontend components**
4. **Build backend APIs**
5. **Integrate ML models**
6. **Test end-to-end**
7. **Deploy to production**

---

**Ready to build? Start with the frontend setup and Google Stitch design!** 🚀
