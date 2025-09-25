<template>
  <div class="h-screen text-white overflow-hidden responsive-container gradient-background scale-wrapper" :style="{ '--ui-scale': uiScale }">

    <!-- 顶部辩题展示区 -->
    <div class="debate-header" v-if="uiConfig.bannerVisible !== false">
      <div class="flex w-full" :style="{ marginTop: `${uiConfig.bannerPos ?? 0}vh` }">
        <div class="flex-1 debate-side-positive flex items-center" :style="{ backgroundColor: uiConfig.bannerColorPos || 'rgb(169, 35, 35)' }">
          <div class="debate-label-white"><span class="font-bold" :style="{ color: uiConfig.bannerFontColorPos || 'white' }">{{ positiveLabel }}</span></div>
          <div class="text-white font-bold debate-topic-text">{{ isPreview ? '这是一段占位符，实际上辩题和队伍是在启动计时器的时候输入' : (positiveTopic || '') }}</div>
        </div>
        <div class="flex-1 debate-side-negative flex items-center justify-end" :style="{ backgroundColor: uiConfig.bannerColorNeg || 'rgb(3, 105, 161)' }">
          <div class="text-white font-bold text-right debate-topic-text debate-topic-right">{{ isPreview ? '启动计时器的时候，直接不输入辩题队伍，这里会自动留空' : (negativeTopic || '') }}</div>
          <div class="debate-label-white"><span class="font-bold" :style="{ color: uiConfig.bannerFontColorNeg || 'white' }">{{ negativeLabel }}</span></div>
        </div>
      </div>
    </div>

    <!-- 队伍名（红蓝条下方，空值不显示；字体与辩题一致） -->
    <div class="flex w-full items-start justify-between px-4 mt-2">
      <div v-if="teamPositiveName" class="debate-topic-text" style="color: white;">{{ teamPositiveName }}</div>
      <div v-if="teamNegativeName" class="debate-topic-text debate-topic-right" style="color: white; text-align: right;">{{ teamNegativeName }}</div>
    </div>

    <!-- 进入前设置面板 -->
    <div v-if="showSetup" class="fixed inset-0 z-40 flex items-center justify-center" @click="showSetup = false">
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative bg-white text-gray-800 rounded-lg shadow-2xl w-[720px] max-w-[90vw] border border-gray-200 p-4" @click.stop>
        <h3 class="font-bold text-lg mb-3">对阵双方和辩题设置</h3>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-600 mb-1 block">正方队伍名</label>
            <input v-model="setupTeamPositiveName" class="w-full px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-600" placeholder="例：重庆大学">
          </div>
          <div>
            <label class="text-xs text-gray-600 mb-1 block">反方队伍名</label>
            <input v-model="setupTeamNegativeName" class="w-full px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-600" placeholder="例：中国科学院大学">
          </div>
          <div>
            <label class="text-xs text-gray-600 mb-1 block">正方辩题</label>
            <input v-model="setupPositiveTopic" class="w-full px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-600" placeholder="请输入正方辩题">
          </div>
          <div>
            <label class="text-xs text-gray-600 mb-1 block">反方辩题</label>
            <input v-model="setupNegativeTopic" class="w-full px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-600" placeholder="请输入反方辩题">
          </div>
        </div>
        <div class="flex items-center justify-between mt-4">
          <button class="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-gray-100 cursor-not-allowed" disabled>从赛程选择（待开发）</button>
          <button class="px-3 py-1 border border-green-600 bg-green-600 text-white rounded text-sm hover:bg-green-700" @click="applySetupAndStart">使用以上设置开始计时</button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="text-center contest-title" v-if="uiConfig.eventNameVisible !== false">
        <h1 class="font-bold contest-title-text contest-title-color" :style="{ color: uiConfig.eventColor || 'rgb(3, 105, 161)', fontSize: uiConfig.eventFontSize ? `${uiConfig.eventFontSize}px` : '' }">{{ contestTitle }}</h1>
      </div>
      <div class="stage-timer-container">
        <div class="text-center stage-title">
          <h2 class="font-bold text-white" :class="isSpecialStage ? 'special-stage-text' : 'stage-title-text'">
            {{ currentStageInfo?.name || '彩排·试音' }}
          </h2>
        </div>

        <!-- 双计时器 -->
        <div v-if="isDualTimerStage" class="dual-timer-container">
          <div class="dual-timer-display">
            <div class="timer-side positive-side">
              <div class="digital-display">
                <span v-for="(char, index) in formatDualTime(dualTimer.positiveTime)" :key="`pos-${index}`" class="digital-char" :style="{ color: uiConfig.bannerFontColorPos || 'rgb(169, 35, 35)' }">{{ char }}</span>
              </div>
              <div class="timer-label positive-label">{{ positiveLabel }}</div>
            </div>
            <div class="timer-side negative-side">
              <div class="digital-display">
                <span v-for="(char, index) in formatDualTime(dualTimer.negativeTime)" :key="`neg-${index}`" class="digital-char" :style="{ color: uiConfig.bannerFontColorNeg || 'rgb(3, 105, 161)' }">{{ char }}</span>
              </div>
              <div class="timer-label negative-label">{{ negativeLabel }}</div>
            </div>
          </div>
        </div>

        <!-- 单计时器 -->
        <div v-else-if="!isSpecialStage" class="text-center timer-display-section">
          <div class="digital-display">
            <span v-for="(char, index) in displayTime" :key="index" class="digital-char" :class="{'text-orange-400': isTimeWarning, 'text-red-400': isTimeCritical, 'text-white': !isTimeWarning && !isTimeCritical}">{{ char }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div v-if="!isPreview" class="fixed bottom-4 right-4 control-panel">
      <!-- 双计时器控制 -->
      <div v-if="isDualTimerStage">
        <div class="flex items-center space-x-1 mb-1">
          <span class="text-white text-xs font-bold w-16">计时控制:</span>
          <button v-if="!dualTimer.isRunning" class="control-btn" @click="startTimer" :disabled="currentStage === 0">{{ dualTimer.isPaused ? '继续计时(空格)' : '启动计时(空格)' }}</button>
          <button v-if="dualTimer.isRunning" class="control-btn" @click="switchActiveTimer">{{ dualTimer.activeTimer === 'positive' ? '切换反方(空格)' : '切换正方(空格)' }}</button>
          <button class="control-btn" @click="pauseTimer" :disabled="!dualTimer.isRunning">中断(P)</button>
          <button class="control-btn" @click="openResetModal" :disabled="currentStage === 0">重置</button>
        </div>
        <div class="flex items-center space-x-1 mb-1">
          <span class="text-white text-xs font-bold w-16">计时控制:</span>
          <button class="control-btn" @click="startPositiveTimer">启动正方(。)</button>
          <button class="control-btn" @click="startNegativeTimer">启动反方(，)</button>
        </div>
      </div>

      <!-- 单计时器控制 -->
      <div v-else-if="!isSpecialStage" class="flex items-center space-x-1 mb-1">
        <span class="text-white text-xs font-bold w-16">计时控制:</span>
        <button class="control-btn" @click="isRunning ? pauseTimer() : startTimer()" :disabled="currentStage === 0">{{ isRunning ? '暂停计时(空格)' : (isPaused ? '继续计时(空格)' : '启动计时(空格)') }}</button>
        <button class="control-btn" @click="pauseTimer" :disabled="!isRunning && !isPaused">中断(P)</button>
        <button class="control-btn" @click="openResetModal" :disabled="currentStage === 0">重置</button>
      </div>

      <!-- 通用控制 -->
      <div class="flex items-center space-x-1 mb-1">
        <span class="text-white text-xs font-bold w-16">环节切换:</span>
        <button class="control-btn" @click="previousStage" :disabled="currentStage <= 1">上一个环节(←)</button>
        <button class="control-btn" @click="nextStage" :disabled="currentStage >= stages.length">下一个环节(→)</button>
      </div>
      <div class="flex items-center space-x-1 mb-1">
        <span class="text-white text-xs font-bold w-16">试音环节:</span>
        <button class="control-btn" @click="playTestSound('30')">30秒(Q)</button>
        <button class="control-btn" @click="playTestSound('5')">5秒(W)</button>
        <button class="control-btn" @click="playTestSound('End')">时间到(E)</button>
      </div>
      <div class="flex items-center space-x-1 mb-1">
        <span class="text-white text-xs font-bold w-16">额外功能:</span>
        <button class="control-btn" @click="toggleFullscreen">进入全屏(F)</button>
        <button class="control-btn">返回主页(B)</button>
      </div>
      <div class="flex items-center space-x-1">
        <span class="text-white text-xs font-bold w-16">特殊功能:</span>
        <button class="control-btn">奇袭发言</button>
        <button class="control-btn" @click="openTimeModal">设置时间</button>
      </div>
    </div>

    <!-- 左下角权限监控 -->
    <div v-if="!isPreview" class="fixed bottom-6 left-6 bg-transparent rounded px-2 py-1.5 border border-gray-600 text-xs font-bold min-w-[320px]">
      <div class="flex items-center space-x-1 mb-1">
        <div class="w-1.5 h-1.5 rounded-full" :class="(wsConnected && wsState.connected && wsState.channelReady) ? 'bg-green-500' : 'bg-red-500'"></div>
        <span class="text-gray-300 cursor-pointer no-underline hover:no-underline" @click="manualRefreshWs">{{ !wsConnected ? 'WS未连接' : (!wsState.connected ? '机器人未连接' : (!wsState.channelReady ? '未设置频道ID，无法同步权限' : '实时已连接')) }}</span>
      </div>
      <div class="space-y-1">
        <div class="flex flex-wrap gap-1">
          <button v-for="role in topLine" :key="role" class="perm-btn px-2 py-0.5 rounded text-xs font-bold" :class="btnClass(role)" @click="toggleRole(role)">{{ role }}</button>
        </div>
        <div class="flex flex-wrap gap-1">
          <button v-for="role in positiveLine" :key="role" class="perm-btn px-2 py-0.5 rounded text-xs font-bold" :class="btnClass(role)" @click="toggleRole(role)">{{ role }}</button>
        </div>
        <div class="flex flex-wrap gap-1">
          <button v-for="role in negativeLine" :key="role" class="perm-btn px-2 py-0.5 rounded text-xs font-bold" :class="btnClass(role)" @click="toggleRole(role)">{{ role }}</button>
        </div>
      </div>
    </div>

    <!-- 进度指示器（点击空白处关闭） -->
    <div v-if="showProgress" class="fixed inset-0 z-50" @click="showProgress = false">
      <div class="absolute top-32 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 rounded-lg p-4 border border-gray-600" @click.stop>
        <div class="text-center text-white text-base font-bold mb-3">辩论进度 (第{{ currentStage }}/{{ stages.length }}环节)</div>
        <div class="flex space-x-2 mb-2">
          <div v-for="stage in firstChunk" :key="stage.id" role="button" :tabindex="currentStage === stage.id ? -1 : 0" @click="jumpTo(stage.id)" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-transform" :class="{
              'bg-green-600 border-green-600 text-white': completedStages.includes(stage.id),
              'bg-blue-600 border-blue-600 text-white cursor-not-allowed opacity-80': currentStage === stage.id,
              'bg-gray-700 border-gray-600 text-gray-300 cursor-pointer hover:scale-[1.03]': !completedStages.includes(stage.id) && currentStage !== stage.id
            }">{{ stage.id }}</div>
        </div>
        <div class="flex space-x-2">
          <div v-for="stage in secondChunk" :key="stage.id" role="button" :tabindex="currentStage === stage.id ? -1 : 0" @click="jumpTo(stage.id)" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-transform" :class="{
              'bg-green-600 border-green-600 text-white': completedStages.includes(stage.id),
              'bg-blue-600 border-blue-600 text-white cursor-not-allowed opacity-80': currentStage === stage.id,
              'bg-gray-700 border-gray-600 text-gray-300 cursor-pointer hover:scale-[1.03]': !completedStages.includes(stage.id) && currentStage !== stage.id
            }">{{ stage.id }}</div>
        </div>
      </div>
    </div>

    <!-- 时间设置弹窗 -->
    <div v-if="showTimeModal" class="fixed bottom-20 right-4 bg-white rounded-lg p-3 w-64 shadow-2xl border border-gray-200 z-50" @mouseenter="handleModalEnter" @mouseleave="handleModalLeave('time')">
      <div class="flex items-center mb-2">
        <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">i</div>
        <span class="text-gray-800 font-bold text-xs">调整时间</span>
      </div>
      <div v-if="isDualTimerStage" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-gray-600 text-xs">正方时间:</span>
          <input v-model.number="customPositiveTime" type="number" min="0" max="3600" class="px-1.5 py-0.5 border border-gray-300 rounded w-20 text-center text-gray-800 text-xs" @keyup.enter="setCustomTime">
        </div>
        <div class="flex items-center justify-between">
          <span class="text-gray-600 text-xs">反方时间:</span>
          <input v-model.number="customNegativeTime" type="number" min="0" max="3600" class="px-1.5 py-0.5 border border-gray-300 rounded w-20 text-center text-gray-800 text-xs" @keyup.enter="setCustomTime">
        </div>
      </div>
      <div v-else class="flex items-center">
        <span class="text-gray-800 font-bold text-xs">调整为</span>
        <input v-model.number="customTime" type="number" min="0" max="3600" class="mx-1.5 px-1.5 py-0.5 border border-gray-300 rounded w-14 text-center text-gray-800 text-xs" @keyup.enter="setCustomTime">
        <span class="text-gray-800 text-xs">秒</span>
      </div>
      <div class="flex justify-end space-x-1.5 mt-3">
        <button @click="closeTimeModal" class="px-2.5 py-0.5 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition-colors">取消</button>
        <button @click="setCustomTime" class="px-2.5 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors">确定</button>
      </div>
    </div>

    <!-- 重置确认/选项弹窗 -->
    <div v-if="showResetModal" class="fixed bottom-20 right-4 bg-white rounded-lg p-3 w-64 shadow-2xl border border-gray-200 z-50" @mouseenter="handleModalEnter" @mouseleave="handleModalLeave('reset')">
      <div v-if="isDualTimerStage">
        <div class="flex items-center mb-2">
          <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2"><i class="not-italic">i</i></div>
          <span class="text-gray-800 font-bold text-xs">重置计时器</span>
        </div>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 text-xs font-bold">正方</span>
            <button @click="resetDualTimer('positive')" class="px-2.5 py-0.5 border border-green-500 text-green-600 rounded text-xs hover:bg-green-50 transition-colors">点击重置</button>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 text-xs font-bold">反方</span>
            <button @click="resetDualTimer('negative')" class="px-2.5 py-0.5 border border-green-500 text-green-600 rounded text-xs hover:bg-green-50 transition-colors">点击重置</button>
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button @click="showResetModal = false" class="px-2.5 py-0.5 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition-colors">关闭</button>
        </div>
      </div>
      <div v-else>
        <h3 class="text-base font-bold mb-2 text-gray-800">重置确认</h3>
        <p class="text-gray-600 mb-3 text-xs">确定要重置当前环节的计时器吗？</p>
        <div class="flex justify-end space-x-1.5">
          <button @click="showResetModal = false" class="px-2.5 py-0.5 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 transition-colors">取消</button>
          <button @click="resetTimer" class="px-2.5 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors">确定重置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })
