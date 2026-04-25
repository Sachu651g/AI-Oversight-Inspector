# 🚀 Climate Guardian - Complete Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **PostgreSQL** >= 14 ([Download](https://www.postgresql.org/download/))
- **Redis** >= 6.0 ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional (for full features):
- **Claude API Key** from Anthropic ([Get API Key](https://console.anthropic.com/))
- **Twilio Account** for SMS ([Sign Up](https://www.twilio.com/try-twilio))

---

## 📋 Step-by-Step Setup

### **Step 1: Clone the Repository**

```bash
git clone <repository-url>
cd climate-guardian
```

---

### **Step 2: Database Setup**

#### 2.1 Create Database

```bash
# Start PostgreSQL service (if not running)
# Windows: Start from Services
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database
psql -U postgres -c "CREATE DATABASE climate_guardian;"

# Enable PostGIS extension
psql -U postgres -d climate_guardian -c "CREATE EXTENSION postgis;"
```

#### 2.2 Run Schema

```bash
psql -U postgres -d climate_guardian -f database/schema.sql
```

#### 2.3 Load Seed Data

```bash
psql -U postgres -d climate_guardian -f database/seeds/01_zones.sql
```

#### 2.4 Verify Database

```bash
psql -U postgres -d climate_guardian -c "\dt"
```

You should see 13 tables listed.

---

### **Step 3: Redis Setup**

#### 3.1 Start Redis Server

```bash
# Windows: Start from Services or run redis-server.exe
# Mac: brew services start redis
# Linux: sudo systemctl start redis

# Or run directly:
redis-server
```

#### 3.2 Verify Redis

```bash
redis-cli ping
# Should return: PONG
```

---

### **Step 4: Backend Setup**

#### 4.1 Navigate to Backend

```bash
cd backend
```

#### 4.2 Install Dependencies

```bash
npm install
```

This will install:
- Express, TypeScript, Node.js types
- PostgreSQL client (pg)
- Redis client (ioredis)
- Winston (logging)
- Helmet, CORS (security)
- And more...

#### 4.3 Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Minimum Required Configuration:**

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=climate_guardian
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (generate a random secret)
JWT_SECRET=your_random_secret_here_change_in_production

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Optional Configuration (for full features):**

```env
# Claude AI (optional - uses template fallback if not provided)
CLAUDE_API_KEY=your_claude_api_key_here

# Twilio SMS (optional - skips SMS if not provided)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### 4.4 Start Backend

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm run build
npm start
```

#### 4.5 Verify Backend

```bash
# In a new terminal
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

### **Step 5: Frontend Setup**

#### 5.1 Navigate to Frontend

```bash
# Open a new terminal
cd frontend
```

#### 5.2 Install Dependencies

```bash
npm install
```

This will install:
- React, TypeScript
- Redux Toolkit
- Tailwind CSS
- Leaflet (maps)
- Recharts (charts)
- And more...

#### 5.3 Start Frontend

```bash
npm run dev
```

#### 5.4 Open in Browser

```
http://localhost:3000
```

You should see the Climate Guardian dashboard!

---

## 🧪 Testing the System

### **Test 1: Health Check**

```bash
curl http://localhost:5000/health
```

**Expected:** Status "healthy" with database and redis connected.

---

### **Test 2: Risk Classification**

```bash
curl -X POST http://localhost:5000/api/risk/classify \
  -H "Content-Type: application/json" \
  -d '{
    "weatherParams": {
      "rainfall": 45.0,
      "windSpeed": 85,
      "humidity": 88,
      "soilMoisture": 75,
      "temperature": 35,
      "earthquakeMagnitude": 0
    },
    "zoneIds": ["zone1", "zone2", "zone3"]
  }'
```

**Expected:** Risk classifications for 3 zones with risk levels, scores, and confidence.

---

### **Test 3: Simulation Generation**

```bash
curl -X POST http://localhost:5000/api/simulate/generate \
  -H "Content-Type: application/json" \
  -d '{
    "weatherParams": {
      "rainfall": 65.0,
      "windSpeed": 95,
      "humidity": 92,
      "soilMoisture": 88,
      "temperature": 36,
      "earthquakeMagnitude": 0
    },
    "zoneIds": ["zone1", "zone2"]
  }'
```

**Expected:** 12-frame simulation with disaster evolution.

---

### **Test 4: Decision Brief**

```bash
curl -X POST http://localhost:5000/api/alert/generate \
  -H "Content-Type: application/json" \
  -d '{
    "riskData": {
      "zoneName": "Marina Beach",
      "riskLevel": "Critical",
      "affectedPopulation": 75000,
      "weatherSummary": "Heavy rainfall (65mm/hr), strong winds (95km/h)"
    },
    "language": "English"
  }'
```

**Expected:** AI-generated decision brief with situation summary and actions.

---

### **Test 5: Evacuation Routes**

```bash
curl -X POST http://localhost:5000/api/evacuation-routes/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "highRiskZones": [
      {
        "zoneId": "zone1",
        "zoneName": "Marina Beach",
        "riskLevel": "Critical",
        "riskScore": 95,
        "confidence": 90
      }
    ]
  }'
