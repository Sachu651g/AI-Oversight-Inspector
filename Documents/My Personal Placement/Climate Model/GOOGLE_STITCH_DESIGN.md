# Climate Guardian - Google Stitch Design Specifications

## 🎨 Complete UI Design Guide for Google Stitch

This document provides detailed specifications for building the Climate Guardian UI in Google Stitch.

---

## 📐 Design System Foundation

### Color Palette

#### Risk Level Colors (Primary)
```
Low Risk:      #4CAF50 (Green)
               RGB(76, 175, 80)
               HSL(120, 39%, 50%)

Medium Risk:   #FFC107 (Amber)
               RGB(255, 193, 7)
               HSL(45, 100%, 51%)

High Risk:     #FF9800 (Orange)
               RGB(255, 152, 0)
               HSL(39, 100%, 50%)

Critical Risk: #F44336 (Red)
               RGB(244, 67, 54)
               HSL(4, 90%, 58%)
```

#### Neutral Colors
```
Background:    #FFFFFF (Light) / #121212 (Dark)
Surface:       #F5F5F5 (Light) / #1E1E1E (Dark)
Text Primary:  #212121 (Light) / #FFFFFF (Dark)
Text Secondary:#757575 (Light) / #BDBDBD (Dark)
Border:        #E0E0E0 (Light) / #424242 (Dark)
Divider:       #EEEEEE (Light) / #333333 (Dark)
```

#### Action Colors
```
Primary:       #2196F3 (Blue)
Secondary:     #9C27B0 (Purple)
Info:          #00BCD4 (Cyan)
Success:       #4CAF50 (Green)
Warning:       #FFC107 (Amber)
Error:         #F44336 (Red)
```

### Typography

#### Font Family
```
Primary:   Roboto (Google Stitch default)
Fallback:  -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Monospace: "Roboto Mono", monospace
```

#### Font Sizes & Weights
```
Display 1:  48px, Weight 300 (Light)
Display 2:  40px, Weight 300 (Light)
Headline 1: 32px, Weight 400 (Regular)
Headline 2: 28px, Weight 400 (Regular)
Headline 3: 24px, Weight 500 (Medium)
Headline 4: 20px, Weight 500 (Medium)
Headline 5: 16px, Weight 500 (Medium)
Headline 6: 14px, Weight 500 (Medium)

Body 1:     16px, Weight 400 (Regular)
Body 2:     14px, Weight 400 (Regular)
Caption:    12px, Weight 400 (Regular)
Overline:   12px, Weight 500 (Medium)
```

### Spacing Scale
```
xs:  4px
sm:  8px
md:  12px
lg:  16px
xl:  24px
2xl: 32px
3xl: 48px
```

### Border Radius
```
xs:  2px
sm:  4px
md:  8px
lg:  12px
xl:  16px
full: 50%
```

### Shadows (Elevation)
```
Elevation 0:  none
Elevation 1:  0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
Elevation 2:  0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)
Elevation 3:  0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)
Elevation 4:  0 15px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)
Elevation 5:  0 20px 40px rgba(0,0,0,0.2)
```

---

## 🧩 Component Specifications

### 1. Button Component

#### Variants

**Primary Button**
```
State: Default
├── Background: #2196F3
├── Text: #FFFFFF
├── Padding: 12px 24px
├── Border Radius: 4px
├── Font Size: 14px
├── Font Weight: 500
├── Elevation: 2
└── Cursor: pointer

State: Hover
├── Background: #1976D2
├── Elevation: 4

State: Active/Pressed
├── Background: #1565C0
├── Elevation: 8

State: Disabled
├── Background: #BDBDBD
├── Text: #757575
├── Cursor: not-allowed
├── Opacity: 0.6
```

**Secondary Button**
```
State: Default
├── Background: transparent
├── Border: 2px solid #2196F3
├── Text: #2196F3
├── Padding: 10px 22px
├── Border Radius: 4px
├── Font Size: 14px
├── Font Weight: 500

State: Hover
├── Background: rgba(33, 150, 243, 0.04)

State: Active
├── Background: rgba(33, 150, 243, 0.08)
```

**Danger Button**
```
State: Default
├── Background: #F44336
├── Text: #FFFFFF
├── Padding: 12px 24px
├── Border Radius: 4px

State: Hover
├── Background: #E53935

State: Active
├── Background: #D32F2F
```

**Icon Button**
```
Size: 40px × 40px
├── Icon Size: 24px
├── Border Radius: 50%
├── Background: transparent
├── Hover Background: rgba(0,0,0,0.04)
└── Padding: 8px
```

