import type { Plugin, PluginContext, PluginMountTarget, PluginEvent } from "../core/plugin.types"

export const ActionsPlugin: Plugin = {
  id: "actions",
  init(_ctx: PluginContext) {},
  mount(_target?: PluginMountTarget) {},
  unmount() {},
  onEvent(e: PluginEvent) {
    // 可处理 stage:prev / stage:next / theme:toggle 等
    void e
  },
}