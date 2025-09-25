import { defineEventHandler, readBody } from 'h3'
import { createProject } from '~/server/utils/jsonProjects'

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name : undefined
  const item = await createProject(name)
  return { success: true, data: item }
})