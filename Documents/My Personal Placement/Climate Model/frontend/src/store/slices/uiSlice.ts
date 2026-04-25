import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  selectedDistrict: string
  mapLayers: {
    zones: boolean
    hospitals: boolean
    shelters: boolean
    evacuationRoutes: boolean
    equityOverlay: boolean
    satellite: boolean
  }
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  selectedDistrict: 'Chennai',
  mapLayers: {
    zones: true,
    hospitals: true,
    shelters: true,
    evacuationRoutes: false,
    equityOverlay: false,
    satellite: false,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSelectedDistrict: (state, action: PayloadAction<string>) => {
      state.selectedDistrict = action.payload
    },
    toggleMapLayer: (state, action: PayloadAction<keyof typeof state.mapLayers>) => {
      state.mapLayers[action.payload] = !state.mapLayers[action.payload]
    },
    setMapLayers: (state, action: PayloadAction<typeof state.mapLayers>) => {
      state.mapLayers = action.payload
    },
  },
})

export const { setTheme, toggleSidebar, setSelectedDistrict, toggleMapLayer, setMapLayers } = uiSlice.actions
export default uiSlice.reducer
