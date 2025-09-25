import { defineEventHandler, readBody } from 'h3'
import { writeStages, readStages, type Stage } from '~/server/utils/jsonStages'
import { broadcast } from '~/server/utils/wsHub'

function sanitize(input: any): Stage[] {
  const arr = Array.isArray(input?.stages) ? input.stages : []
  const ok = [] as Stage[]
  for (const it of arr) {
    const id = Number(it?.id)
    const order = Number(it?.order)
    const name = String(it?.name ?? '').trim()
    const duration = Math.max(0, Number(it?.duration ?? 0) | 0)
    const type = String(it?.type)
    const allowedRoles = Array.isArray(it?.allowedRoles) ? it.allowedRoles.map(String) : []
    const description = typeof it?.description === 'string' ? it.description : ''

    if (!Number.isFinite(id) || id <= 0) continue
    if (!name) continue
    if (!['speech','question','summary','special','dual-timer'].includes(type)) continue

    ok.push({ id, order: Number.isFinite(order) ? order : id, name, duration, type: type as any, allowedRoles, description })
  }
  // 去重 id，并按 order 排序重排 order
  const uniq = new Map<number, Stage>()
  for (const s of ok) if (!uniq.has(s.id)) uniq.set(s.id, s)
  const list = Array.from(uniq.values()).sort((a, b) => a.order - b.order)
  list.forEach((s, i) => { s.order = i + 1 })
  return list
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const list = sanitize(body)
  await writeStages(list)
  const saved = await readStages()
  broadcast({ type: 'stages-update', stages: saved })
  return { success: true, data: saved }
})