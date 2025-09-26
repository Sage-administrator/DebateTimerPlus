import type { Plugin, PluginContext, PluginMountTarget, PluginEvent } from "../core/plugin.types"

export const ChartsPlugin: Plugin = {
  id: "charts",
  init(_ctx: PluginContext) {},
  mount(_target?: PluginMountTarget) {},
  unmount() {},
  onEvent(_e: PluginEvent) {},
}