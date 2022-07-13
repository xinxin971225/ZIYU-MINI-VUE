import { createVNode, Fragment } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    if (typeof slot === "function") {
      // 这里的div可以去实现为没有dom的fragment
      return createVNode(Fragment, {}, slot(props));
    }
  }
}