**Floating Action Button (FAB)**
```
Size: 56px × 56px
├── Icon Size: 24px
├── Background: #2196F3
├── Text: #FFFFFF
├── Border Radius: 50%
├── Elevation: 6
├── Position: fixed bottom-right
├── Margin: 16px
└── Hover Elevation: 8
```

### 2. Card Component

```
Structure:
├── Padding: 16px
├── Border Radius: 8px
├── Background: #FFFFFF (Light) / #1E1E1E (Dark)
├── Border: 1px solid #E0E0E0 (Light) / #424242 (Dark)
├── Elevation: 1
├── Hover Elevation: 2
└── Transition: all 0.3s ease

Content:
├── Header (optional)
│   ├── Title: Headline 5
│   ├── Subtitle: Body 2
│   └── Action: Icon Button
├── Body
│   └── Content: Body 1
└── Footer (optional)
    └── Actions: Button group
```

### 3. Input Component

#### Text Input
```
State: Default
├── Height: 40px
├── Padding: 12px
├── Border: 1px solid #E0E0E0
├── Border Radius: 4px
├── Font Size: 14px
├── Background: #FFFFFF

State: Focused
├── Border: 2px solid #2196F3
├── Box Shadow: 0 0 0 3px rgba(33, 150, 243, 0.1)

State: Error
├── Border: 2px solid #F44336
├── Helper Text: #F44336

State: Disabled
├── Background: #F5F5F5
├── Color: #BDBDBD
├── Cursor: not-allowed
```

#### Slider Input
```
Track:
├── Height: 4px
├── Background: #E0E0E0
├── Border Radius: 2px

Thumb:
├── Size: 20px × 20px
├── Background: #2196F3
├── Border Radius: 50%
├── Elevation: 2
├── Hover Size: 24px × 24px

Active Track:
├── Background: #2196F3
```

### 4. Badge Component

```
Default:
├── Padding: 4px 8px
├── Border Radius: 12px
├── Font Size: 12px
├── Font Weight: 500
├── Background: #E0E0E0
├── Text: #212121

Variants:
├── Success: Background #4CAF50, Text #FFFFFF
├── Warning: Background #FFC107, Text #212121
├── Error: Background #F44336, Text #FFFFFF
├── Info: Background #2196F3, Text #FFFFFF

Sizes:
├── Small: 4px 8px, Font 12px
├── Medium: 6px 12px, Font 14px
├── Large: 8px 16px, Font 16px
```

### 5. Modal Component

```
Overlay:
├── Background: rgba(0, 0, 0, 0.5)
├── Backdrop Filter: blur(4px)
├── Z-index: 1000

Modal:
├── Background: #FFFFFF (Light) / #1E1E1E (Dark)
├── Border Radius: 8px
├── Elevation: 5
├── Min Width: 300px
├── Max Width: 600px
├── Padding: 24px

Header:
├── Title: Headline 4
├── Close Button: Icon Button (top-right)

Body:
├── Content: Body 1
├── Margin Top: 16px

Footer:
├── Actions: Button group (right-aligned)
├── Margin Top: 24px
└── Border Top: 1px solid #E0E0E0
```

### 6. Dropdown/Select Component

```
Trigger:
├── Height: 40px
├── Padding: 12px
├── Border: 1px solid #E0E0E0
├── Border Radius: 4px
├── Background: #FFFFFF
├── Display: flex, justify-content: space-between

Menu:
├── Background: #FFFFFF
├── Border Radius: 4px
├── Elevation: 3
├── Min Width: 200px
├── Z-index: 999

Menu Item:
├── Padding: 12px 16px
├── Font Size: 14px
├── Hover Background: #F5F5F5
├── Selected Background: rgba(33, 150, 243, 0.1)
├── Selected Text: #2196F3
└── Cursor: pointer
```

### 7. Tooltip Component

```
Container:
├── Background: #212121
├── Text: #FFFFFF
├── Padding: 8px 12px
├── Border Radius: 4px
├── Font Size: 12px
├── Elevation: 4
├── Z-index: 1001

Arrow:
├── Size: 8px × 8px
├── Background: #212121
└── Position: relative to trigger

Animation:
├── Fade In: 0.2s ease-in
└── Fade Out: 0.2s ease-out
```

### 8. Notification/Toast Component

```
Container:
├── Background: #323232
├── Text: #FFFFFF
├── Padding: 16px
├── Border Radius: 4px
├── Elevation: 4
├── Min Width: 300px
├── Max Width: 600px
├── Position: fixed bottom-left
├── Margin: 16px

Variants:
├── Success: Background #4CAF50
├── Error: Background #F44336
├── Warning: Background #FFC107, Text #212121
├── Info: Background #2196F3

Close Button:
├── Icon: ✕
├── Position: right
├── Cursor: pointer

Animation:
├── Slide In: 0.3s ease-out (from bottom)
├── Auto Dismiss: 4s
└── Slide Out: 0.3s ease-in (to bottom)
```

