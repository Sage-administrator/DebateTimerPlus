<template>
  <div class="debate-timer">
    <!-- 当前环节信息 -->
    <div class="debate-card mb-6">
      <div class="text-center">
        <div class="text-sm text-gray-500 mb-2">第 {{ currentStage }} 环节</div>
        <h2 class="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
          {{ currentStageInfo?.name || '准备开始' }}
        </h2>
        <p class="text-gray-600">
          {{ currentStageInfo?.description }}
        </p>
      </div>
    </div>

    <!-- 计时器显示 -->
    <div class="debate-card mb-6">
      <div class="text-center">
        <!-- 双计时器显示 -->
        <div v-if="currentStageInfo?.type === 'dual-timer'" class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-sm text-gray-500 mb-2">正方</div>
            <div 
              class="timer-display text-2xl"
              :style="{ color: 'rgb(179, 37, 37)' }"
            >
              {{ formatDualTime(dualTimer.positiveTime) }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-sm text-gray-500 mb-2">反方</div>
            <div 
              class="timer-display text-2xl"
              :style="{ color: 'rgb(3, 105, 161)' }"
            >
              {{ formatDualTime(dualTimer.negativeTime) }}
            </div>
          </div>
        </div>

        <!-- 单计时器显示 -->
        <div v-else class="timer-display mb-4 text-gray-800">
          {{ formattedTime }}
        </div>
        
        <!-- 进度条 -->
        <div v-if="currentStageInfo?.type !== 'dual-timer'" class="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            class="h-3 rounded-full transition-all duration-1000 bg-blue-500"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <!-- 状态指示 -->
        <div class="flex justify-center items-center space-x-4 text-sm">
          <span 
            class="px-3 py-1 rounded-full"
            :class="{
              'bg-green-100 text-green-800': isRunning || dualTimer.isRunning,
              'bg-yellow-100 text-yellow-800': isPaused,
              'bg-gray-100 text-gray-800': !isRunning && !isPaused && !dualTimer.isRunning
            }"
          >
            {{ 
              (isRunning || dualTimer.isRunning) ? '进行中' : 
              isPaused ? '已暂停' : '未开始'
            }}
          </span>
          
          <span 
            class="px-3 py-1 rounded-full"
            :class="{
              'bg-green-100 text-green-800': isConnectedToQQ,
              'bg-red-100 text-red-800': !isConnectedToQQ
            }"
          >
            QQ机器人: {{ connectionStatus }}
          </span>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="debate-card mb-6">
      <!-- 双计时器控制 -->
      <div v-if="currentStageInfo?.type === 'dual-timer'" class="space-y-4">
        <div class="text-center text-sm text-gray-600 mb-2">
          快捷键：句号(.) 启动正方 | 逗号(,) 启动反方 | 空格 切换/开始
        </div>
        <div class="flex flex-wrap justify-center gap-3">
          <button 
            v-if="!dualTimer.isRunning"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="startDualTimer"
          >
            开始
          </button>
          
          <button 
            v-if="dualTimer.isRunning"
            class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="pauseDualTimer"
          >
            暂停
          </button>
          
          <button 
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="startPositiveTimer"
            :disabled="dualTimer.positiveTime === 0"
          >
            启动正方 (.)
          </button>
          
          <button 
            class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="startNegativeTimer"
            :disabled="dualTimer.negativeTime === 0"
            :class="{
              'bg-red-700': dualTimer.isRunning && dualTimer.activeTimer === 'negative'
            }"
          >
            启动反方 (,)
          </button>
          
          <!-- 添加测试按钮，用于调试 -->
          <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="testButtons"
          >
            测试按钮
          </button>
          
          <button 
            class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="switchDualTimer"
          >
            切换计时器 (空格)
          </button>
          
          <button 
            class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="showResetModal = true"
          >
            重置
          </button>
        </div>
      </div>

      <!-- 单计时器控制 -->
      <div v-else class="flex flex-wrap justify-center gap-3">
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center space-x-2"
          @click="startTimer"
          :disabled="currentStage === 0 || isRunning"
        >
          <span>启动计时(空格)</span>
        </button>
        
        <button 
          class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors"
          @click="pauseTimer"
          :disabled="currentStage === 0 || !isRunning"
        >
          中断(P)
        </button>
        
        <button 
          class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
          @click="showResetModal = true"
          :disabled="currentStage === 0"
        >
          重置
        </button>
        
        <button 
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
          @click="showTimeSettingModal = true"
          :disabled="currentStage === 0"
        >
          设置时间
        </button>
      </div>

      <!-- 通用控制按钮 -->
      <div class="flex flex-wrap justify-center gap-3 mt-4">
        <button 
          class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          @click="nextStage"
          :disabled="currentStage >= 20"
        >
          下一环节
        </button>
        
        <button 
          class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
          @click="previousStage"
          :disabled="currentStage <= 1"
        >
          上一环节
        </button>
      </div>
    </div>

    <!-- 重置确认弹窗 -->
    <div v-if="showResetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">重置确认</h3>
        
        <div v-if="currentStageInfo?.type === 'dual-timer'" class="space-y-3">
          <p class="text-gray-600 mb-4">请选择要重置的计时器：</p>
          <div class="space-y-2">
            <button 
              class="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded transition-colors"
              @click="resetDualTimer('positive')"
            >
              重置正方
            </button>
            <button 
              class="w-full bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded transition-colors"
              @click="resetDualTimer('negative')"
            >
              重置反方
            </button>

          </div>
        </div>
        
        <div v-else>
          <p class="text-gray-600 mb-4">确定要重置当前环节的计时器吗？</p>
          <div class="flex space-x-3">
            <button 
              class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              @click="confirmReset"
            >
              确定重置
            </button>
            <button 
              class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
              @click="showResetModal = false"
            >
              取消
            </button>
          </div>
        </div>
        
        <div v-if="currentStageInfo?.type === 'dual-timer'" class="mt-4">
          <button 
            class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
            @click="showResetModal = false"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 设置时间弹窗 -->
    <div v-if="showTimeSettingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">设置时间</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              正方调整为
            </label>
            <div class="flex items-center space-x-2">
              <input 
                v-model.number="customPositiveTime"
                type="number"
                min="0"
                max="3600"
                class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="秒数"
              >
              <span class="text-gray-500">秒</span>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              反方调整为
            </label>
            <div class="flex items-center space-x-2">
              <input 
                v-model.number="customNegativeTime"
                type="number"
                min="0"
                max="3600"
                class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="秒数"
              >
              <span class="text-gray-500">秒</span>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3 mt-6">
          <button 
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            @click="confirmTimeSettings"
          >
            确定
          </button>
          <button 
            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
            @click="cancelTimeSettings"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebateStore } from '~/stores/debate'

