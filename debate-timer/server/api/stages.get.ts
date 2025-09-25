import { defineEventHandler } from 'h3'
import { readStages } from '~/server/utils/jsonStages'

export default defineEventHandler(async () => {
  const list = await readStages()
  return { success: true, data: list }
})