import { useDebateStore } from '~/stores/debate'

const debateStore = useDebateStore()
const isPreview = ref(false)
watch(isPreview, v => { if (v) showSetup.value = false })
const pidRef = ref<number | null>(null)
onMounted(() => {
  try {
    const r = useRoute()
    isPreview.value = r?.query?.preview === '1'
    const rawPid = Array.isArray(r?.query?.projectId) ? r.query.projectId[0] : (r?.query?.projectId as any)
    const pid = Number(rawPid ?? new URLSearchParams(location.search).get('projectId'))
    pidRef.value = Number.isFinite(pid) && pid > 0 ? pid : null
  } catch {}
})


const uiScale = ref(1)
/** 从路由参数读取缩放比例（0.5–2.0），默认 1.0 */
onMounted(() => {
  try {
    const r = useRoute()
    const raw = Array.isArray(r?.query?.scale) ? r.query.scale[0] : (r?.query?.scale as any)
    const s = parseFloat(raw)
    if (Number.isFinite(s)) uiScale.value = Math.min(2, Math.max(0.5, s))
  } catch {}
})

type RoleColor = 'green' | 'blue' | 'red'
const topLine = ['主持人', '后台', '评委', '观众']
const positiveLine = ['正方一辩', '正方二辩', '正方三辩', '正方四辩']
const negativeLine = ['反方一辩', '反方二辩', '反方三辩', '反方四辩']

