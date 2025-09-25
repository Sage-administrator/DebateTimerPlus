import { defineEventHandler } from 'h3'
import { readProjectsIndex } from '~/server/utils/jsonProjects'

export default defineEventHandler(async () => {
  const list = await readProjectsIndex()
  return { success: true, data: list }
})