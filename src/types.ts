export interface Item {
  id: string
  name: string
  elo: number
}

export interface SavedList {
  id: string
  name: string
  items: Item[]
  completedPairs: string[]
  createdAt: number
  updatedAt: number
}

export type AppPhase = 'input' | 'comparing'