const ws = ref<WebSocket | null>(null)
const contestTitle = ref<string>('三社联合辩论赛')
const positiveTopic = ref<string>('')
const teamPositiveName = ref<string>('')
const positiveLabel = ref<string>('正方')
const negativeTopic = ref<string>('')
const teamNegativeName = ref<string>('')
const negativeLabel = ref<string>('反方')

// 管理端界面编辑配置（持久化来自 form.global.ui）
const uiConfig = ref({
  bannerVisible: true,
  eventNameVisible: true,
  // 背景：此页不直接替换背景，仅保留字段备用
  backgroundType: 'default' as 'default' | 'image',
  imageFileName: '',
  // 横幅与字体颜色
  bannerPos: 0,
  bannerFontSize: 20,
  bannerColorPos: '',
  bannerColorNeg: '',
  bannerFontColorPos: '',
  bannerFontColorNeg: '',
  // 赛事名称
  eventPosY: 0,
  eventPosX: 0,
  eventColor: '',
  eventFontSize: 0,
  // 其他字段预留（当前不应用）
  stagePosY: 0, stagePosX: 0, stageColor: '', stageFontSize: 0,
  noTimerStagePosY: 0, noTimerStagePosX: 0, noTimerStageColor: '', noTimerStageFontSize: 0,
  singleTimerPosY: 0, singleTimerColor: '', singleTimerFontSize: 0,
  dualTimerPosY: 0, dualTimerGap: 0, dualTimerColor: '', dualTimerFontSize: 0,
})

