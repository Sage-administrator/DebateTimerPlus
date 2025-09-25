import { defineStore } from 'pinia'
import type { DebateStage } from '~/types/debate'

let permissionSyncTimer: ReturnType<typeof setTimeout> | null = null

// #region 类型定义
interface SingleTimerState {
  type: 'speech' | 'question' | 'summary' | 'special'
  timeRemaining: number
  isRunning: boolean
  isPaused: boolean
}

interface DualTimerState {
  type: 'dual-timer'
  positiveTime: number
  negativeTime: number
  activeTimer: 'positive' | 'negative'
  isRunning: boolean
  isPaused: boolean
}

type StageState = SingleTimerState | DualTimerState

interface DebateState {
  currentStage: number
  stages: DebateStage[]
  stageStates: Record<number, StageState>
  completedStages: number[]
  isConnectedToQQ: boolean
  connectionStatus: string
  ui?: Record<string, any>
}
// #endregion

// 4v4赛制 - 18个环节
const DEBATE_STAGES: DebateStage[] = [
  { id: 1, name: '彩排·试音', duration: 0, allowedRoles: ['主持人', '正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩', '评委', '观众'], description: '彩排和试音环节', type: 'special' },
  { id: 2, name: '开场', duration: 0, allowedRoles: ['主持人'], description: '主持人开场', type: 'special' },
  { id: 3, name: '正方一辩发言', duration: 210, allowedRoles: ['正方一辩'], description: '正方一辩进行开篇立论', type: 'speech' },
  { id: 4, name: '反方二辩质询正方一辩', duration: 120, allowedRoles: ['反方二辩', '正方一辩'], description: '反方二辩对正方一辩进行质询', type: 'question' },
  { id: 5, name: '反方一辩发言', duration: 210, allowedRoles: ['反方一辩'], description: '反方一辩进行开篇立论', type: 'speech' },
  { id: 6, name: '正方二辩质询反方一辩', duration: 120, allowedRoles: ['正方二辩', '反方一辩'], description: '正方二辩对反方一辩进行质询', type: 'question' },
  { id: 7, name: '反方二辩质询小结', duration: 90, allowedRoles: ['反方二辩'], description: '反方二辩就质询内容进行小结', type: 'summary' },
  { id: 8, name: '正方二辩质询小结', duration: 90, allowedRoles: ['正方二辩'], description: '正方二辩就质询内容进行小结', type: 'summary' },
  { id: 9, name: '正反方四辩对辩', duration: 90, allowedRoles: ['正方四辩', '反方四辩'], description: '正反方四辩进行对辩', type: 'dual-timer' },
  { id: 10, name: '正方三辩盘问', duration: 90, allowedRoles: ['正方三辩', '反方一辩', '反方二辩', '反方四辩'], description: '正方三辩盘问反方一、二、四辩', type: 'question' },
  { id: 11, name: '反方三辩盘问', duration: 90, allowedRoles: ['反方三辩', '正方一辩', '正方二辩', '正方四辩'], description: '反方三辩盘问正方一、二、四辩', type: 'question' },
  { id: 12, name: '正方三辩盘问小结', duration: 90, allowedRoles: ['正方三辩'], description: '正方三辩就盘问环节进行小结', type: 'summary' },
  { id: 13, name: '反方三辩盘问小结', duration: 90, allowedRoles: ['反方三辩'], description: '反方三辩就盘问环节进行小结', type: 'summary' },
  { id: 14, name: '自由辩论', duration: 240, allowedRoles: ['正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩'], description: '双方进行自由辩论', type: 'dual-timer' },
  { id: 15, name: '反方四辩总结陈词', duration: 210, allowedRoles: ['反方四辩'], description: '反方四辩进行总结陈词', type: 'summary' },
  { id: 16, name: '正方四辩总结陈词', duration: 210, allowedRoles: ['正方四辩'], description: '正方四辩进行总结陈词', type: 'summary' },
  { id: 17, name: '评委点评', duration: 0, allowedRoles: ['评委'], description: '评委点评环节', type: 'special' },
  { id: 18, name: '公布结果', duration: 0, allowedRoles: ['主持人'], description: '公布结果环节', type: 'special' },
  { id: 19, name: '本场辩论比赛圆满结束', duration: 0, allowedRoles: ['主持人', '后台', '评委', '正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩', '观众'], description: '比赛结束，所有人可发言', type: 'special' }
]

