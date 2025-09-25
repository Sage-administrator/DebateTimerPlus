import { promises as fs } from 'fs'
import path from 'path'
import { readStages } from './jsonStages'

export interface ProjectGlobal {
  title: string
  // 新增：正反方辩题
  positiveTopic?: string
  negativeTopic?: string
  theme: {
    bg: string
    positive: string
    negative: string
  }
}

export interface ProjectData {
  id: number
  name: string
  updatedAt: string
  global: ProjectGlobal
  stages: Awaited<ReturnType<typeof readStages>>
}

export interface ProjectIndexItem {
  id: number
  name: string
  updatedAt: string
  // 可扩展更多索引信息
}

const dataDir = path.resolve(process.cwd(), 'server', 'data')
const projectsIndexFile = path.join(dataDir, 'projects.json')

async function ensureDir() {
  try { await fs.mkdir(dataDir, { recursive: true }) } catch {}
}

async function defaultProjectData(newId: number): Promise<ProjectData> {
  const baseStages = await readStages()
  return {
    id: newId,
    name: `计时器项目 #${newId}`,
    updatedAt: new Date().toISOString(),
    global: {
      title: '三社联合辩论赛',
      // 新增默认辩题，留空由前端填写
      positiveTopic: '',
      negativeTopic: '',
      theme: {
        bg: '#0e1111',
        positive: '#b32525',
        negative: '#0369a1'
      }
    },
    stages: baseStages
  }
}

function projectFile(id: number) {
  return path.join(dataDir, `project-${id}.json`)
}

export async function readProjectsIndex(): Promise<ProjectIndexItem[]> {
  await ensureDir()
  try {
    const raw = await fs.readFile(projectsIndexFile, 'utf-8')
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr as ProjectIndexItem[] : []
  } catch {
    return []
  }
}

export async function writeProjectsIndex(list: ProjectIndexItem[]) {
  await ensureDir()
  await fs.writeFile(projectsIndexFile, JSON.stringify(list, null, 2), 'utf-8')
}

export async function createProject(name?: string): Promise<ProjectIndexItem> {
  const index = await readProjectsIndex()
  const newId = (index.reduce((m, it) => Math.max(m, it.id), 0) || 0) + 1
  const data = await defaultProjectData(newId)
  if (name && name.trim()) data.name = name.trim()
  // 写详细文件
  await fs.writeFile(projectFile(newId), JSON.stringify(data, null, 2), 'utf-8')
  // 更新索引
  const item: ProjectIndexItem = { id: newId, name: data.name, updatedAt: data.updatedAt }
  const nextIndex = [...index, item]
  await writeProjectsIndex(nextIndex)
  return item
}

export async function readProject(id: number): Promise<ProjectData | null> {
  await ensureDir()
  try {
    const raw = await fs.readFile(projectFile(id), 'utf-8')
    const obj = JSON.parse(raw)
    // 简单字段校验
    if (obj && typeof obj.id === 'number' && obj.global && Array.isArray(obj.stages)) return obj as ProjectData
    return null
  } catch {
    return null
  }
}

export async function writeProject(id: number, data: ProjectData): Promise<ProjectData> {
  await ensureDir()
  data.id = id
  data.updatedAt = new Date().toISOString()
  // 简易清洗：stage order 连续化
  if (Array.isArray(data.stages)) {
    // 先按 order（缺失则回退 id）排序
    data.stages.sort((a: any, b: any) => (a.order ?? a.id) - (b.order ?? b.id))
    // 保存前统一连续化：仅 order 连续化，保留原有 id（避免前端计时状态键错位）
    data.stages.forEach((s: any, i: number) => {
      s.order = i + 1
      // 保留 s.id 原值
    })
  }
  await fs.writeFile(projectFile(id), JSON.stringify(data, null, 2), 'utf-8')
  // 更新索引
  const idx = await readProjectsIndex()
  const name = data.name || `计时器项目 #${id}`
  const item: ProjectIndexItem = { id, name, updatedAt: data.updatedAt }
  const map = new Map(idx.map(i => [i.id, i]))
  map.set(id, item)
  await writeProjectsIndex(Array.from(map.values()).sort((a, b) => b.id - a.id))
  return data
}

export async function deleteProject(id: number) {
  await ensureDir()
  try { await fs.unlink(projectFile(id)) } catch {}
  const idx = await readProjectsIndex()
  const next = idx.filter(i => i.id !== id)
  await writeProjectsIndex(next)
}