// 进入前设置面板与输入模型
const showSetup = ref(true)
const setupPositiveTopic = ref('')
const setupNegativeTopic = ref('')
const setupTeamPositiveName = ref('')
const setupTeamNegativeName = ref('')
const manualSetupApplied = ref(false)
const wsConnected = ref(false)
const wsState = ref<{ connected: boolean; channelReady: boolean; roleStates: Record<string, RoleColor> }>({ connected: false, channelReady: false, roleStates: {} })

const connectWS = () => {
  try {
    const config = useRuntimeConfig()
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const fallback = `${protocol}://${location.host}/api/ws`
    const url = (config.public?.wsUrl && typeof config.public.wsUrl === 'string' && config.public.wsUrl.length > 0)
      ? config.public.wsUrl
      : fallback

    const sock = new WebSocket(url)
    ws.value = sock

    sock.onopen = () => {
      wsConnected.value = true
      sock.send(JSON.stringify({ type: 'refresh' }))
    }
    sock.onclose = () => { wsConnected.value = false; setTimeout(connectWS, 3000) }
    sock.onerror = () => { wsConnected.value = false }
    sock.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'state') {
          wsState.value.connected = !!data.connected
          wsState.value.channelReady = !!data.channelReady
          wsState.value.roleStates = data.roleStates || {}
        } else if (data?.type === 'role-delta' && data.roleName && data.color) {
          wsState.value.roleStates = { ...wsState.value.roleStates, [data.roleName]: data.color }
          if (typeof data.connected === 'boolean') wsState.value.connected = data.connected
          if (typeof data.channelReady === 'boolean') wsState.value.channelReady = data.channelReady
        } else if (data?.type === 'stages-update' && Array.isArray(data.stages)) {
          // 运行中或暂停中都不重置阶段，避免打断计时
          if (!(isRunning.value || isPaused.value)) {
            // @ts-ignore
            debateStore.setStages && debateStore.setStages(data.stages)
            if (ws.value && wsConnected.value) ws.value.send(JSON.stringify({ type: 'refresh' }))
          }
        } else if (data?.type === 'project-update') {
          const pid = pidRef.value
          if (pid != null && pid === Number(data.id)) {
            // 运行中或暂停中都不重置阶段，避免打断计时
            if (!(isRunning.value || isPaused.value)) {
              // @ts-ignore
              debateStore.setStages && debateStore.setStages(data.stages)
              try { document.documentElement.style.setProperty('--theme-bg', data.global?.theme?.bg || '#0e1111') } catch {}
              try {
                const lbl = (data.global as any)?.labels || {}
                positiveLabel.value = typeof lbl?.positive === 'string' && lbl.positive.trim().length ? lbl.positive : '正方'
                negativeLabel.value = typeof lbl?.negative === 'string' && lbl.negative.trim().length ? lbl.negative : '反方'
                // 应用界面编辑配置（如存在）
                const ui = (data.global as any)?.ui || null
                if (ui && typeof ui === 'object') {
                  uiConfig.value = { ...uiConfig.value, ...ui }
                  // 标准化旧纯红/纯蓝为推荐色（展示页最小侵入）
                  if (uiConfig.value.bannerColorPos === '#ff0000') uiConfig.value.bannerColorPos = '#A92323'
                  if (uiConfig.value.bannerColorNeg === '#0000ff') uiConfig.value.bannerColorNeg = '#0369A1'
                  // 用词覆盖（若提供）
                  if (typeof ui.positiveLabel === 'string' && ui.positiveLabel.trim().length) positiveLabel.value = ui.positiveLabel
                  if (typeof ui.negativeLabel === 'string' && ui.negativeLabel.trim().length) negativeLabel.value = ui.negativeLabel
                }
                if (!manualSetupApplied.value) {
                  contestTitle.value = data.global?.title || '三社联合辩论赛'
                  positiveTopic.value = data.global?.positiveTopic || ''
                  negativeTopic.value = data.global?.negativeTopic || ''
                  teamPositiveName.value = (data.global as any)?.teamPositiveName || ''
                  teamNegativeName.value = (data.global as any)?.teamNegativeName || ''
                }
              } catch {}
              if (ws.value && wsConnected.value) ws.value.send(JSON.stringify({ type: 'refresh' }))
            }
          }
        }
      } catch {}
    }
  } catch {}
}

