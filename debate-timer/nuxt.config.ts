export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2025-08-25',
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  ssr: true,
  // 启用 Nitro WebSocket 支持（本地与生产均需）
  nitro: {
    experimental: {
      websocket: true
    }
  },
  runtimeConfig: {
    qqBotApiUrl: process.env.QQ_BOT_API_URL || 'http://localhost:8080',
    public: {
      wsUrl: process.env.WS_URL || ''
    }
  }
})