const debateStore = useDebateStore()

// 响应式计算属性
const currentStage = computed(() => debateStore.currentStage)
const currentStageInfo = computed(() => debateStore.currentStageInfo)
const formattedTime = computed(() => debateStore.formattedTime)
// 仅在单计时器时计算进度（剩余百分比）；双计时器无进度条
const progress = computed(() => {
  const info = currentStageInfo.value
  if (!info || info.type === 'dual-timer') return 0
  const total = info.duration || 0
  if (total <= 0) return 0
  const remaining = debateStore.timeRemaining
  const pct = Math.max(0, Math.min(100, Math.round((remaining / total) * 100)))
  return pct
})
const isRunning = computed(() => debateStore.isRunning)
const isPaused = computed(() => debateStore.isPaused)
const isTimeWarning = computed(() => debateStore.isTimeWarning)
const isTimeCritical = computed(() => debateStore.isTimeCritical)
const isConnectedToQQ = computed(() => debateStore.isConnectedToQQ)
const connectionStatus = computed(() => debateStore.connectionStatus)
const dualTimer = computed(() => debateStore.dualTimer)

// 弹窗状态
const showResetModal = ref(false)
const showTimeSettingModal = ref(false)

// 自定义时间设置
const customPositiveTime = ref(90)
const customNegativeTime = ref(90)

