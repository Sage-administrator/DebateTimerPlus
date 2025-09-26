import type {
  Plugin,
  PluginContext,
  PluginMountTarget,
  PluginEvent,
  PluginRegistry,
  RegisteredPluginState,
} from "./plugin.types"

export function createPluginRegistry(): PluginRegistry {
  const list: RegisteredPluginState[] = []

  function register(plugin: Plugin) {
    const exists = list.find((x) => x.plugin.id === plugin.id)
    if (exists) {
      console.error("[plugin-registry] duplicate plugin id:", plugin.id)
      return
    }
    list.push({ plugin, status: "idle" })
  }

  function initAll(ctx: PluginContext) {
    for (const item of list) {
      try {
        item.status = "init"
        item.plugin.init(ctx)
        item.status = "idle"
      } catch (e: any) {
        item.status = "error"
        item.lastError = e?.message || String(e)
        ctx.bus.emit({ type: "error", payload: { pluginId: item.plugin.id, message: item.lastError || "unknown error" } })
        console.error(`[plugin-registry] init error(${item.plugin.id}):`, item.lastError)
      }
    }
  }

  function mountAll(target?: PluginMountTarget) {
    for (const item of list) {
      try {
        item.plugin.mount(target)
        item.status = "mounted"
      } catch (e: any) {
        item.status = "error"
        item.lastError = e?.message || String(e)
        console.error(`[plugin-registry] mount error(${item.plugin.id}):`, item.lastError)
      }
    }
  }

  function unmountAll() {
    for (const item of list) {
      try {
        item.plugin.unmount()
        item.status = "idle"
      } catch (e: any) {
        item.status = "error"
        item.lastError = e?.message || String(e)
        console.error(`[plugin-registry] unmount error(${item.plugin.id}):`, item.lastError)
      }
    }
  }

  function emit(event: PluginEvent) {
    for (const item of list) {
      try {
        item.plugin.onEvent && item.plugin.onEvent(event)
      } catch (e: any) {
        item.status = "error"
        item.lastError = e?.message || String(e)
        console.error(`[plugin-registry] event error(${item.plugin.id}):`, item.lastError)
      }
    }
  }

  return { register, initAll, mountAll, unmountAll, emit }
}