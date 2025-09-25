export interface DebateStage {
  id: number
  name: string
  duration: number // 秒数
  allowedRoles: string[]
  description?: string
  type: 'speech' | 'question' | 'summary' | 'free'
}

export interface DebateState {
  currentStage: number
  timeRemaining: number
  isRunning: boolean
  isPaused: boolean
  stages: DebateStage[]
  completedStages: number[]
}

export interface RolePermission {
  roleName: string
  hasPermission: boolean
  memberCount: number
}

export const DEBATE_STAGES: DebateStage[] = [
  {
    id: 1,
    name: '正方一辩开篇陈词',
    duration: 210, // 3分30秒
    allowedRoles: ['正方一辩'],
    type: 'speech',
    description: '正方一辩进行开篇立论'
  },
  {
    id: 2,
    name: '反方二辩质询正方一辩',
    duration: 90, // 1分30秒
    allowedRoles: ['反方二辩'],
    type: 'question',
    description: '反方二辩对正方一辩进行质询'
  },
  {
    id: 3,
    name: '反方一辩开篇陈词',
    duration: 210, // 3分30秒
    allowedRoles: ['反方一辩'],
    type: 'speech',
    description: '反方一辩进行开篇立论'
  },
  {
    id: 4,
    name: '正方二辩质询反方一辩',
    duration: 90, // 1分30秒
    allowedRoles: ['正方二辩'],
    type: 'question',
    description: '正方二辩对反方一辩进行质询'
  },
  {
    id: 5,
    name: '反方二辩小结',
    duration: 120, // 2分钟
    allowedRoles: ['反方二辩'],
    type: 'summary',
    description: '反方二辩进行小结陈词'
  },
  {
    id: 6,
    name: '正方二辩小结',
    duration: 120, // 2分钟
    allowedRoles: ['正方二辩'],
    type: 'summary',
    description: '正方二辩进行小结陈词'
  },
  {
    id: 7,
    name: '正反方四辩对话',
    duration: 240, // 4分钟
    allowedRoles: ['正方四辩', '反方四辩'],
    type: 'speech',
    description: '正反方四辩进行对话辩论'
  },
  {
    id: 8,
    name: '正方三辩质询',
    duration: 180, // 3分钟
    allowedRoles: ['正方三辩'],
    type: 'question',
    description: '正方三辩可质询反方一/二/四辩'
  },
  {
    id: 9,
    name: '反方三辩质询',
    duration: 180, // 3分钟
    allowedRoles: ['反方三辩'],
    type: 'question',
    description: '反方三辩可质询正方一/二/四辩'
  },
  {
    id: 10,
    name: '正方三辩总结',
    duration: 240, // 4分钟
    allowedRoles: ['正方三辩'],
    type: 'summary',
    description: '正方三辩进行总结陈词'
  },
  {
    id: 11,
    name: '反方三辩总结',
    duration: 240, // 4分钟
    allowedRoles: ['反方三辩'],
    type: 'summary',
    description: '反方三辩进行总结陈词'
  },
  {
    id: 12,
    name: '全体自由辩论',
    duration: 480, // 8分钟
    allowedRoles: ['正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩'],
    type: 'free',
    description: '全体辩手进行自由辩论'
  },
  {
    id: 13,
    name: '反方四辩总结陈词',
    duration: 240, // 4分钟
    allowedRoles: ['反方四辩'],
    type: 'summary',
    description: '反方四辩进行最终总结陈词'
  },
  {
    id: 14,
    name: '正方四辩总结陈词',
    duration: 240, // 4分钟
    allowedRoles: ['正方四辩'],
    type: 'summary',
    description: '正方四辩进行最终总结陈词'
  }
]