const manualRefreshWs = () => {
  if (ws.value && wsConnected.value) ws.value.send(JSON.stringify({ type: 'refresh' }))
  else connectWS()
}

const btnClass = (role: string) => {
  const color = wsState.value.roleStates?.[role] as RoleColor | undefined
  if (!color || color === 'red') return 'bg-red-600 text-white border border-gray-600'
  if (color === 'green') return 'bg-green-600 text-white border border-green-700'
  return 'bg-blue-600 text-white border border-blue-700'
}

const toggleRole = (role: string) => {
  const curr = wsState.value.roleStates?.[role] as RoleColor | undefined
  const allow = !(curr === 'green')
  if (ws.value && wsConnected.value) ws.value.send(JSON.stringify({ type: 'toggle', roleName: role, allow }))
}

const currentStage = computed(() => debateStore.currentStage)
const currentStageInfo = computed(() => debateStore.currentStageInfo)
const dualTimer = computed(() => debateStore.dualTimer)
const formattedTime = computed(() => debateStore.formattedTime)
const isRunning = computed(() => debateStore.isRunning)
const isPaused = computed(() => debateStore.isPaused)
const isTimeWarning = computed(() => debateStore.isTimeWarning)
const isTimeCritical = computed(() => debateStore.isTimeCritical)
const stages = computed(() => {
  const list = debateStore.stages || []
  return Array.isArray(list) ? [...list].sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)) : []
})
const half = computed(() => Math.ceil(stages.value.length / 2))
const firstChunk = computed(() => stages.value.slice(0, half.value))
const secondChunk = computed(() => stages.value.slice(half.value))
const completedStages = computed(() => debateStore.completedStages)

const isSpecialStage = computed(() => currentStageInfo.value?.type === 'special')
const isDualTimerStage = computed(() => currentStageInfo.value?.type === 'dual-timer')

const formatDualTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const displayTime = computed(() => (formattedTime.value || '00:00').padStart(5, '0'))

watch(() => debateStore.connectionStatus, (val) => {
  if (val === '权限已同步' && ws.value && wsConnected.value) ws.value.send(JSON.stringify({ type: 'refresh' }))
})
watch(currentStage, () => { setTimeout(() => { if (ws.value && wsConnected.value) ws.value.send(JSON.stringify({ type: 'refresh' })) }, 0) })

const showProgress = ref(false)
const showTimeModal = ref(false)
const showResetModal = ref(false)
const customTime = ref(0)
const customPositiveTime = ref(0)
const customNegativeTime = ref(0)
const modalHoverTimer = ref<NodeJS.Timeout | null>(null)
let timerInterval: NodeJS.Timeout | null = null

