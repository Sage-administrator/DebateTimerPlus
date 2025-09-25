import { defineEventHandler } from 'h3'
import { deleteProject } from '~/server/utils/jsonProjects'
import { broadcast } from '~/server/utils/wsHub'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, message: 'invalid id' }
  }
  const ok = await deleteProject(id).catch((e: any) => {
    return { error: e?.message || String(e) }
  })
  if (typeof ok === 'object' && ok && 'error' in ok) {
    return { success: false, message: (ok as any).error }
  }
  if (!ok) {
    return { success: false, message: 'not found' }
  }
  // 通知客户端项目已删除
  broadcast({ type: 'project-delete', id })
  return { success: true }
})