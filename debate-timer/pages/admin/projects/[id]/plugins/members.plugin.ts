import type { Plugin, PluginContext, PluginMountTarget, PluginEvent } from "../core/plugin.types"

export const MembersPlugin: Plugin = {
  id: "members",
  init(_ctx: PluginContext) {},
  mount(_target?: PluginMountTarget) {},
  unmount() {},
  onEvent(_e: PluginEvent) {},
}