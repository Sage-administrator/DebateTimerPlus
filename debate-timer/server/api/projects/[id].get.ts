import { defineEventHandler } from 'h3'
import { readProject } from '~/server/utils/jsonProjects'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isFinite(id) || id <= 0) return { success: false, message: 'invalid id' }
  const data = await readProject(id)
  if (!data) return { success: false, message: 'not found' }
  return { success: true, data }
})