# 🚀 Climate Guardian Frontend - Setup & Development Guide

## ✅ Frontend Project Created!

The complete React + TypeScript frontend has been initialized with all necessary components and structure.

---

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── RiskMap.tsx
│   │   ├── SimulationPlayer.tsx
│   │   ├── AlertPanel.tsx
│   │   ├── DecisionBrief.tsx
│   │   ├── EvacuationRoutes.tsx
│   │   └── AuditTrail.tsx
│   ├── pages/
│   │   └── Dashboard.tsx
│   ├── store/
│   │   ├── store.ts
│   │   └── slices/
│   │       ├── riskSlice.ts
│   │       ├── simulationSlice.ts
│   │       ├── alertSlice.ts
│   │       └── uiSlice.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## 🛠️ Installation & Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- **React 18** - UI framework
- **Redux Toolkit** - State management
- **Leaflet** - Map library
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **TypeScript** - Type safety

### Step 2: Start Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## 📦 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npm run type-check
```

---

## 🎨 Components Overview

### 1. **Header** (`Header.tsx`)
- Logo and branding
- District selector dropdown
- Real-time clock
- Theme toggle (light/dark)
- Notification bell
- User profile

### 2. **Sidebar** (`Sidebar.tsx`)
- Live parameter sliders:
  - Rainfall (0-300 mm/hr)
  - Wind Speed (0-200 km/h)
  - Humidity (0-100%)
  - Soil Saturation (0-100%)
  - Temperature (15-45°C)
- Action buttons (Refresh, Reset, Save, Load)

### 3. **Risk Map** (`RiskMap.tsx`)
- Leaflet map with OpenStreetMap tiles
- GeoJSON zone rendering
- Color-coded risk levels
- Interactive popups
- Zoom controls

### 4. **Simulation Player** (`SimulationPlayer.tsx`)
- Play/Pause/Stop controls
- Playback speed selector (0.5x, 1x, 2x, 4x)
- Time slider (T+0h to T+12h)
- Frame information display
- Export/Share buttons

### 5. **Alert Panel** (`AlertPanel.tsx`)
- Real-time alert list
- Alert count badge
- Acknowledge/Dismiss actions
- New alert creation
- Clear all alerts

### 6. **Decision Brief** (`DecisionBrief.tsx`)
- Claude AI-generated brief
- Multi-language support (English, Telugu, Kannada, Tamil)
- Situation summary
- Recommended actions
- AI confidence score
- Dispatch options (SMS, Email, WhatsApp)

### 7. **Evacuation Routes** (`EvacuationRoutes.tsx`)
- Route list with details
- Distance and time estimates
- Capacity information
- Route status (Open/Congested/Closed)
- Navigation options

### 8. **Audit Trail** (`AuditTrail.tsx`)
- Alert history log
- Timestamp and status tracking
- Acknowledgment information
- Hash verification
- Export to CSV

---

## 🎯 State Management (Redux)

### Risk Slice (`riskSlice.ts`)
```typescript
- zones: Zone[]
- selectedZone: Zone | null
- riskGaugeValue: number
- loading: boolean
- error: string | null
```

### Simulation Slice (`simulationSlice.ts`)
```typescript
- frames: SimulationFrame[]
- currentFrame: number
- isPlaying: boolean
- playbackSpeed: number
- loading: boolean
- error: string | null
```

### Alert Slice (`alertSlice.ts`)
```typescript
- alerts: Alert[]
- unreadCount: number
- selectedAlert: Alert | null
- loading: boolean
- error: string | null
```

### UI Slice (`uiSlice.ts`)
```typescript
- theme: 'light' | 'dark'
- sidebarOpen: boolean
- selectedDistrict: string
- mapLayers: { zones, hospitals, shelters, evacuationRoutes, equityOverlay, satellite }
```

---

## 🎨 Styling

### CSS Variables (Light Mode)
```css
--bg-primary: #FFFFFF
--bg-surface: #F5F5F5
--text-primary: #212121
--text-secondary: #757575
--border-color: #E0E0E0
--divider-color: #EEEEEE

--risk-low: #4CAF50
--risk-medium: #FFC107
--risk-high: #FF9800
--risk-critical: #F44336

