export default defineEventHandler(async (event) => {
  try {
    // 使用Promise.race实现超时控制
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 3000)
    })

    const fetchPromise = $fetch('http://localhost:8080/status', {
      method: 'GET'
    })

    const response = await Promise.race([fetchPromise, timeoutPromise])

    return {
      success: true,
      connected: response.connected || false,
      message: response.connected ? 'QQ机器人在线' : 'QQ机器人离线'
    }
  } catch (error) {
    return {
      success: false,
      connected: false,
      message: 'QQ机器人未运行'
    }
  }
})
