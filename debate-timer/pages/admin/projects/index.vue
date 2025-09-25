<template>
  <div class="p-4 text-white bg-gray-900 min-h-screen">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold">计时器项目</h2>
      <div class="space-x-2">
        <input v-model="newName" placeholder="新项目名称（可选）" class="px-2 py-1 bg-transparent border border-gray-600 rounded outline-none text-sm" />
        <button class="px-3 py-1 border border-gray-600 rounded hover:bg-white/5 text-sm" @click="create">创建项目</button>
      </div>
    </div>
    <div v-if="loading" class="text-gray-400 text-sm">加载中...</div>
    <div v-else class="space-y-2">
      <div v-for="item in list" :key="item.id" class="border border-gray-600 rounded p-3 flex items-center justify-between">
        <div class="text-sm">
          <div class="font-bold">#{{ item.id }} {{ item.name }}</div>
          <div class="text-gray-400 text-xs">更新于 {{ new Date(item.updatedAt).toLocaleString() }}</div>
        </div>
        <div class="space-x-2">
          <NuxtLink :to="`/admin/projects/${item.id}`" class="px-2 py-1 border border-blue-600 text-blue-300 rounded text-sm hover:bg-blue-600/20">编辑</NuxtLink>
          <button class="px-2 py-1 border border-red-600 text-red-300 rounded text-sm hover:bg-red-600/20" @click="remove(item.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
definePageMeta({ layout: 'admin' })

interface Item { id: number; name: string; updatedAt: string }
const list = ref<Item[]>([])
const loading = ref(false)
const newName = ref('')

async function load() {
  loading.value = true
  try {
    const res = await $fetch('/api/projects')
    if ((res as any)?.success) list.value = (res as any).data
  } finally {
    loading.value = false
  }
}

async function create() {
  const res = await $fetch('/api/projects', { method: 'POST', body: { name: newName.value } })
  if ((res as any)?.success) {
    newName.value = ''
    await load()
  } else {
    alert('创建失败')
  }
}

async function remove(id: number) {
  if (!confirm('删除该项目？对应的 project-*.json 文件将被移除。')) return
  const res = await $fetch(`/api/projects/${id}`, { method: 'DELETE' }).catch((e) => ({ success: false, message: e?.message || '请求失败' }))
  if ((res as any)?.success) {
    await load()
  } else {
    alert('删除失败：' + ((res as any)?.message || '未知错误'))
  }
}

onMounted(load)
</script>