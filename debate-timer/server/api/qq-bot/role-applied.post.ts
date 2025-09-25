import { defineEventHandler, readBody } from 'h3'
import { getClusterState, broadcast, BOT_ENDPOINTS, fetchBotStatus } from '~/server/utils/wsHub'
import type { RoleColor } from '~/server/utils/wsHub'

// 接收 qq.py 的逐条权限变更回调，并通过 WS 增量广播
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as { roleName?: string; allowed?: boolean }
    const roleName = body?.roleName
    const allowed = !!body?.allowed

    // 调试日志，便于核对每条增量回调
    // eslint-disable-next-line no-console
    console.log('[CALLBACK] role-applied', roleName, 'allowed=', allowed)

    if (!roleName || typeof roleName !== 'string') {
      return { success: false, message: 'roleName required' }
    }

    let color: RoleColor = 'red'
    let connected = false
    let channelReady = false

    if (BOT_ENDPOINTS.length === 1) {
      // 单 Bot：直接使用 allowed → green/blue；同时从该 Bot 拉一次状态补充连接与频道信息
      const st = await fetchBotStatus(BOT_ENDPOINTS[0])
      connected = st.ok && st.connected
      channelReady = !!st.channelId
      color = allowed ? 'green' : 'blue'
      // 若机器人不在线，标记为红
      if (!connected) color = 'red'
    } else {
      // 多 Bot 聚合：为保证一致性仍走聚合状态
      const st = await getClusterState()
      connected = st.connected
      channelReady = st.channelReady
      color = (st.roleStates?.[roleName] as RoleColor) || 'red'
    }

    // 仅广播该角色的颜色增量，避免整包抖动
    broadcast({
      type: 'role-delta',
      roleName,
      color,
      connected,
      channelReady
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, message: e?.message || String(e) }
  }
})