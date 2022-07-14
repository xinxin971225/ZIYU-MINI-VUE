import { createVNode } from "./vnode";

export function createAppApi(render) {
  /**
   * @param rootComponent 根组件
   */
  return function createApp(rootComponent) {
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
  };
}
