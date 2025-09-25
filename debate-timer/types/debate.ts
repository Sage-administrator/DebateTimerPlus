export interface DebateStage {
  id: number
  name: string
  duration: number // 秒数
  allowedRoles: string[]
  description?: string
  type: 'speech' | 'question' | 'summary' | 'special' | 'dual-timer'
}

export interface DebateState {
  currentStage: number
  timeRemaining: number
  isRunning: boolean
  isPaused: boolean
  stages: DebateStage[]
  completedStages: number[]
  isConnectedToQQ: boolean
  connectionStatus: string
  dualTimer: {
    positiveTime: number
    negativeTime: number
    activeTimer: 'positive' | 'negative'
    isRunning: boolean
  }
}

export interface QQBotResponse {
  success: boolean
  message: string
  data?: any
}

export const DEBATE_STAGES: DebateStage[] = [
  // 前置环节
  {
    id: 1,
    name: '彩排·试音',
    duration: 0,
    allowedRoles: ['主持人'],
    description: '彩排和试音环节',
    type: 'special'
  },
  {
    id: 2,
    name: '提示音介绍',
    duration: 0,
    allowedRoles: ['主持人'],
    description: '提示音介绍环节',
    type: 'special'
  },
  {
    id: 3,
    name: '开场',
    duration: 0,
    allowedRoles: ['主持人'],
    description: '开场环节',
    type: 'special'
  },
  {
    id: 4,
    name: '介绍双方',
    duration: 0,
    allowedRoles: ['主持人'],
    description: '介绍双方辩手',
    type: 'special'
  },
  // 正式辩论环节
  {
    id: 5,
    name: '正方一辩开篇陈词',
    duration: 180, // 3分钟
    allowedRoles: ['正方一辩']
  },
  {
    id: 6,
    name: '反方二辩质询正方一辩',
    duration: 90, // 1分30秒
    allowedRoles: ['反方二辩']
  },
  {
    id: 7,
    name: '反方一辩开篇陈词',
    duration: 180, // 3分钟
    allowedRoles: ['反方一辩']
  },
  {
    id: 8,
    name: '正方二辩质询反方一辩',
    duration: 90, // 1分30秒
    allowedRoles: ['正方二辩']
  },
  {
    id: 9,
    name: '反方二辩小结',
    duration: 120, // 2分钟
    allowedRoles: ['反方二辩']
  },
  {
    id: 10,
    name: '正方二辩小结',
    duration: 120, // 2分钟
    allowedRoles: ['正方二辩']
  },
  {
    id: 11,
    name: '正方四辩与反方四辩对话',
    duration: 300, // 5分钟
    allowedRoles: ['正方四辩', '反方四辩']
  },
  {
    id: 12,
    name: '正方三辩质询',
    duration: 180, // 3分钟
    allowedRoles: ['正方三辩'],
    description: '可质询反方一/二/四辩'
  },
  {
    id: 13,
    name: '反方三辩质询',
    duration: 180, // 3分钟
    allowedRoles: ['反方三辩'],
    description: '可质询正方一/二/四辩'
  },
  {
    id: 14,
    name: '正方三辩总结',
    duration: 240, // 4分钟
    allowedRoles: ['正方三辩']
  },
  {
    id: 15,
    name: '反方三辩总结',
    duration: 240, // 4分钟
    allowedRoles: ['反方三辩']
  },
  {
    id: 16,
    name: '全体自由辩论',
    duration: 480, // 8分钟
    allowedRoles: ['正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩']
  },
  {
    id: 17,
    name: '反方四辩总结陈词',
    duration: 240, // 4分钟
    allowedRoles: ['反方四辩']
  },
  {
    id: 18,
    name: '正方四辩总结陈词',
    duration: 240, // 4分钟
    allowedRoles: ['正方四辩']
  },
  // 结尾环节
  {
    id: 19,
    name: '评委点评',
    duration: 600, // 10分钟
    allowedRoles: ['评委']
  },
  {
    id: 20,
    name: '公布结果',
    duration: 180, // 3分钟
    allowedRoles: ['主持人']
  }
]']
  }
]