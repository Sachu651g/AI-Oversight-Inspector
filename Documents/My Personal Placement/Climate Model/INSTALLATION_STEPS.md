# 🚀 Climate Guardian - Installation Steps

**Complete step-by-step installation guide for Climate Guardian**

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- ✅ **Node.js 18+** and **npm 9+**
- ✅ **PostgreSQL 14+** with **PostGIS extension**
- ✅ **Redis 7+**
- ✅ **Git**

### Check Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be 9.0.0 or higher

# Check PostgreSQL version
psql --version  # Should be 14.0 or higher

# Check Redis version
redis-server --version  # Should be 7.0.0 or higher
```

---

## 🔧 Step 1: Clone Repository

```bash
git clone <repository-url>
cd climate-guardian
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Start PostgreSQL

```bash
# Windows (if not running as service)
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start

# Linux/Mac
sudo service postgresql start
# or
brew services start postgresql
```

### 2.2 Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE climate_guardian;
\c climate_guardian
CREATE EXTENSION postgis;
\q
```

### 2.3 Run Schema Migration

```bash
# From project root
psql -U postgres -d climate_guardian -f database/schema.sql
```

### 2.4 Load Seed Data

```bash
psql -U postgres -d climate_guardian -f database/seeds/01_zones.sql
```

### 2.5 Verify Database Setup

```bash
psql -U postgres -d climate_guardian -c "SELECT COUNT(*) FROM zones;"
# Should return: count > 0
```

---

## 🔴 Step 3: Redis Setup

### 3.1 Start Redis

```bash
# Windows
redis-server

# Linux/Mac
sudo service redis-server start
# or
brew services start redis
```

### 3.2 Verify Redis

```bash
redis-cli ping
# Should return: PONG
```

---

## 🔙 Step 4: Backend Setup

### 4.1 Install Dependencies

```bash
cd backend
npm install
```

**Expected output**: All dependencies installed successfully

### 4.2 Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your credentials
# Use your preferred text editor (notepad, vim, nano, code, etc.)
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Required Environment Variables**:

```env
# Server
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=climate_guardian
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_MAX_CONNECTIONS=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Claude AI (Optional - uses template fallback if not provided)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Twilio (Optional - for SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# SendGrid (Optional - for email)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=alerts@climateguardian.org

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### 4.3 Build Backend

```bash
npm run build
```

**Expected output**: TypeScript compilation successful

### 4.4 Start Backend (Development)

```bash
npm run dev
```

**Expected output**:
```
🚀 Climate Guardian Backend running on port 5000
📍 Environment: development
🌐 API: http://localhost:5000/api
```

### 4.5 Verify Backend

Open a new terminal and run:

```bash
curl http://localhost:5000/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## 🎨 Step 5: Frontend Setup

### 5.1 Install Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

**Expected output**: All dependencies installed successfully

**Note**: If you see warnings about missing peer dependencies, run:
```bash
npm install --legacy-peer-deps
```

### 5.2 Start Frontend (Development)

```bash
npm run dev
```

**Expected output**:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 5.3 Verify Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

**Expected**: Climate Guardian dashboard loads successfully

---

## 🧪 Step 6: Test API Endpoints

### 6.1 Test Risk Classification

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
    "zoneIds": ["zone1", "zone2"]
  }'
```

**Expected**: JSON response with risk classifications

### 6.2 Test Simulation Generation

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

**Expected**: JSON response with 12-frame simulation

### 6.3 Test Decision Brief

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

**Expected**: JSON response with AI-generated decision brief

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"

**Solution**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env` file
3. Check database exists: `psql -U postgres -l | grep climate_guardian`

### Issue: "Cannot connect to Redis"

**Solution**:
1. Check Redis is running: `redis-cli ping`
2. Verify Redis host/port in `.env` file
3. Start Redis: `redis-server`

### Issue: "Port 5000 already in use"

**Solution**:
1. Change PORT in `.env` file to different port (e.g., 5001)
2. Or kill process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:5000 | xargs kill -9
   ```

### Issue: "Module not found" errors

**Solution**:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: "TypeScript compilation errors"

**Solution**:
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run type-check
```

### Issue: Frontend shows "Cannot connect to API"

**Solution**:
1. Verify backend is running on port 5000
2. Check CORS_ORIGIN in backend `.env` matches frontend URL
3. Check browser console for CORS errors

---

## ✅ Verification Checklist

After installation, verify all components:

- [ ] PostgreSQL running and database created
- [ ] Redis running and responding to PING
- [ ] Backend running on http://localhost:5000
- [ ] Backend health check returns "healthy"
- [ ] Frontend running on http://localhost:3000
- [ ] Frontend loads dashboard successfully
- [ ] API endpoints respond correctly
- [ ] No errors in backend logs
- [ ] No errors in frontend console

---

## 🚀 Next Steps

### For Development

1. **Backend Development**:
   ```bash
   cd backend
   npm run dev  # Auto-reload on file changes
   ```

2. **Frontend Development**:
   ```bash
   cd frontend
   npm run dev  # Hot module replacement
   ```

3. **View Logs**:
   ```bash
   # Backend logs
   tail -f backend/logs/combined.log
   
   # Frontend logs
   # Check browser console (F12)
   ```

### For Production Deployment

See `SETUP_GUIDE.md` for production deployment instructions.

### For API Testing

See `backend/API_TESTING.md` for complete API testing guide with all 16 endpoints.

### For UI Customization

See `GOOGLE_STITCH_DESIGN.md` for UI/UX design specifications.

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check `SETUP_GUIDE.md` for detailed setup instructions
2. Check `backend/API_TESTING.md` for API testing
3. Check `FEATURE_VERIFICATION.md` for feature verification
4. Check backend logs in `backend/logs/`
5. Check browser console for frontend errors

---

## 🎉 Success!

If all steps completed successfully, you now have:

- ✅ Backend API running on http://localhost:5000
- ✅ Frontend UI running on http://localhost:3000
- ✅ PostgreSQL database with 13 tables
- ✅ Redis caching enabled
- ✅ All 16 API endpoints working
- ✅ All 8 frontend components loaded

**Climate Guardian is ready for development!** 🌊

---

**Next**: Test all features using `backend/API_TESTING.md`
