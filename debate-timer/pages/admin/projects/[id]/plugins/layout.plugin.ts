import type { Plugin, PluginContext, PluginMountTarget, PluginEvent } from "../core/plugin.types"

export const LayoutPlugin: Plugin = {
  id: "layout",
  init(_ctx: PluginContext) {},
  mount(_target?: PluginMountTarget) {},
  unmount() {},
  onEvent(_e: PluginEvent) {},
}