import { render } from "./renderer";
import { createVNode } from "./vnode";

/**
 *
 * @param rootComponent 根组件
 */
export function createApp(rootComponent) {
  return {
    /**
     *
     * @param rootContainer 根容器
     */
    mount(rootContainer) {
      // 所有东西先 -> vNode
      // component -> vNode
      // 所有逻辑都基于 vNode 做处理
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer);
    },
  };
}
