export interface Memo {
  id: string
  content: string
  createdAt: number
  updatedAt: number
  isPinned?: boolean
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  color?: string
  status?: 'todo' | 'completed'
}

export interface DailyLog {
  id: string
  content: string
  date: string
  createdAt: number
  updatedAt: number
}
