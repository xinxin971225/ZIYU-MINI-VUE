import { isObject } from "../share/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // patch
  // 方便递归

  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  // 判断 是不是element -》 去processElement
  //  如果是一个element那么type =》string
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processElement(vnode: any, container: any) {
  // 挂载
  mountElement(vnode, container);
  // TODO更新
}

function mountElement(vnode, container) {
  // 正常流程
  // const el = document.createElement('div')
  // el.textContent = 'hi'
  // el.setAttribute('id','root')
  // document.body.append(el)
  const el = document.createElement(vnode.type);
  const { props, children } = vnode;
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(vnode, el);
  }
  for (let key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }
  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach((vnode) => {
    patch(vnode, container);
  });
}
/**
 * 处理组件
 * @param vnode
 * @param container
 */
function processComponent(vnode, container) {
  // 挂载
  mountComponent(vnode, container);
  // TODO更新
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