---

## 📊 Data Visualization Components

### 1. Risk Gauge Chart

```
Container:
├── Size: 200px × 200px
├── Background: transparent

Gauge:
├── Outer Radius: 90px
├── Inner Radius: 70px
├── Start Angle: 225°
├── End Angle: -45°

Segments:
├── Green (0-25%): #4CAF50
├── Yellow (25-50%): #FFC107
├── Orange (50-75%): #FF9800
└── Red (75-100%): #F44336

Needle:
├── Color: #212121
├── Width: 4px
├── Length: 70px
├── Rotation: based on value

Center:
├── Circle: 20px radius
├── Background: #FFFFFF
├── Border: 2px solid #212121

Label:
├── Font Size: 24px
├── Font Weight: 500
├── Text: percentage value
└── Position: center
```

### 2. Zone Risk Bar Chart

```
Container:
├── Width: 100%
├── Height: auto
├── Padding: 16px

Bars:
├── Height: 32px
├── Margin Bottom: 12px
├── Border Radius: 4px
├── Color: based on risk level

Bar Segments:
├── Low: #4CAF50
├── Medium: #FFC107
├── High: #FF9800
└── Critical: #F44336

Labels:
├── Zone Name: left
├── Value: right
├── Font Size: 14px

Hover:
├── Elevation: 2
├── Opacity: 0.8
└── Cursor: pointer
```

### 3. Time Series Chart

```
Container:
├── Width: 100%
├── Height: 300px
├── Padding: 16px

Axes:
├── X-axis: Time (T+0h to T+12h)
├── Y-axis: Risk Level (0-100)
├── Grid: light gray lines

Lines:
├── Width: 2px
├── Color: based on zone
├── Smooth: true (curve interpolation)

Points:
├── Radius: 4px
├── Hover Radius: 6px
├── Color: same as line

Legend:
├── Position: top-right
├── Background: rgba(255, 255, 255, 0.9)
├── Padding: 8px
└── Border: 1px solid #E0E0E0

Tooltip:
├── Background: #212121
├── Text: #FFFFFF
├── Padding: 8px 12px
└── Shows: zone, time, value
```

### 4. Heatmap

```
Container:
├── Width: 100%
├── Height: auto
├── Padding: 16px

Grid:
├── Columns: zones (8-12)
├── Rows: time steps (12)
├── Cell Size: 40px × 40px

Cell Colors:
├── Low: #4CAF50
├── Medium: #FFC107
├── High: #FF9800
├── Critical: #F44336

Cell Hover:
├── Border: 2px solid #212121
├── Tooltip: shows value
└── Cursor: pointer

Labels:
├── X-axis: zone names
├── Y-axis: time (T+0h to T+12h)
└── Font Size: 12px
```

---

## 🗺️ Map Component (Leaflet.js)

### Base Configuration
```
Container:
├── Width: 100%
├── Height: 100%
├── Border Radius: 8px
├── Elevation: 1

Map Options:
├── Zoom: 10
├── Center: [13.0827, 80.2707] (Chennai)
├── Min Zoom: 8
├── Max Zoom: 18
├── Tile Layer: OpenStreetMap

Controls:
├── Zoom: top-left
├── Attribution: bottom-right
└── Scale: bottom-left
```

### GeoJSON Styling
```
Zone Polygons:
├── Fill Color: based on risk level
├── Fill Opacity: 0.6
├── Stroke Color: #212121
├── Stroke Width: 2px
├── Hover Fill Opacity: 0.8
├── Hover Stroke Width: 3px

Popup:
├── Background: #FFFFFF
├── Padding: 12px
├── Border Radius: 4px
├── Font Size: 14px
└── Shows: zone name, population, risk level
```

### Markers
```
Hospital Marker:
├── Icon: hospital icon
├── Color: #2196F3
├── Size: 32px × 32px

Shelter Marker:
├── Icon: shelter icon
├── Color: #4CAF50
├── Size: 32px × 32px

Evacuation Route:
├── Type: LineString
├── Color: #FF9800
├── Weight: 3px
├── Opacity: 0.8
├── Dash Array: 5, 5
```

---

## 📱 Responsive Design

### Breakpoints
```
Mobile:  < 768px
Tablet:  768px - 1024px
Desktop: > 1024px
```

