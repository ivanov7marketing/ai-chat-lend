export type MessageRole = 'bot' | 'user'

export interface Message {
  id: string
  role: MessageRole
  text: string
  timestamp: number
}

export type FunnelStepType = 'buttons' | 'text-input'

export interface FunnelStep {
  id: string
  question: string
  type: FunnelStepType
  options?: string[]
  placeholder?: string
  skipIf?: { stepId: string; value: string }
}

export type ChatState =
  | 'IDLE'
  | 'WELCOME'
  | 'FUNNEL'
  | 'CALCULATING'
  | 'RESULT'
  | 'LEAD_CAPTURE'
  | 'FREE_CHAT'

export interface FunnelAnswers {
  area?: string
  rooms?: string
  condition?: string
  repairType?: string
  replanning?: string
  design?: string
  segment?: string
  ceilingHeight?: string
  wallMaterial?: string
  blueprint?: string
}
