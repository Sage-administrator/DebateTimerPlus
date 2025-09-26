import type { Plugin, PluginContext, PluginMountTarget, PluginEvent } from "../core/plugin.types"

let ctxRef: PluginContext | null = null
let refs: Record<string, any> = {}
let resizeHandler: (() => void) | null = null
let mounted = false

function emitLayoutUpdate(partial: any = {}) {
  if (!ctxRef) return
  const payload = {
    channel: "layout:update",
    data: {
      mounted,
      refsReady: {
        previewIframe: !!(refs?.previewIframe?.value),
      },
      viewport: {
        width: window.innerWidth || 0,
        height: window.innerHeight || 0,
      },
      ...partial,
    },
  }
  ctxRef.bus.emit({ type: "custom", payload } as any)
}

function attachResizeListener() {
  try {
    resizeHandler = () => emitLayoutUpdate()
    window.addEventListener("resize", resizeHandler)
  } catch {}
}

function detachResizeListener() {
  try {
    if (resizeHandler) window.removeEventListener("resize", resizeHandler)
  } catch {}
  resizeHandler = null
}

export const LayoutPlugin: Plugin = {
  id: "layout",
  init(ctx: PluginContext) {
    ctxRef = ctx
    emitLayoutUpdate({ phase: "init" })
  },
  mount(target?: PluginMountTarget) {
    refs = target?.refs || {}
    mounted = true
    emitLayoutUpdate({ phase: "mount" })
    attachResizeListener()
  },
  unmount() {
    mounted = false
    detachResizeListener()
    refs = {}
    emitLayoutUpdate({ phase: "unmount" })
  },
  onEvent(e: PluginEvent) {
    // 可根据需要回应其它事件，这里仅在数据加载后再次广播状态快照
    if (e.type === "data:loaded" || e.type === "data:update") {
      emitLayoutUpdate({ phase: "data" })
    }
  },
}