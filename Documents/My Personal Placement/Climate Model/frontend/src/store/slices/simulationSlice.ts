import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SimulationFrame {
  frameNumber: number
  timestamp: string
  zones: any[]
  affectedPopulation: number
}

interface SimulationState {
  frames: SimulationFrame[]
  currentFrame: number
  isPlaying: boolean
  playbackSpeed: number
  loading: boolean
  error: string | null
}

const initialState: SimulationState = {
  frames: [],
  currentFrame: 0,
  isPlaying: false,
  playbackSpeed: 1,
  loading: false,
  error: null,
}

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    setFrames: (state, action: PayloadAction<SimulationFrame[]>) => {
      state.frames = action.payload
      state.currentFrame = 0
    },
    setCurrentFrame: (state, action: PayloadAction<number>) => {
      state.currentFrame = Math.min(action.payload, state.frames.length - 1)
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload
    },
    setPlaybackSpeed: (state, action: PayloadAction<number>) => {
      state.playbackSpeed = action.payload
    },
    nextFrame: (state) => {
      if (state.currentFrame < state.frames.length - 1) {
        state.currentFrame++
      } else {
        state.isPlaying = false
      }
    },
    resetSimulation: (state) => {
      state.currentFrame = 0
      state.isPlaying = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const {
  setFrames,
  setCurrentFrame,
  setIsPlaying,
  setPlaybackSpeed,
  nextFrame,
  resetSimulation,
  setLoading,
  setError,
} = simulationSlice.actions
export default simulationSlice.reducer
