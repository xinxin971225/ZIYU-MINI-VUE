import { ShapeFlags } from "../share/ShapeFlags";

export function initSlots(instance, children) {
  const { vnode } = instance;
  // instance.slots = Array.isArray(children) ? children : [children];
  // 1.基于简单的slot只需要将children赋值给instance的slots并且在子组件通过render里的this去读取$slots，并且所有children都当数组处理

  // 2. 为了实现具名slot，数据结构转变为对象，将整个对象内部的value都当作数组处理，到对应的位置去读取对应的值，然后创建一个vnode

  // 3. 为了实现作用域插槽,所有的children都变成函数的形式可以接受参数，同时返回vnode并最后统一处理为数组
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 在type是slot之后才处理
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children, slots) {
  for (let key in children) {
    const slot = children[key];
    slots[key] = (props) => normalizeSlotValue(slot(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
