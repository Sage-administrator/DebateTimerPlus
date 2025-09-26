import type { Plugin, PluginContext, PluginEvent, PluginMountTarget } from "../core/plugin.types"

let ctxRef: PluginContext | null = null
let refs: Record<string, any> = {}
let isDarkState = false
let iframeKey = 0
let previewUrlCache = ""

/**
 * 将主题读写与预览交互集中到插件中
 * - 主题：读取/写入 localStorage，并通过 actions:update 同步页面 isDark
 * - 预览：初始化 previewUrl，处理刷新（iframeKey++），向 iframe 发送上一/下一命令
 */
function emitUpdate(partial: { isDark?: boolean; iframeKey?: number; previewUrl?: string }) {
  if (!ctxRef) return
  ctxRef.bus.emit({ type: "actions:update", payload: partial })
}

function readTheme() {
  try {
    const v = localStorage.getItem("adminTheme")
    isDarkState = v === "dark"
  } catch {}
  emitUpdate({ isDark: isDarkState })
}

function toggleTheme() {
  isDarkState = !isDarkState
  try {
    localStorage.setItem("adminTheme", isDarkState ? "dark" : "light")
  } catch {}
  emitUpdate({ isDark: isDarkState })
}

function initPreviewUrl() {
  try {
    const origin = location.origin || ""
    previewUrlCache = `${origin}/?projectId=${ctxRef?.idParam}&preview=1`
  } catch {
    previewUrlCache = `/?projectId=${ctxRef?.idParam}&preview=1`
  }
  emitUpdate({ previewUrl: previewUrlCache })
}

function reloadPreview() {
  iframeKey++
  emitUpdate({ iframeKey })
}

function sendPreviewAction(action: "prev" | "next") {
  const iframeEl: HTMLIFrameElement | null = refs?.previewIframe?.value || null
  const win = iframeEl?.contentWindow
  if (!win) return
  try {
    win.postMessage({ source: "admin", type: "stage:" + action }, location.origin)
  } catch {}
  try {
    const key = action === "prev" ? "ArrowLeft" : "ArrowRight"
    const evt = new KeyboardEvent("keydown", { key, bubbles: true })
    win.dispatchEvent(evt)
  } catch {}
}

export const ActionsPlugin: Plugin = {
  id: "actions",
  init(ctx: PluginContext) {
    ctxRef = ctx
    // 初始化主题与预览地址
    readTheme()
    initPreviewUrl()
  },
  mount(target?: PluginMountTarget) {
    refs = target?.refs || {}
  },
  unmount() {
    refs = {}
  },
  onEvent(e: PluginEvent) {
    if (e.type === "theme:toggle") toggleTheme()
    if (e.type === "preview:reload") reloadPreview()
    if (e.type === "preview:action") sendPreviewAction((e as any).payload?.action)
  },
}