import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // patch
  // 方便递归

  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  // 判断 是不是element -》 去processElement
  processComponent(vnode, container);
}
/**
 * 处理组件
 * @param vnode
 * @param container
 */
function processComponent(vnode, container) {
  mountComponent(vnode, container);
}
/**
 * 挂在组件
 */
function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);

  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render();

  // vnode ->patch
  // vnode ->element ->mountElement
  patch(subTree, container);
}
