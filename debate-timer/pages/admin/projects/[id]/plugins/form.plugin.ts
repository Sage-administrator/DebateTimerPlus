import type { Plugin, PluginContext, PluginMountTarget, PluginEvent } from "../core/plugin.types"

let ctx: PluginContext | null = null

export const FormPlugin: Plugin = {
  id: "form",
  init(c: PluginContext) {
    ctx = c
  },
  mount(_target?: PluginMountTarget) {},
  unmount() {
    ctx = null
  },
  onEvent(e: PluginEvent) {
    if (!ctx) return
    // 当数据加载后，将其中的全局 UI（如存在）广播出去，供页面同步
    if (e.type === "data:loaded") {
      const ui = (e.payload?.form as any)?.global?.ui
      if (ui) {
        ctx.bus.emit({ type: "form:update", payload: { ui } })
      }
      return
    }
    // 接收 UI 编辑器的变更，做统一分发（当前仅回传，后续可扩展校验/规范化）
    if (e.type === "form:uiChanged") {
      ctx.bus.emit({ type: "form:update", payload: { ui: e.payload.ui } })
      return
    }
    // 编辑面板分段变更，广播给其他插件可能需要的 UI（例如 Layout/Charts）
    if (e.type === "form:editTabChanged") {
      ctx.bus.emit({ type: "form:update", payload: { tab: e.payload.tab } })
      return
    }
  },
}