const startTimer = () => {
  debateStore.startTimer()
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (isDualTimerStage.value) {
      debateStore.tickDualTimer()
      if (dualTimer.value.positiveTime === 0 && dualTimer.value.negativeTime === 0) { clearInterval(timerInterval!); timerInterval = null }
    } else {
      debateStore.tick()
      if ((debateStore as any).timeRemaining === 0) { clearInterval(timerInterval!); timerInterval = null }
    }
  }, 1000)
}

const pauseTimer = () => { debateStore.pauseTimer(); if (timerInterval) { clearInterval(timerInterval); timerInterval = null } }
const resetTimer = () => { if (timerInterval) clearInterval(timerInterval); debateStore.resetTimer(); showResetModal.value = false }
const resetDualTimer = (type: 'positive' | 'negative') => { debateStore.resetDualTimer(type) }
const nextStage = async () => {
  if (timerInterval) clearInterval(timerInterval)
  const list = stages.value
  const idx = list.findIndex((s: any) => s?.id === currentStage.value)
  const target = list[Math.min(idx + 1, list.length - 1)]
  if (target && (debateStore as any).goToStage) await (debateStore as any).goToStage(target.id)
  else (debateStore as any).currentStage = target?.id ?? currentStage.value
}

const previousStage = async () => {
  if (timerInterval) clearInterval(timerInterval)
  const list = stages.value
  const idx = list.findIndex((s: any) => s?.id === currentStage.value)
  const target = list[Math.max(idx - 1, 0)]
  if (target && (debateStore as any).goToStage) await (debateStore as any).goToStage(target.id)
  else (debateStore as any).currentStage = target?.id ?? currentStage.value
}
const toggleFullscreen = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{}); else document.exitFullscreen() }
const handleModalEnter = () => { if (modalHoverTimer.value) clearTimeout(modalHoverTimer.value) }
const handleModalLeave = (modalType: 'time' | 'reset') => { modalHoverTimer.value = setTimeout(() => { if (modalType === 'time') showTimeModal.value = false; else if (modalType === 'reset') showResetModal.value = false }, 1000) }
const openTimeModal = () => { handleModalEnter(); if (isDualTimerStage.value) { customPositiveTime.value = dualTimer.value.positiveTime; customNegativeTime.value = dualTimer.value.negativeTime } else { customTime.value = (debateStore as any).timeRemaining } ; showTimeModal.value = true }
const openResetModal = () => { handleModalEnter(); showResetModal.value = true }
const closeTimeModal = () => { showTimeModal.value = false }
const setCustomTime = () => { if (isDualTimerStage.value) debateStore.setCustomDualTime(Number(customPositiveTime.value), Number(customNegativeTime.value)); else debateStore.setCustomTime(Number(customTime.value)); showTimeModal.value = false }
const switchActiveTimer = () => debateStore.switchDualTimer()
const startPositiveTimer = () => { if (timerInterval) clearInterval(timerInterval); debateStore.startPositiveTimer(); startTimer() }
const startNegativeTimer = () => { if (timerInterval) clearInterval(timerInterval); debateStore.startNegativeTimer(); startTimer() }

const jumpTo = async (id: number) => {
  if (id === currentStage.value) return
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  try {
    if ((debateStore as any).goToStage) await (debateStore as any).goToStage(id)
    else (debateStore as any).currentStage = id
  } finally {
    try { await (debateStore as any).syncPermissionsWithQQ?.() } catch {}
    if (ws.value && wsConnected.value) { try { ws.value.send(JSON.stringify({ type: 'refresh' })) } catch {} }
    showProgress.value = false
  }
}

const playTestSound = (type: string) => { try { new Audio(`/${type}.mp3`).play().catch(()=>{}) } catch {} }

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.target instanceof HTMLInputElement) return
  const keyMap: Record<string, () => void> = {
    'ArrowLeft': () => { if (currentStage.value > 1) previousStage() },
    'ArrowRight': () => { if (currentStage.value < stages.value.length) nextStage() },
    ' ': () => { if (isDualTimerStage.value) { isRunning.value ? switchActiveTimer() : startTimer() } else if (!isSpecialStage.value) { isRunning.value ? pauseTimer() : startTimer() } },
    'p': () => { if (isRunning.value) pauseTimer() }, 'P': () => { if (isRunning.value) pauseTimer() },
    '.': () => { if (isDualTimerStage.value) startPositiveTimer() }, '。': () => { if (isDualTimerStage.value) startPositiveTimer() },
    ',': () => { if (isDualTimerStage.value) startNegativeTimer() }, '，': () => { if (isDualTimerStage.value) startNegativeTimer() },
    'q': () => playTestSound('30'), 'Q': () => playTestSound('30'),
    'w': () => playTestSound('5'),  'W': () => playTestSound('5'),
    'e': () => playTestSound('End'),'E': () => playTestSound('End'),
    'f': toggleFullscreen, 'F': toggleFullscreen,
    'b': () => {}, 'B': () => {},
    'Tab': () => { showProgress.value = !showProgress.value }
  }
  const handler = keyMap[event.key]; if (handler) { event.preventDefault(); handler() }
}