### Mobile Layout (< 768px)
```
Header:
├── Height: 56px
├── Single row
├── Hamburger menu

Content:
├── Single column
├── Full width
├── Stacked panels

Map:
├── Height: 300px
├── Full width

Panels:
├── Bottom sheet
├── Swipeable
├── Collapsible

Buttons:
├── Min height: 48px
├── Min width: 48px
├── Touch-friendly spacing
```

### Tablet Layout (768px - 1024px)
```
Header:
├── Height: 64px
├── Two rows if needed

Sidebar:
├── Width: 280px
├── Collapsible

Content:
├── Two column layout
├── Flexible panels

Map:
├── Height: 400px
├── Responsive width
```

### Desktop Layout (> 1024px)
```
Header:
├── Height: 64px
├── Full width

Sidebar:
├── Width: 320px
├── Always visible

Content:
├── Three column layout
├── All panels visible
├── Expandable sections

Map:
├── Height: 500px
├── Full width
```

---

## 🎬 Animations & Transitions

### Timing Functions
```
Fast:     0.1s ease-out
Standard: 0.3s ease-in-out
Slow:     0.5s ease-in
```

### Common Animations
```
Fade In:
├── Opacity: 0 → 1
├── Duration: 0.3s
└── Timing: ease-in

Slide In (from left):
├── Transform: translateX(-100%) → translateX(0)
├── Duration: 0.3s
└── Timing: ease-out

Scale In:
├── Transform: scale(0.8) → scale(1)
├── Duration: 0.3s
└── Timing: ease-out

Bounce:
├── Animation: bounce
├── Duration: 0.6s
└── Timing: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## ♿ Accessibility (WCAG 2.1 AA)

### Color Contrast
```
Text on Background:
├── Normal Text: 4.5:1 minimum
├── Large Text: 3:1 minimum
└── UI Components: 3:1 minimum

Examples:
├── #212121 on #FFFFFF: 12.6:1 ✓
├── #757575 on #FFFFFF: 4.54:1 ✓
├── #2196F3 on #FFFFFF: 3.13:1 ✓
```

### Focus States
```
All Interactive Elements:
├── Visible focus indicator
├── Minimum 2px outline
├── Color: #2196F3
├── Offset: 2px
└── Keyboard accessible (Tab key)
```

### ARIA Labels
```
Buttons:
├── aria-label: descriptive text
├── aria-pressed: for toggle buttons
└── aria-disabled: for disabled state

Forms:
├── <label> for inputs
├── aria-required: for required fields
└── aria-invalid: for error state

Regions:
├── <main>: main content
├── <nav>: navigation
├── <aside>: sidebar
└── role="region": custom regions
```

---

## 🌙 Dark Mode Support

### Dark Theme Colors
```
Background:    #121212
Surface:       #1E1E1E
Text Primary:  #FFFFFF
Text Secondary:#BDBDBD
Border:        #424242
Divider:       #333333

Risk Levels (adjusted for dark):
├── Low:      #81C784 (lighter green)
├── Medium:   #FFD54F (lighter yellow)
├── High:     #FFB74D (lighter orange)
└── Critical: #EF5350 (lighter red)
```

### Implementation
```typescript
// CSS Variables
:root {
  --bg-primary: #FFFFFF;
  --bg-surface: #F5F5F5;
  --text-primary: #212121;
}

[data-theme="dark"] {
  --bg-primary: #121212;
  --bg-surface: #1E1E1E;
  --text-primary: #FFFFFF;
}

// Usage
background-color: var(--bg-primary);
color: var(--text-primary);
```

---

## 📋 Implementation Checklist

### Phase 1: Design System
- [ ] Create color palette in Google Stitch
- [ ] Define typography scale
- [ ] Create spacing system
- [ ] Define shadow/elevation system
- [ ] Create border radius scale

### Phase 2: Base Components
- [ ] Button (all variants)
- [ ] Card
- [ ] Input (text, slider)
- [ ] Badge
- [ ] Modal
- [ ] Dropdown
- [ ] Tooltip
- [ ] Toast

### Phase 3: Data Visualization
- [ ] Risk Gauge
- [ ] Bar Chart
- [ ] Time Series Chart
- [ ] Heatmap
- [ ] Map (Leaflet)

### Phase 4: Layouts
- [ ] Header/Navigation
- [ ] Sidebar
- [ ] Main Content Area
- [ ] Bottom Panels
- [ ] Responsive Grid

### Phase 5: Polish
- [ ] Dark mode
- [ ] Animations
- [ ] Accessibility
- [ ] Performance
- [ ] Testing

---

**This guide provides complete specifications for Google Stitch implementation. Use it as your reference for all UI design decisions.**

*Built for precision. Designed for impact.*