--action-primary: #2196F3
--action-secondary: #9C27B0
--action-info: #00BCD4
```

### CSS Variables (Dark Mode)
```css
--bg-primary: #121212
--bg-surface: #1E1E1E
--text-primary: #FFFFFF
--text-secondary: #BDBDBD
--border-color: #424242
--divider-color: #333333

--risk-low: #81C784
--risk-medium: #FFD54F
--risk-high: #FFB74D
--risk-critical: #EF5350
```

### Tailwind CSS
- Utility-first CSS framework
- Responsive design (mobile, tablet, desktop)
- Dark mode support via `data-theme` attribute
- Custom color palette

---

## 🔌 API Integration

### Backend Proxy
The Vite config includes a proxy for API calls:
```
/api/* → http://localhost:5000/*
```

### API Endpoints to Implement

**Risk Intelligence:**
```
POST   /api/risk/classify
POST   /api/risk/update
GET    /api/risk/zones
```

**Simulation:**
```
POST   /api/simulate/generate
GET    /api/simulate/frames/:id
```

**Alerts:**
```
POST   /api/alert/generate
POST   /api/alert/dispatch
GET    /api/audit-trail
```

**Routing:**
```
GET    /api/evacuation-routes
```

---

## 🌙 Theme Support

### Toggle Theme
```typescript
// In App.tsx
const toggleTheme = () => {
  const newTheme = theme === 'light' ? 'dark' : 'light'
  setThemeState(newTheme)
  dispatch(setTheme(newTheme))
  localStorage.setItem('theme', newTheme)
  document.documentElement.setAttribute('data-theme', newTheme)
}
```

### Use CSS Variables
```css
background-color: var(--bg-primary);
color: var(--text-primary);
border-color: var(--border-color);
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (single column, stacked panels)
- **Tablet**: 768px - 1024px (two columns)
- **Desktop**: > 1024px (three columns, all panels visible)

### Responsive Classes
```tsx
// Example
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  {/* Single column on mobile, 3 columns on desktop */}
</div>
```

---

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Test Structure
```
src/
├── components/
│   └── __tests__/
│       ├── Header.test.tsx
│       ├── Sidebar.test.tsx
│       └── ...
└── store/
    └── __tests__/
        ├── riskSlice.test.ts
        └── ...
```

---

## 🚀 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature
```

### 2. Make Changes
- Edit components in `src/components/`
- Update state in `src/store/slices/`
- Add new pages in `src/pages/`

### 3. Test Locally
```bash
npm run dev
```

### 4. Type Check
```bash
npm run type-check
```

### 5. Lint
```bash
npm run lint
```

### 6. Commit & Push
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

---

## 📋 Next Steps

### Phase 1: Component Enhancement (Week 1-2)
- [ ] Add real data to components
- [ ] Implement API calls
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add animations

### Phase 2: Feature Implementation (Week 2-3)
- [ ] Implement map interactions
- [ ] Implement simulation playback
- [ ] Implement alert dispatch
- [ ] Implement evacuation routing
- [ ] Implement audit trail

### Phase 3: Integration (Week 3-4)
- [ ] Connect to backend APIs
- [ ] Implement WebSocket for real-time updates
- [ ] Add authentication
- [ ] Add error boundaries
- [ ] Performance optimization

### Phase 4: Testing & Deployment (Week 4-5)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Build optimization
- [ ] Production deployment

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --port 3001
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Run type check
npm run type-check

# Fix issues in your code
```

### Styling Issues
```bash
# Rebuild Tailwind CSS
npm run build
```

---

## 📚 Resources

- **React**: https://react.dev
- **Redux Toolkit**: https://redux-toolkit.js.org
- **Leaflet**: https://leafletjs.com
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev
- **TypeScript**: https://www.typescriptlang.org

---

## 🎯 Key Features Implemented

✅ **Dashboard Layout** - 8 main panels  
✅ **State Management** - Redux with 4 slices  
✅ **Component Library** - 8 core components  
✅ **Styling System** - Tailwind + CSS variables  
✅ **Theme Support** - Light/Dark mode  
✅ **Responsive Design** - Mobile, tablet, desktop  
✅ **Type Safety** - Full TypeScript support  
✅ **API Ready** - Proxy configured for backend  

---

## 🚀 Ready to Develop!

```bash
cd frontend
npm install
npm run dev
```

Visit: **http://localhost:3000**

---

**Happy coding! 🎉**

*Climate Guardian - Because every second counts*
