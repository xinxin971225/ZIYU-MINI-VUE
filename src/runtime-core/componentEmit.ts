import { camelize, toHandlerKey } from "../share/index";

export function emit(instance, event, ...args) {
  // 写死 小步实现-> 往通用了写

  const handlerName = toHandlerKey(event);
  const handler = instance.props[camelize(handlerName)];
  handler && handler(...args);
}