// 计时器逻辑
let timerInterval: NodeJS.Timeout | null = null
let dualTimerInterval: NodeJS.Timeout | null = null
let handledSpace = false

const startTimer = () => {
  debateStore.startTimer()
  
  timerInterval = setInterval(() => {
    debateStore.tick()
    
    if (debateStore.timeRemaining === 0) {
      clearInterval(timerInterval!)
      timerInterval = null
      playNotificationSound()
    }
  }, 1000)
}

const pauseTimer = () => {
  debateStore.pauseTimer()
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  debateStore.resetTimer()
}

// 双计时器控制
const startDualTimer = () => {
  debateStore.startDualTimer()
  
  dualTimerInterval = setInterval(() => {
    debateStore.tickDualTimer()
    
    if (debateStore.dualTimer.positiveTime === 0 && debateStore.dualTimer.negativeTime === 0) {
      clearInterval(dualTimerInterval!)
      dualTimerInterval = null
      debateStore.pauseDualTimer()
      playNotificationSound()
    }
  }, 1000)
}

const pauseDualTimer = () => {
  debateStore.pauseDualTimer()
  if (dualTimerInterval) {
    clearInterval(dualTimerInterval)
    dualTimerInterval = null
  }
}

const switchDualTimer = () => {
  if (dualTimer.value.isRunning) {
    debateStore.switchDualTimer()
  } else {
    startDualTimer()
  }
}

// 启动正方计时器
const startPositiveTimer = () => {
  if (dualTimerInterval) {
    clearInterval(dualTimerInterval)
    dualTimerInterval = null
  }
  
  debateStore.dualTimer.activeTimer = 'positive'
  debateStore.dualTimer.isRunning = true
  
  dualTimerInterval = setInterval(() => {
    debateStore.tickDualTimer()
    
    if (debateStore.dualTimer.positiveTime === 0 && debateStore.dualTimer.negativeTime === 0) {
      clearInterval(dualTimerInterval!)
      dualTimerInterval = null
      debateStore.pauseDualTimer()
      playNotificationSound()
    }
  }, 1000)
}

// 启动反方计时器
const startNegativeTimer = () => {
  if (dualTimerInterval) {
    clearInterval(dualTimerInterval)
    dualTimerInterval = null
  }
  
  debateStore.dualTimer.activeTimer = 'negative'
  debateStore.dualTimer.isRunning = true
  
  dualTimerInterval = setInterval(() => {
    debateStore.tickDualTimer()
    
    if (debateStore.dualTimer.positiveTime === 0 && debateStore.dualTimer.negativeTime === 0) {
      clearInterval(dualTimerInterval!)
      dualTimerInterval = null
      debateStore.pauseDualTimer()
      playNotificationSound()
    }
  }, 1000)
}

 // 快捷键处理
const handleKeyPress = (event: KeyboardEvent) => {
  const key = event.key
  const code = (event as any).code || ''
  const keyCode = (event as any).keyCode
  const isSpace = key === ' ' || code === 'Space' || key === 'Spacebar' || keyCode === 32
  const isPeriod = key === '.' || code === 'Period' || keyCode === 190
  const isComma = key === ',' || code === 'Comma' || keyCode === 188
  // 忽略在输入框/文本域/可编辑区域的按键，避免空格用于输入法或表单
  const target = event.target as HTMLElement | null
  if (target) {
    const tag = target.tagName?.toLowerCase?.() || ''
    const editable = target.getAttribute && target.getAttribute('contenteditable') === 'true'
    if (tag === 'input' || tag === 'textarea' || editable) {
      return
    }
  }

  // 暂停快捷键 (P)
  if ((key && key.toLowerCase() === 'p') || keyCode === 80) {
    event.preventDefault()
    if (isRunning.value) {
      pauseTimer()
    } else if (dualTimer.value.isRunning) {
      pauseDualTimer()
    }
    return
  }
  
  if (currentStageInfo.value?.type === 'dual-timer') {
    if (isPeriod) {
      event.preventDefault()
      startPositiveTimer()
    } else if (isComma) {
      event.preventDefault()
      startNegativeTimer()
    } else if (isSpace) {
      event.preventDefault()
      event.stopPropagation()
      handledSpace = true
      if (dualTimer.value.isRunning) {
        switchDualTimer()
      } else {
        startDualTimer()
      }
    }
  } else {
    // 单计时器快捷键
    if (isSpace) {
      event.preventDefault()
      event.stopPropagation()
      handledSpace = true
      if (isRunning.value) {
        pauseTimer()
      } else {
        startTimer()
      }
    }
  }
}

