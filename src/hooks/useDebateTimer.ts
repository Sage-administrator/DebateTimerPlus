import { useState, useEffect, useCallback } from 'react'
import { DEBATE_STAGES, type DebateState, type RolePermission } from '../types/debate'

export const useDebateTimer = () => {
  const [state, setState] = useState<DebateState & {
    rolePermissions: RolePermission[]
    isConnectedToQQ: boolean
    connectionStatus: string
  }>({
    currentStage: 1,
    timeRemaining: DEBATE_STAGES[0].duration,
    isRunning: false,
    isPaused: false,
    stages: DEBATE_STAGES,
    completedStages: [],
    rolePermissions: [
      { roleName: '正方一辩', hasPermission: true, memberCount: 0 },
      { roleName: '正方二辩', hasPermission: false, memberCount: 0 },
      { roleName: '正方三辩', hasPermission: false, memberCount: 0 },
      { roleName: '正方四辩', hasPermission: false, memberCount: 0 },
      { roleName: '反方一辩', hasPermission: false, memberCount: 0 },
      { roleName: '反方二辩', hasPermission: false, memberCount: 0 },
      { roleName: '反方三辩', hasPermission: false, memberCount: 0 },
      { roleName: '反方四辩', hasPermission: false, memberCount: 0 },
      { roleName: '主持人', hasPermission: true, memberCount: 0 },
      { roleName: '后台', hasPermission: true, memberCount: 0 }
    ],
    isConnectedToQQ: false,
    connectionStatus: '未连接'
  })

  // 计算属性
  const currentStageInfo = state.stages.find(stage => stage.id === state.currentStage) || null
  
  const formattedTime = (() => {
    const minutes = Math.floor(state.timeRemaining / 60)
    const seconds = state.timeRemaining % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })()
  
  const progress = (() => {
    if (!currentStageInfo) return 0
    const totalTime = currentStageInfo.duration
    const elapsed = totalTime - state.timeRemaining
    return (elapsed / totalTime) * 100
  })()
  
  const isTimeWarning = state.timeRemaining <= 30 && state.timeRemaining > 10
  const isTimeCritical = state.timeRemaining <= 10

  // 更新角色权限
  const updateRolePermissions = useCallback((allowedRoles: string[]) => {
    setState(prev => ({
      ...prev,
      rolePermissions: prev.rolePermissions.map(role => ({
        ...role,
        hasPermission: ['主持人', '后台'].includes(role.roleName) || allowedRoles.includes(role.roleName)
      }))
    }))
    
    // 同步到QQ机器人
    syncPermissionsToQQ(allowedRoles)
  }, [])

  // 同步权限到QQ机器人
  const syncPermissionsToQQ = async (allowedRoles: string[]) => {
    if (!state.isConnectedToQQ) return
    
    try {
      const debateRoles = ['正方一辩', '正方二辩', '正方三辩', '正方四辩', 
                          '反方一辩', '反方二辩', '反方三辩', '反方四辩']
      
      for (const role of debateRoles) {
        const hasPermission = allowedRoles.includes(role)
        await setRolePermission(role, hasPermission)
      }
    } catch (error) {
      console.error('同步权限到QQ机器人失败:', error)
    }
  }

  // 设置角色权限
  const setRolePermission = async (roleName: string, allow: boolean) => {
    try {
      const response = await fetch('/api/qq-bot/permission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roleName,
          allow
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`设置${roleName}权限失败:`, error)
      throw error
    }
  }

  // 初始化环节
  const initializeStage = useCallback((stageId: number) => {
    const stage = DEBATE_STAGES.find(s => s.id === stageId)
    if (stage) {
      setState(prev => ({
        ...prev,
        currentStage: stageId,
        timeRemaining: stage.duration,
        isRunning: false,
        isPaused: false
      }))
      updateRolePermissions(stage.allowedRoles)
    }
  }, [updateRolePermissions])

  // 开始计时
  const startTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false
    }))
  }, [])

  // 暂停计时
  const pauseTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true
    }))
  }, [])

  // 重置计时
  const resetTimer = useCallback(() => {
    if (currentStageInfo) {
      setState(prev => ({
        ...prev,
        timeRemaining: currentStageInfo.duration,
        isRunning: false,
        isPaused: false
      }))
    }
  }, [currentStageInfo])

  // 下一环节
  const nextStage = useCallback(() => {
    setState(prev => {
      const newCompletedStages = prev.currentStage > 0 ? 
        [...prev.completedStages, prev.currentStage] : prev.completedStages
      
      if (prev.currentStage < DEBATE_STAGES.length) {
        const nextStageId = prev.currentStage + 1
        const nextStage = DEBATE_STAGES.find(s => s.id === nextStageId)
        
        if (nextStage) {
          updateRolePermissions(nextStage.allowedRoles)
          return {
            ...prev,
            currentStage: nextStageId,
            timeRemaining: nextStage.duration,
            isRunning: false,
            isPaused: false,
            completedStages: newCompletedStages
          }
        }
      }
      
      return {
        ...prev,
        isRunning: false,
        isPaused: false,
        completedStages: newCompletedStages
      }
    })
  }, [updateRolePermissions])

  // 上一环节
  const previousStage = useCallback(() => {
    if (state.currentStage > 1) {
      const prevStageId = state.currentStage - 1
      setState(prev => ({
        ...prev,
        completedStages: prev.completedStages.filter(id => id !== prevStageId)
      }))
      initializeStage(prevStageId)
    }
  }, [state.currentStage, initializeStage])

  // 计时器tick
  const tick = useCallback(() => {
    setState(prev => {
      if (prev.isRunning && prev.timeRemaining > 0) {
        const newTimeRemaining = prev.timeRemaining - 1
        
        // 时间结束自动切换到下一环节
        if (newTimeRemaining === 0) {
          // 播放提示音
          try {
            const audio = new Audio('/notification.mp3')
            audio.play().catch(() => console.log('播放提示音'))
          } catch (error) {
            console.log('播放提示音')
          }
          
          return {
            ...prev,
            timeRemaining: newTimeRemaining,
            isRunning: false,
            isPaused: false
          }
        }
        
        return {
          ...prev,
          timeRemaining: newTimeRemaining
        }
      }
      return prev
    })
  }, [])

  // 更新连接状态
  const updateConnectionStatus = useCallback((connected: boolean, status: string) => {
    setState(prev => ({
      ...prev,
      isConnectedToQQ: connected,
      connectionStatus: status
    }))
  }, [])

  // 计时器效果
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (state.isRunning) {
      interval = setInterval(tick, 1000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [state.isRunning, tick])

  // 检查QQ机器人连接状态
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/qq-bot/status')
        if (response.ok) {
          const data = await response.json()
          updateConnectionStatus(data.connected, data.status)
        }
      } catch (error) {
        console.error('检查QQ机器人连接状态失败:', error)
        updateConnectionStatus(false, '连接失败')
      }
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // 每30秒检查一次
    
    return () => clearInterval(interval)
  }, [updateConnectionStatus])

  return {
    // 状态
    ...state,
    currentStageInfo,
    formattedTime,
    progress,
    isTimeWarning,
    isTimeCritical,
    
    // 方法
    initializeStage,
    startTimer,
    pauseTimer,
    resetTimer,
    nextStage,
    previousStage,
    setRolePermission,
    updateConnectionStatus
  }
}