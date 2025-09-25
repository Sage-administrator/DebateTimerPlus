/* eslint-disable */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const ALL_ROLES = [
  '主持人', '后台', '评委', '观众',
  '正方一辩', '正方二辩', '正方三辩', '正方四辩',
  '反方一辩', '反方二辩', '反方三辩', '反方四辩'
]

// 初始环节（与 stores/debate.ts 的 DEBATE_STAGES 对齐）
const STAGES = [
  { id: 1, order: 1,  name: '彩排·试音', duration: 0, type: 'special', allowedRoles: ['主持人', '正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩', '评委', '观众'], description: '彩排和试音环节' },
  { id: 2, order: 2,  name: '开场', duration: 0, type: 'special', allowedRoles: ['主持人'], description: '主持人开场' },
  { id: 3, order: 3,  name: '正方一辩发言', duration: 210, type: 'speech', allowedRoles: ['正方一辩'], description: '正方一辩进行开篇立论' },
  { id: 4, order: 4,  name: '反方二辩质询正方一辩', duration: 120, type: 'question', allowedRoles: ['反方二辩', '正方一辩'], description: '反方二辩对正方一辩进行质询' },
  { id: 5, order: 5,  name: '反方一辩发言', duration: 210, type: 'speech', allowedRoles: ['反方一辩'], description: '反方一辩进行开篇立论' },
  { id: 6, order: 6,  name: '正方二辩质询反方一辩', duration: 120, type: 'question', allowedRoles: ['正方二辩', '反方一辩'], description: '正方二辩对反方一辩进行质询' },
  { id: 7, order: 7,  name: '反方二辩质询小结', duration: 90, type: 'summary', allowedRoles: ['反方二辩'], description: '反方二辩就质询内容进行小结' },
  { id: 8, order: 8,  name: '正方二辩质询小结', duration: 90, type: 'summary', allowedRoles: ['正方二辩'], description: '正方二辩就质询内容进行小结' },
  { id: 9, order: 9,  name: '正反方四辩对辩', duration: 90, type: 'dual-timer', allowedRoles: ['正方四辩', '反方四辩'], description: '正反方四辩进行对辩' },
  { id: 10, order: 10, name: '正方三辩盘问', duration: 90, type: 'question', allowedRoles: ['正方三辩', '反方一辩', '反方二辩', '反方四辩'], description: '正方三辩盘问反方一、二、四辩' },
  { id: 11, order: 11, name: '反方三辩盘问', duration: 90, type: 'question', allowedRoles: ['反方三辩', '正方一辩', '正方二辩', '正方四辩'], description: '反方三辩盘问正方一、二、四辩' },
  { id: 12, order: 12, name: '正方三辩盘问小结', duration: 90, type: 'summary', allowedRoles: ['正方三辩'], description: '正方三辩就盘问环节进行小结' },
  { id: 13, order: 13, name: '反方三辩盘问小结', duration: 90, type: 'summary', allowedRoles: ['反方三辩'], description: '反方三辩就盘问环节进行小结' },
  { id: 14, order: 14, name: '自由辩论', duration: 240, type: 'dual-timer', allowedRoles: ['正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩'], description: '双方进行自由辩论' },
  { id: 15, order: 15, name: '反方四辩总结陈词', duration: 210, type: 'summary', allowedRoles: ['反方四辩'], description: '反方四辩进行总结陈词' },
  { id: 16, order: 16, name: '正方四辩总结陈词', duration: 210, type: 'summary', allowedRoles: ['正方四辩'], description: '正方四辩进行总结陈词' },
  { id: 17, order: 17, name: '评委点评', duration: 0, type: 'special', allowedRoles: ['评委'], description: '评委点评环节' },
  { id: 18, order: 18, name: '公布结果', duration: 0, type: 'special', allowedRoles: ['主持人'], description: '公布结果环节' },
  { id: 19, order: 19, name: '本场辩论比赛圆满结束', duration: 0, type: 'special', allowedRoles: ['主持人', '后台', '评委', '正方一辩', '正方二辩', '正方三辩', '正方四辩', '反方一辩', '反方二辩', '反方三辩', '反方四辩', '观众'], description: '比赛结束，所有人可发言' }
]

async function main() {
  for (const s of STAGES) {
    await prisma.stage.upsert({
      where: { id: s.id },
      update: {
        order: s.order,
        name: s.name,
        duration: s.duration,
        type: s.type,
        allowedRoles: s.allowedRoles,
        description: s.description
      },
      create: {
        id: s.id,
        order: s.order,
        name: s.name,
        duration: s.duration,
        type: s.type,
        allowedRoles: s.allowedRoles,
        description: s.description
      }
    })
  }
  console.log('Seeded stages:', STAGES.length)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})