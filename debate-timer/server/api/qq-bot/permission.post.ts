export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { roleName, allow } = body
    
    if (!roleName || typeof allow !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: '参数错误：需要roleName和allow参数'
      })
    }
    
    const config = useRuntimeConfig()
    const qqBotApiUrl = config.qqBotApiUrl
    
    // 构造发送给QQ机器人的命令
    const command = allow ? `允许${roleName}` : `禁止${roleName}`
    
    try {
      // 这里应该调用实际的QQ机器人API
      // 由于qq.py是通过消息触发的，我们需要模拟发送消息
      const response = await fetch(`${qqBotApiUrl}/send-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: command,
          timestamp: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        return {
          success: true,
          message: `成功${allow ? '允许' : '禁止'}${roleName}发言`,
          data: result
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      // 如果API调用失败，记录日志但不阻塞
      console.error('调用QQ机器人API失败:', error)
      
      // 返回模拟成功响应（实际项目中应该处理错误）
      return {
        success: false,
        message: `设置${roleName}权限失败：${error.message}`,
        error: error.message
      }
    }
  } catch (error) {
    throw createError({
        statusCode: 500,
        message: '设置权限失败'
      })
  }
})