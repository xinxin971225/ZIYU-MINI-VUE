import { baseHandlers, readonlyBaseHandlers } from "./baseHandlers";

export enum activeTypeFlags {
  IS_REACTIVE = "__v_is_reactive",
  IS_READONLY = "__v_is_readonly",
}
export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const reactive = (raw) => {
  return createActiveObject(raw, reactiveMap, baseHandlers);
};

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyMap, readonlyBaseHandlers);
};

function createActiveObject(raw, proxyMap, Handlers) {
  // 每次创建一个复杂对象的proxy的时候进行一次缓存，以源对象作为key
  // 不会在每次都创建一个新的，丢失上一次创建好的proxy与它所搜集的各种依赖
  const cacheProxy = proxyMap.get(raw);
  if (cacheProxy) {
    return cacheProxy;
  }
  const newProxy = new Proxy(raw, Handlers);
  proxyMap.set(raw, newProxy);
  return newProxy;
}

// 判断是不是为我们代理过的对象，只需要去触发对应代理的getter，如果没有那就不算代理
export const isReactive = (obj) => {
  return !!obj[activeTypeFlags.IS_REACTIVE];
};

export const isReadonly = (obj) => {
  return !!obj[activeTypeFlags.IS_READONLY];
};
