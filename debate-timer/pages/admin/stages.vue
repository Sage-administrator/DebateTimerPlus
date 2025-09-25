<template>
  <div class="p-4 text-white">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-xl font-bold">环节配置（JSON 存储）</h2>
      <div class="space-x-2">
        <button class="px-3 py-1 border border-gray-600 rounded hover:bg-white/5" @click="addStage">新增环节</button>
        <button class="px-3 py-1 border border-gray-600 rounded hover:bg-white/5" @click="reload">重新加载</button>
        <button class="px-3 py-1 border border-green-600 text-green-300 rounded hover:bg-green-600/20" :disabled="saving" @click="save">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <p class="text-xs text-gray-300 mb-3">提示：用上下按钮调整顺序；保存后会写入 server/data/stages.json 并通过 WS 广播。</p>

    <div v-for="(s, idx) in localStages" :key="s.id" class="border border-gray-600 rounded p-3 mb-3">
      <div class="flex items-center justify-between mb-2">
        <div class="font-bold">ID: {{ s.id }}</div>
        <div class="space-x-2">
          <button class="px-2 py-0.5 border border-gray-600 rounded disabled:opacity-50" :disabled="idx===0" @click="moveUp(idx)">上移</button>
          <button class="px-2 py-0.5 border border-gray-600 rounded disabled:opacity-50" :disabled="idx===localStages.length-1" @click="moveDown(idx)">下移</button>
          <button class="px-2 py-0.5 border border-red-600 text-red-300 rounded" @click="removeStage(idx)">删除</button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-4">
          <label class="block text-xs text-gray-300 mb-1">名称</label>
          <input v-model="s.name" type="text" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-300 mb-1">时长(秒)</label>
          <input v-model.number="s.duration" type="number" min="0" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none" />
        </div>
        <div class="col-span-3">
          <label class="block text-xs text-gray-300 mb-1">类型</label>
          <select v-model="s.type" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none">
            <option value="speech">发言(speech)</option>
            <option value="question">质询(question)</option>
            <option value="summary">小结(summary)</option>
            <option value="special">特殊(special)</option>
            <option value="dual-timer">双计时(dual-timer)</option>
          </select>
        </div>
        <div class="col-span-12">
          <label class="block text-xs text-gray-300 mb-1">允许发言角色（多选）</label>
          <div class="flex flex-wrap gap-2">
            <label v-for="r in ALL_ROLES" :key="r" class="inline-flex items-center gap-1 text-xs">
              <input type="checkbox" class="accent-blue-500" :value="r" v-model="s.allowedRoles">
              <span>{{ r }}</span>
            </label>
          </div>
        </div>
        <div class="col-span-12">
          <label class="block text-xs text-gray-300 mb-1">描述(可选)</label>
          <textarea v-model="s.description" rows="2" class="w-full px-2 py-1 bg-transparent border border-gray-600 rounded outline-none"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type StageType = 'speech' | 'question' | 'summary' | 'special' | 'dual-timer'
interface Stage {
  id: number
  order: number
  name: string
  duration: number
  type: StageType
  allowedRoles: string[]
  description?: string
}

const ALL_ROLES = [
  '主持人', '后台', '评委', '观众',
  '正方一辩', '正方二辩', '正方三辩', '正方四辩',
  '反方一辩', '反方二辩', '反方三辩', '反方四辩'
]

const localStages = ref<Stage[]>([])
const saving = ref(false)

function renumberOrders() {
  localStages.value.forEach((s, i) => { s.order = i + 1 })
}

function moveUp(idx: number) {
  if (idx <= 0) return
  const arr = localStages.value
  const prev = arr[idx - 1]!
  const curr = arr[idx]!
  arr[idx - 1] = curr
  arr[idx] = prev
  renumberOrders()
}
function moveDown(idx: number) {
  const arr = localStages.value
  if (idx >= arr.length - 1) return
  const next = arr[idx + 1]!
  const curr = arr[idx]!
  arr[idx + 1] = curr
  arr[idx] = next
  renumberOrders()
}

function addStage() {
  const maxId = localStages.value.reduce((m, s) => Math.max(m, s.id), 0)
  localStages.value.push({
    id: maxId + 1,
    order: localStages.value.length + 1,
    name: '新环节',
    duration: 0,
    type: 'speech',
    allowedRoles: [],
    description: ''
  })
}

function removeStage(idx: number) {
  localStages.value.splice(idx, 1)
  renumberOrders()
}

async function reload() {
  try {
    const res = await $fetch('/api/stages')
    if ((res as any)?.success) {
      localStages.value = ((res as any).data as Stage[]).map(s => ({ ...s }))
      localStages.value.sort((a, b) => a.order - b.order)
    } else {
      alert('加载失败')
    }
  } catch (e) {
    console.error(e)
    alert('加载异常')
  }
}

async function save() {
  saving.value = true
  try {
    renumberOrders()
    const res = await $fetch('/api/stages', {
      method: 'PUT',
      body: { stages: localStages.value }
    })
    if ((res as any)?.success) {
      alert('已保存')
    } else {
      alert('保存失败')
    }
  } catch (e: any) {
    console.error(e)
    alert('保存异常：' + (e?.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(reload)
</script>