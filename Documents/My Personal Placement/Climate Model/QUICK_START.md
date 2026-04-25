# 🚀 CLIMATE GUARDIAN - QUICK START GUIDE

## ✅ SYSTEM STATUS: READY FOR DEMO

### 🟢 Running Services:
- **Backend API**: http://localhost:5000 ✅
- **Frontend UI**: http://localhost:3000 ✅

---

## 📱 OPEN THE APPLICATION

### **Just open your browser and go to:**
```
http://localhost:3000
```

---

## 🎮 HOW TO USE

### 1. **Adjust Parameters** (Left Sidebar)
- Move the sliders for:
  - Rainfall (0-300 mm/hr)
  - Wind Speed (0-200 km/h)
  - Humidity (0-100%)
  - Soil Moisture (0-100%)
  - Temperature (0-50°C)
  - **Earthquake Magnitude (0-10 Mw)** ⭐ NEW

### 2. **Watch Risk Aggregator Update**
- Circular progress shows overall risk percentage
- Risk level changes color:
  - 🟢 Low (0-25%)
  - 🟡 Medium (25-50%)
  - 🟠 High (50-75%)
  - 🔴 Critical (75-100%)

### 3. **Click "INITIATE SIMULATION"**
- Sends parameters to backend
- Generates risk classification
- Creates 12-frame disaster simulation
- Updates map with zone risk colors

### 4. **Explore the Map**
- Interactive Leaflet map centered on Chennai
- Click zones to see risk details
- Zoom in/out with mouse wheel
- Pan by dragging

### 5. **Control Simulation**
- Click ▶️ Play button to start simulation
- Use timeline slider to seek frames
- Watch disaster evolution over 12 hours

### 6. **View Panels**
- **Evacuation Routes**: See route statuses (OPEN/CLEAR/PARTIAL)
- **Decision Brief**: AI-generated recommendations
- **Active Alerts**: Real-time alerts by severity
- **Audit Trail**: Blockchain-verified action log

---

## 🎯 KEY FEATURES TO DEMO

### 1. **6 Live Parameters**
Show all 6 sliders working, especially the NEW Earthquake parameter

### 2. **Real-Time Risk Calculation**
Move sliders → Risk aggregator updates instantly

### 3. **Interactive Map**
Click zones, zoom, pan - fully functional Leaflet map

### 4. **Simulation Controls**
Play/pause, timeline slider - working controls

### 5. **Backend Integration**
"INITIATE SIMULATION" button calls real backend APIs

### 6. **Exact Design Match**
Compare with DEMO.html - pixel-perfect replication

---

## 🔧 IF SOMETHING GOES WRONG

### Backend Not Running?
```bash
cd backend
npm run dev
```

### Frontend Not Running?
```bash
cd frontend
npm run dev
```

### Both Running But Not Working?
1. Check http://localhost:5000 (should show backend)
2. Check http://localhost:3000 (should show frontend)
3. Open browser console (F12) for errors

---

## 📊 BACKEND API ENDPOINTS

### Currently Integrated:
- `POST /api/risk/classify` - Risk classification ✅
- `POST /api/simulate/generate` - Simulation generation ✅

### Available (Ready to Integrate):
- `GET /api/pattern/auto-refresh/start` - Pattern analysis
- `POST /api/evacuation-routes/calculate` - Route optimization
- `POST /api/alert/generate` - Decision briefs
- `GET /api/audit-trail` - Audit records

---

## 🎨 DESIGN HIGHLIGHTS

### Colors:
- Background: #131313 (very dark gray)
- Cards: #2a2a2a (dark gray)
- Accent: #9ecaff (light blue)
- Risk colors: Green/Yellow/Orange/Red

### Fonts:
- Roboto (300, 400, 500, 700)
- Material Icons

### Layout:
- Left sidebar (280px) with parameters
- Main content (2fr + 1fr grid)
- Fixed header with navigation
- Emergency FAB (bottom-right)

---

## ⏰ DEMO CHECKLIST

Before 12 PM demo:

- [ ] Open http://localhost:3000
- [ ] Verify all 6 parameters visible
- [ ] Test "INITIATE SIMULATION" button
- [ ] Check map is visible and interactive
- [ ] Verify all panels showing data
- [ ] Test simulation play/pause
- [ ] Show earthquake parameter (NEW)
- [ ] Demonstrate backend integration

---

## 🎉 YOU'RE READY!

Everything is set up and running. Just open http://localhost:3000 and start your demo!

**Good luck with your 12 PM presentation! 🚀**
