import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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
}

interface AlertState {
  alerts: Alert[]
  unreadCount: number
  selectedAlert: Alert | null
  loading: boolean
  error: string | null
}

const initialState: AlertState = {
  alerts: [],
  unreadCount: 0,
  selectedAlert: null,
  loading: false,
  error: null,
}

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload)
      state.unreadCount++
    },
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload
      state.unreadCount = action.payload.filter((a) => a.status === 'Issued').length
    },
    acknowledgeAlert: (state, action: PayloadAction<{ alertId: string; acknowledgedBy: string }>) => {
      const alert = state.alerts.find((a) => a.id === action.payload.alertId)
      if (alert) {
        alert.status = 'Acknowledged'
        alert.acknowledgedBy = action.payload.acknowledgedBy
        alert.acknowledgedAt = new Date()
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    dismissAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload)
    },
    selectAlert: (state, action: PayloadAction<Alert | null>) => {
      state.selectedAlert = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { addAlert, setAlerts, acknowledgeAlert, dismissAlert, selectAlert, setLoading, setError } =
  alertSlice.actions
export default alertSlice.reducer
