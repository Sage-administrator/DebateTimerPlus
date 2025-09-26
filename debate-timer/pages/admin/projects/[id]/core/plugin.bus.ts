import type { EventBus, PluginEvent } from "./plugin.types"

export function createEventBus(): EventBus {
  const handlers = new Map<PluginEvent["type"], Set<(e: PluginEvent) => void>>()

  function on(type: PluginEvent["type"], handler: (e: PluginEvent) => void) {
    const set = handlers.get(type) ?? new Set()
    set.add(handler)
    handlers.set(type, set)
    return () => off(type, handler)
  }

  function off(type: PluginEvent["type"], handler: (e: PluginEvent) => void) {
    const set = handlers.get(type)
    if (!set) return
    set.delete(handler)
    if (set.size === 0) handlers.delete(type)
  }

  function emit(event: PluginEvent) {
    const set = handlers.get(event.type)
    if (!set) return
    for (const h of Array.from(set)) {
      try {
        h(event)
      } catch (e: any) {
        console.error("[plugin-bus] handler error:", e?.message || e)
      }
    }
  }

  return { on, off, emit }
}