```

**Expected:** 3 evacuation routes with distances, times, and equity scores.

---

### **Test 6: Audit Trail**

```bash
curl http://localhost:5000/api/audit-trail?limit=10
```

**Expected:** List of audit records (may be empty initially).

---

## 🔧 Troubleshooting

### **Problem: Database connection failed**

**Solution:**
1. Check PostgreSQL is running: `psql -U postgres -c "SELECT 1;"`
2. Verify credentials in `.env` file
3. Check database exists: `psql -U postgres -l | grep climate_guardian`
4. Check PostGIS extension: `psql -U postgres -d climate_guardian -c "\dx"`

---

### **Problem: Redis connection failed**

**Solution:**
1. Check Redis is running: `redis-cli ping`
2. Verify Redis host/port in `.env` file
3. Start Redis: `redis-server`

---

### **Problem: Port already in use**

**Solution:**
1. Backend (5000): Change `PORT` in `.env`
2. Frontend (3000): Run `npm run dev -- --port 3001`

---

### **Problem: Module not found**

**Solution:**
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

---

### **Problem: TypeScript errors**

**Solution:**
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run type-check
```

---

### **Problem: Claude API not working**

**Solution:**
- System uses template fallback if Claude API key is not provided
- Check API key in `.env`: `CLAUDE_API_KEY=sk-ant-...`
- Verify API key is valid at https://console.anthropic.com/

---

### **Problem: SMS not sending**

**Solution:**
- System skips SMS if Twilio credentials are not provided
- Check credentials in `.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- Verify credentials at https://www.twilio.com/console

---

## 📊 Verify Installation

### **Backend Checklist**

- [ ] PostgreSQL running and database created
- [ ] Redis running
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Backend server running (`npm run dev`)
- [ ] Health check returns "healthy"
- [ ] API endpoints responding

### **Frontend Checklist**

- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Dashboard loads in browser
- [ ] No console errors

### **Database Checklist**

- [ ] Database created
- [ ] PostGIS extension enabled
- [ ] Schema loaded (13 tables)
- [ ] Seed data loaded (5 zones)

---

## 🎯 Next Steps

### **1. Explore the Dashboard**

Open `http://localhost:3000` and explore:
- Risk Map
- Simulation Player
- Alert Panel
- Decision Brief
- Evacuation Routes
- Audit Trail

### **2. Test API Endpoints**

See `backend/API_TESTING.md` for complete API testing guide.

### **3. Customize Configuration**

Edit `.env` files to customize:
- Database credentials
- Redis configuration
- API keys (Claude, Twilio)
- CORS origins
- Rate limiting

### **4. Add Sample Data**

Create more zones, assembly points, and infrastructure in the database.

### **5. Deploy to Production**

See deployment section in `PROJECT_COMPLETE.md`.

---

## 📚 Documentation

### **For Developers**
- `backend/README.md` - Backend setup and architecture
- `backend/API_TESTING.md` - Complete API testing guide
- `frontend/FRONTEND_SETUP.md` - Frontend setup guide
- `.kiro/specs/climate-simulation-model/design.md` - Technical design

### **For Designers**
- `README.md` - Complete UI specifications
- `GOOGLE_STITCH_DESIGN.md` - Design system
- `QUICK_REFERENCE.md` - Quick reference

### **For Project Managers**
- `PROJECT_COMPLETE.md` - Project completion summary
- `BUILD_STATUS.md` - Progress tracking
- `.kiro/specs/climate-simulation-model/requirements.md` - Requirements

---

## 🆘 Getting Help

### **Common Commands**

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
psql -U postgres -d climate_guardian -f database/schema.sql  # Load schema
psql -U postgres -d climate_guardian -f database/seeds/01_zones.sql  # Load seed data
psql -U postgres -d climate_guardian -c "\dt"  # List tables

# Redis
redis-server         # Start Redis
redis-cli ping       # Test Redis
redis-cli flushall   # Clear all cache (use with caution!)
```

---

## ✅ Installation Complete!

If you've completed all steps successfully, you should have:

✅ PostgreSQL database running with 13 tables  
✅ Redis cache running  
✅ Backend API running on port 5000  
✅ Frontend dashboard running on port 3000  
✅ All API endpoints responding  
✅ Health check returning "healthy"  

**Congratulations! Climate Guardian is now running!** 🎉

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Database
psql -U postgres -c "CREATE DATABASE climate_guardian;"
psql -U postgres -d climate_guardian -c "CREATE EXTENSION postgis;"
psql -U postgres -d climate_guardian -f database/schema.sql
psql -U postgres -d climate_guardian -f database/seeds/01_zones.sql

# 2. Redis
redis-server

# 3. Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev

# 5. Test
curl http://localhost:5000/health
# Open http://localhost:3000 in browser
```

---

**Built with ❤️ for a safer tomorrow**

*Climate Guardian - Because every second counts* 🌊

