import type { Plugin, PluginContext, PluginEvent, PluginMountTarget } from "../core/plugin.types"

let ctxRef: PluginContext | null = null
let refs: Record<string, any> = {}
let isDarkState = false
let iframeKey = 0
let previewUrlCache = ""
let themePref: "system" | "light" | "dark" = "system"
let media: MediaQueryList | null = null
let styleInjected = false

function emitUpdate(partial: { isDark?: boolean; iframeKey?: number; previewUrl?: string }) {
  if (!ctxRef) return
  ctxRef.bus.emit({ type: "actions:update", payload: partial })
}

function injectTransitionStyle() {
  if (styleInjected) return
  try {
    const style = document.createElement("style")
    style.textContent = `
      .theme-transition *, .theme-transition {
        transition: color .25s ease, background-color .25s ease, border-color .25s ease;
      }
    `
    document.head.appendChild(style)
    styleInjected = true
  } catch {}
}

function applyThemeClass() {
  try {
    const root = document.documentElement
    root.classList.remove("theme-dark", "theme-light")
    root.classList.add(isDarkState ? "theme-dark" : "theme-light")

    // 平滑过渡：短暂加上过渡类
    injectTransitionStyle()
    root.classList.add("theme-transition")
    setTimeout(() => root.classList.remove("theme-transition"), 300)
  } catch {}
}

function computeSystemDark(): boolean {
  try {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  } catch {
    return false
  }
}

function computeIsDark(): boolean {
  if (themePref === "system") return computeSystemDark()
  return themePref === "dark"
}

function readTheme() {
  try {
    const pref = localStorage.getItem("adminThemePref")
    if (pref === "light" || pref === "dark" || pref === "system") {
      themePref = pref
    } else {
      themePref = "system"
    }
  } catch {}
  isDarkState = computeIsDark()
  applyThemeClass()
  emitUpdate({ isDark: isDarkState })

  // 监听系统主题变化（仅在 system 模式）
  try {
    media = window.matchMedia("(prefers-color-scheme: dark)")
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", () => {
        if (themePref === "system") {
          isDarkState = computeIsDark()
          applyThemeClass()
          emitUpdate({ isDark: isDarkState })
        }
      })
    } else if (typeof (media as any).addListener === "function") {
      ;(media as any).addListener(() => {
        if (themePref === "system") {
          isDarkState = computeIsDark()
          applyThemeClass()
          emitUpdate({ isDark: isDarkState })
        }
      })
    }
  } catch {}
}

function toggleTheme() {
  // 切换顺序：light -> dark -> system -> light ...
  themePref = themePref === "light" ? "dark" : themePref === "dark" ? "system" : "light"
  try { localStorage.setItem("adminThemePref", themePref) } catch {}
  isDarkState = computeIsDark()
  applyThemeClass()
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