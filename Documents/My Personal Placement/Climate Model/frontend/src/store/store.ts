import { configureStore } from '@reduxjs/toolkit'
import riskReducer from './slices/riskSlice'
import simulationReducer from './slices/simulationSlice'
import alertReducer from './slices/alertSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    risk: riskReducer,
    simulation: simulationReducer,
    alert: alertReducer,
    ui: uiReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