useHead({ title: '三社联合辩论赛 - 专业计时器系统', meta: [{ name: 'description', content: '专业的辩论赛计时器系统，完全复刻经典界面设计' }] })

// 初始化设置面板的默认值（从当前显示值拷贝）
onMounted(() => {
  try {
    setupPositiveTopic.value = positiveTopic.value || ''
    setupNegativeTopic.value = negativeTopic.value || ''
    setupTeamPositiveName.value = (typeof (window as any).teamPositiveName !== 'undefined' ? (window as any).teamPositiveName : '') || ''
    setupTeamNegativeName.value = (typeof (window as any).teamNegativeName !== 'undefined' ? (window as any).teamNegativeName : '') || ''
  } catch {}
})

// 应用设置并开始计时
function applySetupAndStart() {
  positiveTopic.value = setupPositiveTopic.value
  negativeTopic.value = setupNegativeTopic.value
  // 这两个字段仅用于显示（空值不显示）
  ;(window as any) // 保持最小修改，不改现有响应式结构
  teamPositiveName.value = setupTeamPositiveName.value
  teamNegativeName.value = setupTeamNegativeName.value
  manualSetupApplied.value = true
  if (pollTimer) { try { clearInterval(pollTimer) } catch {} ; pollTimer = null }
  showSetup.value = false
}

/** WS 失联时的轮询回退：每 3s 尝试拉取项目数据覆盖 */
let pollTimer: any = null
function startPollingIfNeeded() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    if (pidRef.value == null) return
    // 仅在 WS 未连接或未就绪时轮询
    if (!wsConnected.value || !wsState.value.connected || !wsState.value.channelReady) {
      try {
        const res = await $fetch(`/api/projects/${pidRef.value}`)
        if ((res as any)?.success && !(isRunning.value || isPaused.value)) {
          const data = (res as any).data
          // @ts-ignore
          debateStore.setStages && debateStore.setStages(data.stages)
          try { document.documentElement.style.setProperty('--theme-bg', data.global?.theme?.bg || '#0e1111') } catch {}
          try {
            const lbl = (data.global as any)?.labels || {}
            positiveLabel.value = typeof lbl?.positive === 'string' && lbl.positive.trim().length ? lbl.positive : '正方'
            negativeLabel.value = typeof lbl?.negative === 'string' && lbl.negative.trim().length ? lbl.negative : '反方'
            // 应用界面编辑配置（轮询回退）
            const ui = (data.global as any)?.ui || null
            if (ui && typeof ui === 'object') {
              uiConfig.value = { ...uiConfig.value, ...ui }
              // 标准化旧纯红/纯蓝为推荐色（轮询回退）
              if (uiConfig.value.bannerColorPos === '#ff0000') uiConfig.value.bannerColorPos = '#A92323'
              if (uiConfig.value.bannerColorNeg === '#0000ff') uiConfig.value.bannerColorNeg = '#0369A1'
              if (typeof ui.positiveLabel === 'string' && ui.positiveLabel.trim().length) positiveLabel.value = ui.positiveLabel
              if (typeof ui.negativeLabel === 'string' && ui.negativeLabel.trim().length) negativeLabel.value = ui.negativeLabel
            }
            if (!manualSetupApplied.value) {
              contestTitle.value = data.global?.title || '三社联合辩论赛'
              positiveTopic.value = data.global?.positiveTopic || ''
              negativeTopic.value = data.global?.negativeTopic || ''
              teamPositiveName.value = (data.global as any)?.teamPositiveName || ''
              teamNegativeName.value = (data.global as any)?.teamNegativeName || ''
            }
          } catch {}
        }
      } catch {}
    }
  }, 3000)
}

onMounted(async () => {
  // 启动时优先从后端拉取环节（JSON）
  // @ts-ignore
  if ((debateStore as any).loadStages) await (debateStore as any).loadStages()
  else (debateStore as any).ensureStagesUpToDate?.()

  document.addEventListener('keydown', handleKeyPress)
  await debateStore.checkQQBotStatus()
  debateStore.syncPermissionsWithQQ()
  connectWS()
  startPollingIfNeeded()

  // 管理页联动：接收 stage:prev / stage:next 并切换预览环节
  try {
    const handler = (e: MessageEvent) => {
      const t = (e?.data && (e.data.type || e.data)) as string
      if (e.origin && e.origin !== location.origin) return
      if (t === 'stage:prev') { previousStage() }
      else if (t === 'stage:next') { nextStage() }
    }
    ;(window as any).__adminPreviewHandler = handler
    window.addEventListener('message', handler)
  } catch {}

  // 若带有 projectId 参数，则加载对应项目并覆盖环节与主题
  try {
    const q = new URLSearchParams(location.search)
    const pid = Number(q.get('projectId'))
    if (Number.isFinite(pid) && pid > 0) {
      const res = await $fetch(`/api/projects/${pid}`)
      if ((res as any)?.success) {
        const data = (res as any).data
        // @ts-ignore
        debateStore.setStages && debateStore.setStages(data.stages)
        try { document.documentElement.style.setProperty('--theme-bg', data.global?.theme?.bg || '#0e1111') } catch {}
        try {
          const lbl = (data.global as any)?.labels || {}
          positiveLabel.value = typeof lbl?.positive === 'string' && lbl.positive.trim().length ? lbl.positive : '正方'
          negativeLabel.value = typeof lbl?.negative === 'string' && lbl.negative.trim().length ? lbl.negative : '反方'
          if (!manualSetupApplied.value) {
            contestTitle.value = data.global?.title || '三社联合辩论赛'
            positiveTopic.value = data.global?.positiveTopic || ''
            negativeTopic.value = data.global?.negativeTopic || ''
            teamPositiveName.value = (data.global as any)?.teamPositiveName || ''
            teamNegativeName.value = (data.global as any)?.teamNegativeName || ''
          }
        } catch {}
      }
    }
  } catch {}
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (modalHoverTimer.value) clearTimeout(modalHoverTimer.value)
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  document.removeEventListener('keydown', handleKeyPress)
  try {
    const h = (window as any).__adminPreviewHandler
    if (h) window.removeEventListener('message', h)
  } catch {}
  if (ws.value) { try { ws.value.close() } catch {}; ws.value = null }
})
</script>

