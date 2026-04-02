import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { FamilyMember, CurationResult } from '../types'

interface AppState {
  members: FamilyMember[]
  curationResults: Record<string, CurationResult>
  loading: boolean
}

type Action =
  | { type: 'ADD_MEMBER'; payload: FamilyMember }
  | { type: 'UPDATE_MEMBER'; payload: FamilyMember }
  | { type: 'REMOVE_MEMBER'; payload: string }
  | { type: 'SET_CURATION'; payload: CurationResult }
  | { type: 'SET_LOADING'; payload: boolean }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] }
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(m =>
          m.id === action.payload.id ? action.payload : m
        ),
      }
    case 'REMOVE_MEMBER':
      return {
        ...state,
        members: state.members.filter(m => m.id !== action.payload),
      }
    case 'SET_CURATION':
      return {
        ...state,
        curationResults: {
          ...state.curationResults,
          [action.payload.memberId]: action.payload,
        },
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

function loadFromStorage(): FamilyMember[] {
  try {
    const raw = localStorage.getItem('nutrition_members')
    if (raw) return JSON.parse(raw) as FamilyMember[]
  } catch {
    // ignore
  }
  return []
}

const initialState: AppState = {
  members: loadFromStorage(),
  curationResults: {},
  loading: false,
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    localStorage.setItem('nutrition_members', JSON.stringify(state.members))
  }, [state.members])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
