import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Zone {
  id: string
  name: string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  riskScore: number
  population: number
  coordinates: [number, number]
}

interface RiskState {
  zones: Zone[]
  selectedZone: Zone | null
  riskGaugeValue: number
  loading: boolean
  error: string | null
}

const initialState: RiskState = {
  zones: [],
  selectedZone: null,
  riskGaugeValue: 0,
  loading: false,
  error: null,
}

const riskSlice = createSlice({
  name: 'risk',
  initialState,
  reducers: {
    setZones: (state, action: PayloadAction<Zone[]>) => {
      state.zones = action.payload
    },
    updateZoneRisk: (state, action: PayloadAction<{ zoneId: string; riskLevel: string; riskScore: number }>) => {
      const zone = state.zones.find((z) => z.id === action.payload.zoneId)
      if (zone) {
        zone.riskLevel = action.payload.riskLevel as any
        zone.riskScore = action.payload.riskScore
      }
    },
    selectZone: (state, action: PayloadAction<Zone | null>) => {
      state.selectedZone = action.payload
    },
    setRiskGaugeValue: (state, action: PayloadAction<number>) => {
      state.riskGaugeValue = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setZones, updateZoneRisk, selectZone, setRiskGaugeValue, setLoading, setError } = riskSlice.actions
export default riskSlice.reducer
