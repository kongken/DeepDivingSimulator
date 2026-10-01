import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDiveLog } from '@/lib/dive-log'
import { createId } from '@/lib/id'
import { DEFAULT_PLAN, normalizePlan, resolveDiveSetup } from '@/lib/dive-plan'
import {
  IDLE_CONTROLS,
  canEndDive,
  createInitialSimulation,
  stepSimulation,
} from '@/lib/physics/simulation'
import type {
  ControlInputs,
  ControlName,
  DiveLog,
  DivePhase,
  DivePlan,
  DiveSetup,
  SimulationState,
  TimeScale,
} from '@/types/dive'

/** Older logs are dropped beyond this many to keep local storage small. */
export const MAX_STORED_LOGS = 20
const STORAGE_KEY = 'dive-lab'
const STORAGE_VERSION = 1

interface DiveState {
  plan: DivePlan
  phase: DivePhase
  /** Configuration frozen when the dive started — plan edits do not affect a running dive. */
  setup: DiveSetup | null
  simulation: SimulationState | null
  controls: ControlInputs
  timeScale: TimeScale
  logs: DiveLog[]
}

interface DiveActions {
  updatePlan: (patch: Partial<DivePlan>) => void
  resetPlan: () => void
  startDive: () => void
  /** Advances the running dive by `realDeltaSeconds` of wall-clock time. */
  tick: (realDeltaSeconds: number) => void
  setControl: (control: ControlName, active: boolean) => void
  releaseControls: () => void
  togglePause: () => void
  /** Pauses a running dive, e.g. when the simulator is no longer on screen. */
  pauseDive: () => void
  setTimeScale: (timeScale: TimeScale) => void
  /** Logs the dive. Returns the new log, or null when the diver is not at the surface. */
  endDive: () => DiveLog | null
  /** Abandons the current dive without logging it. */
  resetDive: () => void
  deleteLog: (id: string) => void
}

export type DiveStore = DiveState & DiveActions

type PersistedState = Pick<DiveState, 'plan' | 'logs'>

export const useDiveStore = create<DiveStore>()(
  persist(
    (set, get) => ({
      plan: DEFAULT_PLAN,
      phase: 'idle',
      setup: null,
      simulation: null,
      controls: IDLE_CONTROLS,
      timeScale: 1,
      logs: [],

      updatePlan: (patch) => set((state) => ({ plan: normalizePlan({ ...state.plan, ...patch }) })),

      resetPlan: () => set({ plan: DEFAULT_PLAN }),

      startDive: () => {
        const setup = resolveDiveSetup(normalizePlan(get().plan))
        set({
          setup,
          simulation: createInitialSimulation(setup),
          phase: 'running',
          controls: IDLE_CONTROLS,
        })
      },

      tick: (realDeltaSeconds) => {
        const { phase, simulation, setup, controls, timeScale } = get()
        if (phase !== 'running' || !simulation || !setup) return
        set({
          simulation: stepSimulation(simulation, controls, setup, realDeltaSeconds * timeScale),
        })
      },

      setControl: (control, active) =>
        set((state) =>
          state.controls[control] === active
            ? state
            : { controls: { ...state.controls, [control]: active } },
        ),

      releaseControls: () => set({ controls: IDLE_CONTROLS }),

      togglePause: () =>
        set((state) => {
          if (state.phase === 'idle') return state
          return {
            phase: state.phase === 'running' ? 'paused' : 'running',
            controls: IDLE_CONTROLS,
          }
        }),

      pauseDive: () =>
        set((state) =>
          state.phase === 'running' ? { phase: 'paused', controls: IDLE_CONTROLS } : state,
        ),

      setTimeScale: (timeScale) => set({ timeScale }),

      endDive: () => {
        const { simulation, setup } = get()
        if (!simulation || !setup || !canEndDive(simulation)) return null

        const log = createDiveLog(simulation, setup, {
          id: createId(),
          endedAt: new Date().toISOString(),
        })
        set((state) => ({
          logs: [log, ...state.logs].slice(0, MAX_STORED_LOGS),
          phase: 'idle',
          setup: null,
          simulation: null,
          controls: IDLE_CONTROLS,
        }))
        return log
      },

      resetDive: () =>
        set({ phase: 'idle', setup: null, simulation: null, controls: IDLE_CONTROLS }),

      deleteLog: (id) => set((state) => ({ logs: state.logs.filter((log) => log.id !== id) })),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({ plan: state.plan, logs: state.logs }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedState>
        return {
          ...current,
          plan: normalizePlan({ ...DEFAULT_PLAN, ...saved.plan }),
          logs: Array.isArray(saved.logs) ? saved.logs : current.logs,
        }
      },
    },
  ),
)
