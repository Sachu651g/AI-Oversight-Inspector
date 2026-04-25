# 🔧 Climate Guardian - Error Resolution Guide

**Complete guide to fix all common errors and issues**

---

## 🚨 Quick Fix

**If you're seeing errors, run this first:**

### Windows:
```bash
fix-errors.bat
```

### Linux/Mac:
```bash
chmod +x fix-errors.sh
./fix-errors.sh
```

This will automatically fix most common issues.

---

## 📋 Common Errors & Solutions

### 1. Frontend Type Errors

#### Error:
```
Could not find a declaration file for module 'react'
Cannot find module 'react-leaflet' or its corresponding type declarations
Cannot find module 'leaflet' or its corresponding type declarations
```

#### Solution:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Root Cause:
Missing type definitions or node_modules not installed.

---

### 2. Backend Build Errors

#### Error:
```
Cannot find module 'express'
Cannot find module 'pg'
Cannot find module 'redis'
```

#### Solution:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Root Cause:
Missing dependencies or corrupted node_modules.

---

### 3. Database Connection Errors

#### Error:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: password authentication failed for user "postgres"
Error: database "climate_guardian" does not exist
```

#### Solution:

**Step 1**: Check PostgreSQL is running
```bash
# Windows
pg_isready

# Linux/Mac
sudo service postgresql status
```

**Step 2**: Create database if missing
```bash
psql -U postgres -c "CREATE DATABASE climate_guardian;"
psql -U postgres -d climate_guardian -c "CREATE EXTENSION postgis;"
```

**Step 3**: Verify credentials in `backend/.env`
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=climate_guardian
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

**Step 4**: Test connection
```bash
psql -U postgres -d climate_guardian -c "SELECT 1;"
```

---

### 4. Redis Connection Errors

#### Error:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
Error: Redis connection failed
```

#### Solution:

**Step 1**: Start Redis
```bash
# Windows
redis-server

# Linux/Mac
sudo service redis-server start
# or
brew services start redis
```

**Step 2**: Test Redis
```bash
redis-cli ping
# Should return: PONG
```

**Step 3**: Verify Redis config in `backend/.env`
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

---

### 5. Port Already in Use

#### Error:
```
Error: listen EADDRINUSE: address already in use :::5000
Error: listen EADDRINUSE: address already in use :::3000
```

#### Solution:

**Option 1**: Kill process using the port

**Windows**:
```bash
# Find process
netstat -ano | findstr :5000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Option 2**: Change port in configuration

Backend (`backend/.env`):
```env
PORT=5001
```

Frontend (`frontend/vite.config.ts`):
```typescript
export default defineConfig({
  server: {
    port: 3001,
  },
})
```

---

### 6. CORS Errors

#### Error:
```
Access to XMLHttpRequest blocked by CORS policy
No 'Access-Control-Allow-Origin' header is present
```

#### Solution:

**Step 1**: Verify CORS_ORIGIN in `backend/.env`
```env
CORS_ORIGIN=http://localhost:3000
```

**Step 2**: If frontend runs on different port, update CORS_ORIGIN
```env
CORS_ORIGIN=http://localhost:3001
```

**Step 3**: Restart backend
```bash
cd backend
npm run dev
```

---

### 7. TypeScript Compilation Errors

#### Error:
```
error TS2307: Cannot find module 'X' or its corresponding type declarations
error TS2304: Cannot find name 'X'
```

#### Solution:

**Backend**:
```bash
cd backend
npm install --save-dev @types/node @types/express @types/cors
npm run build
```

**Frontend**:
```bash
cd frontend
npm install --save-dev @types/react @types/react-dom @types/node @types/leaflet
npm run type-check
```

---

### 8. Missing Environment Variables

#### Error:
```
Error: ANTHROPIC_API_KEY is not defined
Error: TWILIO_ACCOUNT_SID is not defined
```

#### Solution:

**Step 1**: Copy example environment file
```bash
cd backend
cp .env.example .env
```

**Step 2**: Edit `.env` and add your API keys

**Note**: Claude AI, Twilio, and SendGrid are **optional**. The system will use fallbacks:
- **Claude AI**: Uses template-based decision briefs
- **Twilio**: SMS/WhatsApp dispatch will be simulated
- **SendGrid**: Email dispatch will be simulated

**Step 3**: Restart backend
```bash
npm run dev
```

---

### 9. Database Schema Not Found

#### Error:
```
Error: relation "zones" does not exist
Error: relation "weather_parameters" does not exist
```

#### Solution:

**Step 1**: Run schema migration
```bash
psql -U postgres -d climate_guardian -f database/schema.sql
```

**Step 2**: Load seed data
```bash
psql -U postgres -d climate_guardian -f database/seeds/01_zones.sql
```

**Step 3**: Verify tables exist
```bash
psql -U postgres -d climate_guardian -c "\dt"
```

Should show 13 tables.

---

### 10. PostGIS Extension Missing

#### Error:
```
Error: type "geometry" does not exist
Error: function ST_Distance does not exist
```

#### Solution:

**Step 1**: Install PostGIS extension
```bash
psql -U postgres -d climate_guardian -c "CREATE EXTENSION postgis;"
```

**Step 2**: Verify PostGIS installed
```bash
psql -U postgres -d climate_guardian -c "SELECT PostGIS_version();"
```

---

### 11. npm Install Fails

#### Error:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

#### Solution:

**Option 1**: Use legacy peer deps
```bash
npm install --legacy-peer-deps
```

**Option 2**: Use force flag
```bash
npm install --force
```

**Option 3**: Clear npm cache
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

### 12. Build Fails with Memory Error

#### Error:
```
FATAL ERROR: Ineffective mark-compacts near heap limit
JavaScript heap out of memory
```

#### Solution:

**Increase Node.js memory limit**:

**Windows**:
```bash
set NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

