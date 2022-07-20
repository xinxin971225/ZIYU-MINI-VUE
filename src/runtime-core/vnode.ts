// import { isObject } from "../share/index";
import { ShapeFlags } from "../share/ShapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("text");
export function createVNode(type, props?, children?: any[]) {
  const vnode = {
    type,
    props,
    children,
    component: null,
    shapeFlag: getShapeFlag(type),
    key: props && props.key,
    el: null,
  };
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof vnode.children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }

  return vnode;
}

export function createTextVNode(text) {
  return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
