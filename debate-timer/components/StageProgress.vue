<template>
  <div class="stage-progress">
    <div class="debate-card">
      <h3 class="text-lg font-semibold mb-4 text-center">辩论进度</h3>
      
      <!-- 桌面端显示 -->
      <div class="hidden md:block">
        <div class="grid grid-cols-7 gap-2">
          <div 
            v-for="stage in stages" 
            :key="stage.id"
            class="text-center"
          >
            <div 
              class="stage-indicator mx-auto mb-2"
              :class="{
                'completed': completedStages.includes(stage.id),
                'current': currentStage === stage.id,
                'pending': !completedStages.includes(stage.id) && currentStage !== stage.id
              }"
            >
              {{ stage.id }}
            </div>
            <div class="text-xs text-gray-600 leading-tight">
              {{ stage.name.length > 8 ? stage.name.substring(0, 8) + '...' : stage.name }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 移动端显示 -->
      <div class="md:hidden">
        <div class="flex overflow-x-auto pb-2 space-x-3">
          <div 
            v-for="stage in stages" 
            :key="stage.id"
            class="flex-shrink-0 text-center"
          >
            <div 
              class="stage-indicator mx-auto mb-2"
              :class="{
                'completed': completedStages.includes(stage.id),
                'current': currentStage === stage.id,
                'pending': !completedStages.includes(stage.id) && currentStage !== stage.id
              }"
            >
              {{ stage.id }}
            </div>
            <div class="text-xs text-gray-600 leading-tight w-16">
              {{ stage.name.length > 6 ? stage.name.substring(0, 6) + '...' : stage.name }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 当前环节详情 -->
      <div v-if="currentStageInfo" class="mt-6 p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium text-blue-800">当前环节</span>
          <span class="text-sm text-blue-600">
            {{ getStageTypeText(currentStageInfo.type) }}
          </span>
        </div>
        <h4 class="text-lg font-semibold text-blue-900 mb-2">
          {{ currentStageInfo.name }}
        </h4>
        <p class="text-sm text-blue-700 mb-3">
          {{ currentStageInfo.description }}
        </p>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="role in currentStageInfo.allowedRoles" 
            :key="role"
            class="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full"
          >
            {{ role }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebateStore } from '~/stores/debate'

const debateStore = useDebateStore()

// 响应式计算属性
const stages = computed(() => debateStore.stages)
const currentStage = computed(() => debateStore.currentStage)
const currentStageInfo = computed(() => debateStore.currentStageInfo)
const completedStages = computed(() => debateStore.completedStages)

const getStageTypeText = (type: string): string => {
  const typeMap = {
    'speech': '发言',
    'question': '质询',
    'summary': '总结',
    'free': '自由辩论'
  }
  return typeMap[type as keyof typeof typeMap] || '未知'
}
</script>