**Linux/Mac**:
```bash
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

Or add to `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max_old_space_size=4096 vite build"
  }
}
```

---

### 13. Frontend Shows Blank Page

#### Error:
Browser shows blank page with no errors.

#### Solution:

**Step 1**: Check browser console (F12)
Look for JavaScript errors.

**Step 2**: Verify backend is running
```bash
curl http://localhost:5000/health
```

**Step 3**: Clear browser cache
- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Edge: Ctrl+Shift+Delete

**Step 4**: Rebuild frontend
```bash
cd frontend
rm -rf dist node_modules
npm install --legacy-peer-deps
npm run dev
```

---

### 14. API Returns 404 Not Found

#### Error:
```
GET http://localhost:5000/api/risk/classify 404 (Not Found)
```

#### Solution:

**Step 1**: Verify backend is running
```bash
curl http://localhost:5000/health
```

**Step 2**: Check route exists
```bash
curl http://localhost:5000/api
```

Should return API endpoint list.

**Step 3**: Verify request method
- Risk classification: **POST** (not GET)
- Simulation generation: **POST** (not GET)
- Decision brief: **POST** (not GET)

**Step 4**: Check request body format
```bash
curl -X POST http://localhost:5000/api/risk/classify \
  -H "Content-Type: application/json" \
  -d '{"weatherParams": {...}, "zoneIds": [...]}'
```

---

### 15. Leaflet Map Not Showing

#### Error:
Map container is blank or shows gray tiles.

#### Solution:

**Step 1**: Verify Leaflet CSS is imported
```typescript
import 'leaflet/dist/leaflet.css'
```

**Step 2**: Check map container has height
```css
.map-container {
  height: 500px; /* or 100% with parent having height */
}
```

**Step 3**: Verify GeoJSON data format
```typescript
{
  type: 'FeatureCollection',
  features: [...]
}
```

**Step 4**: Check browser console for Leaflet errors

---

## 🔍 Debugging Tips

### Enable Verbose Logging

**Backend** (`backend/.env`):
```env
LOG_LEVEL=debug
```

**Frontend** (browser console):
```javascript
localStorage.setItem('debug', '*')
```

### Check Logs

**Backend logs**:
```bash
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

**Frontend logs**:
- Open browser console (F12)
- Check Network tab for API calls
- Check Console tab for JavaScript errors

### Test Individual Components

**Test database**:
```bash
psql -U postgres -d climate_guardian -c "SELECT COUNT(*) FROM zones;"
```

**Test Redis**:
```bash
redis-cli
> PING
> KEYS *
> GET risk:*
```

**Test backend API**:
```bash
curl http://localhost:5000/health
curl http://localhost:5000/api
curl http://localhost:5000/api/risk/parameters
```

---

## 📞 Still Having Issues?

If errors persist after trying these solutions:

1. **Run the fix script**:
   ```bash
   # Windows
   fix-errors.bat
   
   # Linux/Mac
   ./fix-errors.sh
   ```

2. **Check detailed guides**:
   - `INSTALLATION_STEPS.md` - Step-by-step installation
   - `SETUP_GUIDE.md` - Complete setup guide
   - `backend/API_TESTING.md` - API testing guide

3. **Verify prerequisites**:
   - Node.js 18+ installed
   - PostgreSQL 14+ installed with PostGIS
   - Redis 7+ installed
   - All services running

4. **Check system requirements**:
   - 4GB RAM minimum
   - 2GB free disk space
   - Internet connection for npm packages

5. **Review logs**:
   - Backend: `backend/logs/`
   - Frontend: Browser console (F12)
   - PostgreSQL: Check PostgreSQL logs
   - Redis: Check Redis logs

---

## ✅ Verification After Fixes

After applying fixes, verify everything works:

```bash
# 1. Check backend health
curl http://localhost:5000/health

# 2. Test API endpoint
curl http://localhost:5000/api/risk/parameters

# 3. Check frontend loads
# Open http://localhost:3000 in browser

# 4. Check database
psql -U postgres -d climate_guardian -c "SELECT COUNT(*) FROM zones;"

# 5. Check Redis
redis-cli ping
```

All should return successful responses.

---

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Backend health check returns "healthy"
- ✅ Frontend loads without console errors
- ✅ API endpoints return valid JSON responses
- ✅ Database queries return data
- ✅ Redis responds to PING
- ✅ No errors in backend logs
- ✅ No errors in browser console

---

**Climate Guardian** - *Error-free and ready to save lives!* 🌊
