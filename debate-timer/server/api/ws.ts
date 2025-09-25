import { defineWebSocketHandler } from 'h3'
import { peers, getClusterState, toggleRoleAcrossBots, broadcast } from '~/server/utils/wsHub'

export default defineWebSocketHandler({
  open(peer) {
    peers.add(peer)
    console.log('[WS] peer open, total:', peers.size)
    getClusterState().then(state => {
      peer.send(JSON.stringify({ type: 'state', ...state }))
    }).catch((e) => {
      console.error('[WS] getClusterState error on open', e)
      peer.send(JSON.stringify({ type: 'state', connected: false, roleStates: {}, channelReady: false }))
    })
  },
  async message(peer, message) {
    try {
      const data = JSON.parse(String(message || '{}'))
      console.log('[WS] message', data?.type)
      if (data?.type === 'toggle' && typeof data.roleName === 'string') {
        const allow = !!data.allow
        await toggleRoleAcrossBots(data.roleName, allow)
        // 轮询至目标颜色达到（≤2s），减少前端看到中间态
        let state = await getClusterState()
        const deadline = Date.now() + 2000
        while (Date.now() < deadline) {
          const color = state.roleStates?.[data.roleName]
          const ok = allow ? (color === 'green') : (color === 'blue')
          if (ok) break
          await new Promise(r => setTimeout(r, 200))
          state = await getClusterState()
        }
        broadcast({ type: 'state', ...state })
      } else if (data?.type === 'refresh') {
        const state = await getClusterState()
        peer.send(JSON.stringify({ type: 'state', ...state }))
      }
    } catch (e) {
      console.error('[WS] message error', e)
    }
  },
  close(peer) {
    peers.delete(peer)
    console.log('[WS] peer close, total:', peers.size)
  }
})