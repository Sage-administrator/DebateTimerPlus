import { broadcastClusterState } from '~/server/utils/wsHub'
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { stage, allowedRoles } = body

  try {
    // 先检查QQ机器人是否在线
    const statusTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('status check timeout')), 3000)
    })
    
    const statusFetchPromise = $fetch('http://localhost:8080/status', {
      method: 'GET'
    })

    const statusResponse: any = await Promise.race([statusFetchPromise, statusTimeoutPromise])

    if (!statusResponse.connected) {
      return {
        success: false,
        message: 'QQ机器人未连接',
        error: 'Bot not connected'
      }
    }

    // 调用QQ机器人的权限控制接口
    const permissionTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('permission set timeout')), 5000)
    })

    const permissionFetchPromise = $fetch('http://localhost:8080/set-stage-permissions', {
      method: 'POST',
      body: {
        stage,
        allowedRoles
      }
    })

    const response = await Promise.race([permissionFetchPromise, permissionTimeoutPromise])
    // 等待机器人实际完成权限应用（最多5秒），避免前端看到中间态
    try {
      const permSet = new Set<string>(Array.isArray(allowedRoles) ? allowedRoles : [])
      // 永久发言组
      permSet.add('后台'); permSet.add('主持人')
      const equals = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(x => b.has(x))
      const start = Date.now()
      while (Date.now() - start < 5000) {
        const st: any = await $fetch('http://localhost:8080/status', { method: 'GET' })
        const curr = new Set<string>(st?.current_speaking_roles || [])
        if (equals(permSet, curr)) break
        await new Promise(r => setTimeout(r, 200))
      }
    } catch {}
    // 完成后立刻广播最新聚合状态
    await broadcastClusterState()

    return {
      success: true,
      message: '权限设置成功',
      data: response
    }
  } catch (error: any) {
    console.error('设置QQ权限失败:', error)
    
    // 根据错误类型返回不同的消息
    let errorMessage = '权限设置失败'
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      errorMessage = 'QQ机器人未运行或连接失败'
    } else if (error.message.includes('timeout')) {
      errorMessage = 'QQ机器人响应超时'
    }

    return {
      success: false,
      message: errorMessage,
      error: error.message
    }
  }
})