/** 基于给定的项目环节生成初始状态，避免使用默认 DEBATE_STAGES */
const generateInitialStatesFrom = (stages: DebateStage[]): Record<number, StageState> => {
  const states: Record<number, StageState> = {}
  stages.forEach(stage => {
    if (stage.type === 'dual-timer') {
      states[stage.id] = {
        type: 'dual-timer',
        positiveTime: ((stage as any).positiveDuration ?? stage.duration),
        negativeTime: ((stage as any).negativeDuration ?? stage.duration),
        activeTimer: 'positive',
        isRunning: false,
        isPaused: false
      }
    } else {
      states[stage.id] = {
        type: stage.type,
        timeRemaining: stage.duration,
        isRunning: false,
        isPaused: false
      }
    }
  })
  return states
}

export const useDebateStore = defineStore('debate', {
  state: (): DebateState => ({
    currentStage: 1,
    // 初始不加载默认环节，待实际项目数据到达后再 setStages，避免 3:30 → 2:00 的闪变
    stages: [],
    stageStates: {},
    completedStages: [],
    isConnectedToQQ: false,
    connectionStatus: '未连接',
    ui: {}
  }),

  getters: {
    currentUi: (state) => state.ui || {},
    currentStageInfo: (state): DebateStage | null => {
      return state.stages.find(stage => stage.id === state.currentStage) || null
    },
    currentStageState: (state): StageState | null => {
      return state.stageStates[state.currentStage] || null
    },
    isRunning(): boolean {
      return this.currentStageState?.isRunning ?? false
    },
    isPaused(): boolean {
      return this.currentStageState?.isPaused ?? false
    },
    timeRemaining(): number {
      const state = this.currentStageState
      if (state && state.type !== 'dual-timer') {
        return state.timeRemaining
      }
      return 0
    },
    dualTimer(state): DualTimerState {
      const s = state.stageStates[state.currentStage]
      if (s && s.type === 'dual-timer') {
        return s
      }
      // Return a default/dummy object to prevent errors in the template
      return { type: 'dual-timer', positiveTime: 0, negativeTime: 0, activeTimer: 'positive', isRunning: false, isPaused: false }
    },
    formattedTime(): string {
      const minutes = Math.floor(this.timeRemaining / 60)
      const seconds = this.timeRemaining % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    isTimeWarning(): boolean {
      const stageInfo = this.currentStageInfo
      if (!stageInfo || stageInfo.type === 'dual-timer') return false
      return this.timeRemaining <= stageInfo.duration * 0.2 && this.timeRemaining > stageInfo.duration * 0.1
    },
    isTimeCritical(): boolean {
      const stageInfo = this.currentStageInfo
      if (!stageInfo || stageInfo.type === 'dual-timer') return false
      return this.timeRemaining <= stageInfo.duration * 0.1
    }
  },

  actions: {
    setUi(payload: Record<string, any>) {
      this.ui = { ...(this.ui || {}), ...(payload || {}) }
    },
    // 跳转到指定环节（含1秒防抖同步权限）
    goToStage(target: number) {
      try {
        // 保证环节定义最新
        // @ts-ignore
        this.ensureStagesUpToDate && this.ensureStagesUpToDate()
        const max = this.stages.length
        if (!Number.isFinite(target)) return
        if (target < 1) target = 1
        if (target > max) target = max
        if (target === this.currentStage) return
        this.currentStage = target
        // 使用已实现的防抖下发
        // @ts-ignore
        this.schedulePermissionSync ? this.schedulePermissionSync() : (async () => {
          // 兜底方案：无防抖时保持原先流程
          await this.checkQQBotStatus()
          this.syncPermissionsWithQQ()
        })()
      } catch (e) {
        // 静默失败，避免 UI 阻塞
      }
    },
    // 仅校验计时状态，不覆盖项目自定义环节
    ensureStagesUpToDate() {
      // 为当前项目的每个环节补齐初始状态（根据环节自身的类型与时长）
      this.stages.forEach(s => {
        if (!this.stageStates[s.id]) {
          if (s.type === 'dual-timer') {
            this.stageStates[s.id] = {
              type: 'dual-timer',
              positiveTime: ((s as any).positiveDuration ?? s.duration),
              negativeTime: ((s as any).negativeDuration ?? s.duration),
              activeTimer: 'positive',
              isRunning: false,
              isPaused: false
            }
          } else {
            this.stageStates[s.id] = {
              type: s.type as any,
              timeRemaining: s.duration,
              isRunning: false,
              isPaused: false
            }
          }
        }
      })
      // 清理已不存在的状态与完成列表
      Object.keys(this.stageStates).forEach(k => {
        const id = Number(k)
        if (!this.stages.some(s => s.id === id)) delete this.stageStates[id]
      })
      this.completedStages = this.completedStages.filter(id => this.stages.some(s => s.id === id))
    },
    // 防抖：切换环节后 1 秒再同步权限；期间若继续切换则重置计时
    schedulePermissionSync() {
      if (permissionSyncTimer) {
        try { clearTimeout(permissionSyncTimer as unknown as number) } catch {}
        permissionSyncTimer = null
      }
      permissionSyncTimer = setTimeout(async () => {
        await this.checkQQBotStatus()
        this.syncPermissionsWithQQ()
      }, 1000)
    },
    startTimer() {
      const state = this.currentStageState
      if (!state) return
      state.isRunning = true
      state.isPaused = false
    },

    pauseTimer() {
      const state = this.currentStageState
      if (!state) return
      state.isRunning = false
      state.isPaused = true
    },

    resetTimer() {
      const info = this.currentStageInfo
      const state = this.currentStageState
      if (!state || !info) return
      if (state.type === 'dual-timer') {
        // 双计时环节请使用 resetDualTimer；这里兼容处理
        state.positiveTime = ((info as any).positiveDuration ?? info.duration)
        state.negativeTime = ((info as any).negativeDuration ?? info.duration)
        state.activeTimer = 'positive'
        state.isRunning = false
        state.isPaused = false
      } else {
        // 使用当前环节真实时长重置，避免闪现类型预设时长
        state.timeRemaining = info.duration
        state.isRunning = false
        state.isPaused = false
      }
    },

    resetDualTimer(type: 'positive' | 'negative' | 'both' = 'both') {
      const state = this.currentStageState
      const stageInfo = this.currentStageInfo
      if (!state || state.type !== 'dual-timer' || !stageInfo) return

      const initialPositive = ((stageInfo as any).positiveDuration ?? stageInfo.duration)
const initialNegative = ((stageInfo as any).negativeDuration ?? stageInfo.duration)

      if (type === 'both') {
        // 同时重置双方：停止计时、清除暂停、重置激活侧
        state.positiveTime = initialPositive
        state.negativeTime = initialNegative
        state.isRunning = false
        state.isPaused = false
        state.activeTimer = 'positive'
        return
      }

      // 仅重置单侧：不改变另一侧时间，不改变运行/暂停状态，不改变激活侧
      if (type === 'positive') {
        state.positiveTime = initialTime
        return
      }
      if (type === 'negative') {
        state.negativeTime = initialTime
        return
      }
    },

    setCustomTime(seconds: number) {
      const state = this.currentStageState
      if (state && state.type !== 'dual-timer') {
        state.timeRemaining = seconds
        state.isRunning = false
        state.isPaused = false
      }
    },

    setCustomDualTime(positiveTime: number, negativeTime: number) {
      const state = this.currentStageState
      if (state && state.type === 'dual-timer') {
        state.positiveTime = positiveTime
        state.negativeTime = negativeTime
        state.isRunning = false
        state.isPaused = false
      }
    },

    tick() {
      const state = this.currentStageState
      if (!state || !state.isRunning || state.type === 'dual-timer') return

      if (state.timeRemaining > 0) {
        state.timeRemaining--
        this.playTimerSound(state.timeRemaining)
      }
      if (state.timeRemaining === 0) {
        state.isRunning = false
        this.completeCurrentStage()
      }
    },

    tickDualTimer() {
      const state = this.currentStageState
      if (!state || !state.isRunning || state.type !== 'dual-timer') return

      if (state.activeTimer === 'positive' && state.positiveTime > 0) {
        state.positiveTime--
        this.playTimerSound(state.positiveTime)
      } else if (state.activeTimer === 'negative' && state.negativeTime > 0) {
        state.negativeTime--
        this.playTimerSound(state.negativeTime)
      }
    },

    startDualTimer() {
      const state = this.currentStageState
      if (state && state.type === 'dual-timer') {
        if (state.positiveTime > 0 || state.negativeTime > 0) {
          // 若当前侧已耗尽，自动切到有剩余的一侧
          if (state.activeTimer === 'positive' && state.positiveTime === 0 && state.negativeTime > 0) {
            state.activeTimer = 'negative'
          } else if (state.activeTimer === 'negative' && state.negativeTime === 0 && state.positiveTime > 0) {
            state.activeTimer = 'positive'
          }
          state.isRunning = true
          state.isPaused = false
        }
      }
    },

    pauseDualTimer() {
      const state = this.currentStageState
      if (state && state.type === 'dual-timer') {
        state.isRunning = false
        state.isPaused = true
      }
    },

    switchDualTimer() {
      const state = this.currentStageState
      if (state && state.type === 'dual-timer') {
        const next = state.activeTimer === 'positive' ? 'negative' : 'positive'
        const nextHas = next === 'positive' ? state.positiveTime > 0 : state.negativeTime > 0
        const currHas = state.activeTimer === 'positive' ? state.positiveTime > 0 : state.negativeTime > 0

        if (nextHas) {
          state.activeTimer = next
          state.isRunning = true
          state.isPaused = false
        } else if (currHas) {
          // 保持在当前侧继续计时
          state.isRunning = true
          state.isPaused = false
        } else {
          // 双方均耗尽，停止
          state.isRunning = false
          state.isPaused = true
        }
      }
    },

    startPositiveTimer() {
      const state = this.currentStageState
      if (state && state.type === 'dual-timer') {
        state.activeTimer = 'positive'
        state.isRunning = true
        state.isPaused = false
      }
    },

    startNegativeTimer() {
      const state = this.currentStageState
      if (state && state.type === 'dual-timer') {
        state.activeTimer = 'negative'
        state.isRunning = true
        state.isPaused = false
      }
    },

    async nextStage() {
      this.ensureStagesUpToDate()
      if (this.currentStage < this.stages.length) {
        this.completeCurrentStage()
        this.currentStage++
        // 确保新增环节的状态已按项目数据初始化
        if (!this.stageStates[this.currentStage]) {
          const initialStates = generateInitialStatesFrom(this.stages)
          if (initialStates[this.currentStage]) {
            this.stageStates[this.currentStage] = JSON.parse(JSON.stringify(initialStates[this.currentStage]))
          }
        }
        this.schedulePermissionSync()
      }
    },

    async previousStage() {
      this.ensureStagesUpToDate()
      if (this.currentStage > 1) {
        this.currentStage--
        // 确保切回的环节状态已按项目数据初始化
        if (!this.stageStates[this.currentStage]) {
          const initialStates = generateInitialStatesFrom(this.stages)
          if (initialStates[this.currentStage]) {
            this.stageStates[this.currentStage] = JSON.parse(JSON.stringify(initialStates[this.currentStage]))
          }
        }
        this.completedStages = this.completedStages.filter(id => id !== this.currentStage)
        this.schedulePermissionSync()
      }
    },

    completeCurrentStage() {
      if (this.currentStage > 0 && !this.completedStages.includes(this.currentStage)) {
        this.completedStages.push(this.currentStage)
      }
    },

    playTimerSound(timeRemaining: number) {
      try {
        let audioFile = ''
        if (timeRemaining === 30) audioFile = '/30.mp3'
        else if (timeRemaining === 5) audioFile = '/5.mp3'
        else if (timeRemaining === 0) audioFile = '/End.mp3'

        if (audioFile) {
          const audio = new Audio(audioFile)
          audio.play().catch(() => console.log(`播放提示音: ${audioFile}`))
        }
      } catch (error) {
        console.log('播放提示音失败:', error)
      }
    },

    updateConnectionStatus(connected: boolean, status: string) {
      this.isConnectedToQQ = connected
      this.connectionStatus = status
    },

    async syncPermissionsWithQQ() {
      if (!this.currentStageInfo) return
      
      // 先更新状态为正在同步
      this.updateConnectionStatus(false, '正在同步...')
      
      try {
        const response = await fetch('/api/qq-bot/stage-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: this.currentStage,
            allowedRoles: this.currentStageInfo.allowedRoles,
            stageName: this.currentStageInfo.name
          })
        })
        
        const result = await response.json()
        if (result.success) {
          this.updateConnectionStatus(true, '权限已同步')
          console.log(`环节 ${this.currentStage} 权限同步成功:`, this.currentStageInfo.allowedRoles)
        } else {
          // 根据错误消息设置不同的状态
          let status = '同步失败'
          if (result.message.includes('未运行') || result.message.includes('未连接')) {
            status = 'QQ机器人未运行'
          } else if (result.message.includes('超时')) {
            status = 'QQ机器人无响应'
          } else if (result.message.includes('未连接')) {
            status = 'QQ机器人离线'
          }
          
          this.updateConnectionStatus(false, status)
          console.error('权限同步失败:', result.message)
        }
      } catch (error) {
        console.error('同步权限失败:', error)
        this.updateConnectionStatus(false, 'QQ机器人未运行')
      }
    },

    // 添加检查QQ机器人状态的方法
    async checkQQBotStatus() {
      try {
        const response = await fetch('/api/qq-bot/status', {
          method: 'GET'
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.connected) {
            this.updateConnectionStatus(true, '已连接')
            return true
          } else {
            this.updateConnectionStatus(false, 'QQ机器人离线')
            return false
          }
        } else {
          this.updateConnectionStatus(false, 'QQ机器人未运行')
          return false
        }
      } catch (error) {
        this.updateConnectionStatus(false, 'QQ机器人未运行')
        return false
      }
    },

    // 从 JSON API 加载环节，并初始化状态
    async loadStages() {
      try {
        const res = await fetch('/api/stages', { method: 'GET' })
        if (!res.ok) return
        const data = await res.json()
        if (data?.success && Array.isArray(data.data)) {
          this.setStages(data.data)
        }
      } catch {}
    },

    // 设置环节并确保 stageStates/完成列表/当前环节有效
    setStages(newStages: DebateStage[]) {
      if (!Array.isArray(newStages) || newStages.length === 0) return
      // 排序并赋值（优先使用 order，回退到 id）
      const sorted = [...newStages].sort((a, b) => ((a as any).order ?? a.id) - ((b as any).order ?? b.id))
      this.stages = sorted

      // 为所有环节构建初始状态（并用项目数据无条件覆盖，避免沿用默认环节的时长/类型）
      const initialStates: Record<number, any> = {}
      sorted.forEach(stage => {
        if (stage.type === 'dual-timer') {
          initialStates[stage.id] = {
            type: 'dual-timer',
            positiveTime: ((stage as any).positiveDuration ?? stage.duration),
            negativeTime: ((stage as any).negativeDuration ?? stage.duration),
            activeTimer: 'positive',
            isRunning: false,
            isPaused: false
          }
        } else {
          initialStates[stage.id] = {
            type: stage.type as any,
            timeRemaining: stage.duration,
            isRunning: false,
            isPaused: false
          }
        }
      })
      // 直接以项目的定义重建各环节状态，确保时长/类型正确
      for (const s of sorted) {
        this.stageStates[s.id] = JSON.parse(JSON.stringify(initialStates[s.id]))
      }
      // 清理已不存在的状态
      Object.keys(this.stageStates).forEach(k => {
        const id = Number(k)
        if (!sorted.some(s => s.id === id)) delete this.stageStates[id]
      })
      // 过滤完成列表
      this.completedStages = this.completedStages.filter(id => sorted.some(s => s.id === id))
      // 校正当前环节
      const maxId = Math.max(...sorted.map(s => s.id))
      if (this.currentStage > maxId) this.currentStage = maxId
      if (!sorted.some(s => s.id === this.currentStage)) this.currentStage = (sorted[0]?.id ?? 1)
    }
  }
})