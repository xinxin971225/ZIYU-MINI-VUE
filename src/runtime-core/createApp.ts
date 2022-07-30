import { createVNode } from "./vnode";

/**
 * 由于createRenderer将所有vnode处理方法封装了一层，原本的createApp内部需要的render已经读取不到
 * 所以这里对默认createApp 封装一层去获取到对应的render，并返回createApp
 * @param render
 * @returns
 */
export function createAppApi(render) {
  /**
   * 内层就是没有custom render的版本
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