const handleKeyUp = (event: KeyboardEvent) => {
  const key = event.key
  const code = (event as any).code || ''
  const keyCode = (event as any).keyCode
  const isSpace = key === ' ' || code === 'Space' || key === 'Spacebar' || keyCode === 32
  if (handledSpace && isSpace) {
    event.preventDefault()
    event.stopPropagation()
    handledSpace = false
  }
}

const resetDualTimer = (type: 'positive' | 'negative') => {
  // 只重置单侧：不暂停、不清除定时器，不改变激活侧
  debateStore.resetDualTimer(type)
  showResetModal.value = false
}

// 重置确认
const confirmReset = () => {
  resetTimer()
  showResetModal.value = false
}

// 时间设置
const confirmTimeSettings = () => {
  const info = currentStageInfo.value
  if (info && info.type === 'dual-timer') {
    debateStore.setCustomDualTime(customPositiveTime.value, customNegativeTime.value)
  } else if (customPositiveTime.value >= 0) {
    debateStore.setCustomTime(customPositiveTime.value)
  }
  showTimeSettingModal.value = false
}

const cancelTimeSettings = () => {
  // 重置为当前环节的默认时间（双计时优先使用各自时长）
  const info = currentStageInfo.value
  if (info) {
    const pos = (info as any).positiveDuration ?? info.duration
    const neg = (info as any).negativeDuration ?? info.duration
    customPositiveTime.value = pos
    customNegativeTime.value = neg
  }
  showTimeSettingModal.value = false
}

// 格式化双计时器时间
const formatDualTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const nextStage = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (dualTimerInterval) {
    clearInterval(dualTimerInterval)
    dualTimerInterval = null
  }
  handledSpace = false
  debateStore.nextStage()
  playNotificationSound()
}

const previousStage = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  if (dualTimerInterval) {
    clearInterval(dualTimerInterval)
    dualTimerInterval = null
  }
  handledSpace = false
  debateStore.previousStage()
}

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3')
    audio.play().catch(() => {
      console.log('播放提示音')
    })
  } catch (error) {
    console.log('播放提示音')
  }
}

// 测试按钮方法，用于调试
const testButtons = () => {
  console.log('测试按钮被点击');
  console.log('当前环节类型:', currentStageInfo.value?.type);
  console.log('正方时间:', dualTimer.value.positiveTime);
  console.log('反方时间:', dualTimer.value.negativeTime);
  console.log('计时器运行状态:', dualTimer.value.isRunning);
  
  // 尝试启动正方计时器
  if (dualTimer.value.positiveTime > 0) {
    startPositiveTimer();
    console.log('已尝试启动正方计时器');
  } else {
    console.log('正方时间为0，无法启动');
  }
}

// 监听当前环节变化，更新自定义时间设置的默认值
watch(currentStageInfo, (newStageInfo) => {
  if (newStageInfo) {
    const pos = (newStageInfo as any).positiveDuration ?? newStageInfo.duration
    const neg = (newStageInfo as any).negativeDuration ?? newStageInfo.duration
    customPositiveTime.value = pos
    customNegativeTime.value = neg
  }
}, { immediate: true })

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  if (dualTimerInterval) {
    clearInterval(dualTimerInterval)
  }
  // 移除键盘事件监听器
  window.removeEventListener('keydown', handleKeyPress, true)
  window.removeEventListener('keyup', handleKeyUp, true)
})

// 初始化第一个环节
onMounted(() => {
  // 添加键盘事件监听器
  window.addEventListener('keydown', handleKeyPress, true)
  window.addEventListener('keyup', handleKeyUp, true)
})
</script>
