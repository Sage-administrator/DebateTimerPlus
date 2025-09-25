<template>
  <div class="role-permissions">
    <div class="debate-card">
      <h3 class="text-lg font-semibold mb-4 text-center">发言权限状态</h3>
      
      <div class="space-y-3">
        <div 
          v-for="role in debateStore.rolePermissions" 
          :key="role.roleName"
          class="permission-card"
          :class="{
            'active': role.hasPermission,
            'inactive': !role.hasPermission
          }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div 
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-green-500': role.hasPermission,
                  'bg-gray-400': !role.hasPermission
                }"
              ></div>
              <span class="font-medium">{{ role.roleName }}</span>
            </div>
            
            <div class="flex items-center space-x-2">
              <span class="text-sm">
                {{ role.memberCount }} 人
              </span>
              <span 
                class="text-xs px-2 py-1 rounded-full"
                :class="{
                  'bg-green-100 text-green-800': role.hasPermission,
                  'bg-gray-100 text-gray-600': !role.hasPermission
                }"
              >
                {{ role.hasPermission ? '可发言' : '禁言中' }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 手动权限控制 -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <h4 class="text-sm font-medium text-gray-700 mb-3">手动权限控制</h4>
        <div class="grid grid-cols-2 gap-2">
          <button 
            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
            @click="allowAllDebaters"
            :disabled="!debateStore.isConnectedToQQ"
          >
            允许全体发言
          </button>
          <button 
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
            @click="muteAllDebaters"
            :disabled="!debateStore.isConnectedToQQ"
          >
            禁止全体发言
          </button>
        </div>
      </div>
      
      <!-- 连接状态 -->
      <div class="mt-4 p-3 rounded-lg" :class="{
        'bg-green-50 border border-green-200': debateStore.isConnectedToQQ,
        'bg-red-50 border border-red-200': !debateStore.isConnectedToQQ
      }">
        <div class="flex items-center space-x-2">
          <div 
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-green-500': debateStore.isConnectedToQQ,
              'bg-red-500': !debateStore.isConnectedToQQ
            }"
          ></div>
          <span class="text-sm font-medium">
            QQ机器人状态: {{ debateStore.connectionStatus }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebateStore } from '~/stores/debate'

const debateStore = useDebateStore()

const allowAllDebaters = async () => {
  const debateRoles = ['正方一辩', '正方二辩', '正方三辩', '正方四辩', 
                      '反方一辩', '反方二辩', '反方三辩', '反方四辩']
  
  try {
    for (const role of debateRoles) {
      await debateStore.setRolePermission(role, true)
    }
    
    // 更新本地状态
    debateStore.rolePermissions.forEach(role => {
      if (debateRoles.includes(role.roleName)) {
        role.hasPermission = true
      }
    })
  } catch (error) {
    console.error('允许全体发言失败:', error)
  }
}

const muteAllDebaters = async () => {
  const debateRoles = ['正方一辩', '正方二辩', '正方三辩', '正方四辩', 
                      '反方一辩', '反方二辩', '反方三辩', '反方四辩']
  
  try {
    for (const role of debateRoles) {
      await debateStore.setRolePermission(role, false)
    }
    
    // 更新本地状态
    debateStore.rolePermissions.forEach(role => {
      if (debateRoles.includes(role.roleName)) {
        role.hasPermission = false
      }
    })
  } catch (error) {
    console.error('禁止全体发言失败:', error)
  }
}
</script>