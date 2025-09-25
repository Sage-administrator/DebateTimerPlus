import { } from 'h3'

export type RoleColor = 'green' | 'blue' | 'red'

export const ALL_ROLES = [
  '主持人', '后台', '评委', '观众',
  '正方一辩', '正方二辩', '正方三辩', '正方四辩',
  '反方一辩', '反方二辩', '反方三辩', '反方四辩'
]

export const BOT_ENDPOINTS = (process.env.QQ_BOT_ENDPOINTS || 'http://localhost:8080')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export const peers = new Set<any>()

export async function fetchBotStatus(endpoint: string) {
  try {
    // nitro 下可直接使用全局 $fetch
    const res: any = await $fetch(`${endpoint}/status`, { method: 'GET' })
    return {
      ok: true,
      endpoint,
      connected: !!res?.connected,
      roleMappings: res?.role_mappings || {},
      speakingRoles: new Set<string>(res?.current_speaking_roles || []),
      channelId: res?.channel_id
    }
  } catch {
    return {
      ok: false,
      endpoint,
      connected: false,
      roleMappings: {},
      speakingRoles: new Set<string>(),
      channelId: null
    }
  }
}

export async function getClusterState() {
  const results = await Promise.all(BOT_ENDPOINTS.map(fetchBotStatus))
  const anyOk = results.some(r => r.ok && r.connected)
  const connectedBots = results.filter(r => r.ok && r.connected)
  const channelReady = connectedBots.some(r => !!r.channelId)

  const roleStates: Record<string, RoleColor> = {}
  for (const role of ALL_ROLES) {
    const relevant = connectedBots
    if (relevant.length === 0) {
      roleStates[role] = 'red'
      continue
    }
    const inAll = relevant.every(r => r.speakingRoles.has(role))
    const inNone = relevant.every(r => !r.speakingRoles.has(role))
    const mappingOk = relevant.every(r => role in r.roleMappings)
    if (!mappingOk) {
      roleStates[role] = 'red'
      continue
    }
    roleStates[role] = inAll ? 'green' : (inNone ? 'blue' : 'red')
  }

  const connected = anyOk
  return { connected, roleStates, channelReady }
}

export async function toggleRoleAcrossBots(roleName: string, allow: boolean) {
  await Promise.allSettled(
    BOT_ENDPOINTS.map(ep =>
      $fetch(`${ep}/set-role-permission`, {
        method: 'POST',
        body: { roleName, allow }
      })
    )
  )
}

export function broadcast(payload: any) {
  // 调试日志：观测广播类型与连接数量
  // eslint-disable-next-line no-console
  console.log('[WSHub] broadcast', payload?.type, 'peers=', peers.size)
  const msg = JSON.stringify(payload)
  peers.forEach((p) => {
    try { p.send(msg) } catch {}
  })
}

export async function broadcastClusterState() {
  const state = await getClusterState()
  broadcast({ type: 'state', ...state })
}