import { ShapeFlags } from "../share/ShapeFlags";
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
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
  const el = (vnode.el = document.createElement(vnode.type));
  const { props, children, shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
 * 所有方法公用一个instance
 */
function mountComponent(initialVNode, container) {
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);

  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  // initialVNode ->patch
  // initialVNode ->element ->mountElement
  patch(subTree, container);
  //$el读取的是当前组件的dom 也就是说patch到element到时候直接内部的el挂到当前的instance上就ok鸟
  // instance.el = subTree.el;
  // 如果说每个组件都需要一个div做根，那这个做发一定能在每个组件都访问到divel；
  // 但是vue3不需要根div，所以能不能拿到还得再测

  // 崔大推荐赋值到initialVNode上
  // 初始化的时候el就是放在vnode的这个数据体上，所以保持一致的话还是赋值到instance的vnode上而不是instance上
  initialVNode.el = subTree.el;
}