<style scoped>
.scale-wrapper { transform: scale(var(--ui-scale)); transform-origin: top center; }
@font-face { font-family: 'SourceHanSerifCN-Heavy'; src: url('/SourceHanSerifCN-Heavy.otf') format('opentype'); }
@font-face { font-family: 'Digiface'; src: url('/Digiface.ttf') format('truetype'); }
*:not(.digital-char) { font-family: 'SourceHanSerifCN-Heavy', 'SimSun', '宋体', serif !important; user-select: none !important; -webkit-user-select: none !important; }
.gradient-background { background: radial-gradient(ellipse at center bottom, rgb(57, 76, 86) 0%, rgb(14, 17, 17) 100%); }
.responsive-container, html, body { min-height: 100vh; overflow: hidden; }
.responsive-container { display: flex; flex-direction: column; }
.debate-header { padding-top: 4vh; flex-shrink: 0; }
.debate-side-positive { background-color: rgb(169, 35, 35); padding: 0.6vh 0.8vw; }
.debate-side-negative { background-color: rgb(3, 105, 161); padding: 0.6vh 0.8vw; }
.debate-label-white { border: 1px solid white; border-radius: 2px; padding: 0; font-size: clamp(35px, 2.5vw, 44px); flex-shrink: 0; display: flex; align-items: center; justify-content: center; height: 1.3em; line-height: 1.3; }
.debate-label-white span { padding: 0.05vh 0.1vw; line-height: 1; }
.debate-topic-text { font-size: 21px; line-height: 1.3; max-width: 35vw; word-wrap: break-word; }
.debate-side-positive .debate-label-white { margin-left: 0.5vw; margin-right: 1.5vw; }
.debate-side-negative .debate-label-white { margin-right: 0.5vw; margin-left: 1.5vw; }
.main-content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding-bottom: 25vh; }
.contest-title { margin-bottom: 5vh; }
.contest-title-text { font-size: 45px; }
.contest-title-color { color: rgb(3, 105, 161); }
.stage-timer-container { display: flex; flex-direction: column; align-items: center; gap: 2vh; }
.stage-title-text { font-size: 56px; }
.special-stage-text { font-size: 170px; line-height: 1.2; }
.dual-timer-display { display: flex; justify-content: center; align-items: center; gap: 8vw; }
.timer-side { display: flex; flex-direction: column; align-items: center; }
.timer-label { font-size: 24px; font-weight: bold; margin-top: 2vh; }
.positive-label { color: rgb(179, 37, 37); }
.negative-label { color: rgb(3, 105, 161); }
.audience-label { color: rgb(107, 114, 128); }
.digital-display { display: flex; justify-content: center; align-items: center; gap: 0.1em; }
.digital-char { font-family: 'Digiface', monospace !important; font-size: 176px; font-weight: normal; line-height: 1; }
.control-panel { opacity: 0.1; transition: opacity 0.3s ease-in-out; }
.control-panel:hover { opacity: 1; }
.control-btn { position: relative; padding: 4px 8px; background: transparent; color: white; font-size: 11px; font-weight: bold; border: 1px solid #4a5568; border-radius: 2px; cursor: pointer; transition: all 0.2s ease; font-family: 'SimSun', '宋体', serif !important; }
.control-btn:hover { border-color: #718096; background: rgba(255, 255, 255, 0.05); }
.control-btn:disabled { opacity: 0.5; cursor: not-allowed; }
:fullscreen .stage-title-text, :fullscreen .special-stage-text, :fullscreen .digital-char, :fullscreen .debate-label-white { font-size: 72px !important; }
:fullscreen .special-stage-text { font-size: 200px !important; }
:fullscreen .digital-char { font-size: 280px !important; }
:fullscreen .debate-label-white { font-size: clamp(60px, 4vw, 72px) !important; }
.perm-btn { transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease, box-shadow 200ms ease; will-change: background-color, border-color, color, box-shadow; }
.perm-btn:hover { filter: brightness(1.05); }
</style>