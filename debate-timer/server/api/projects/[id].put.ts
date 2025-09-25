import { defineEventHandler, readBody } from 'h3'
import { writeProject, type ProjectData } from '~/server/utils/jsonProjects'
import { broadcast } from '~/server/utils/wsHub'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id) || id <= 0) return { success: false, message: 'invalid id' }
  const body = await readBody(event).catch(() => ({}))
  const data = body as ProjectData
  const saved = await writeProject(id, data)
  broadcast({ type: 'project-update', id, global: saved.global, stages: saved.stages })
  return { success: true, data: saved }
})