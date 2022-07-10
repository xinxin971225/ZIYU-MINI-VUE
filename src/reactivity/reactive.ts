import {
  baseHandlers,
  readonlyBaseHandlers,
  shallowReadonlyBaseHandlers,
} from "./baseHandlers";

export enum activeTypeFlags {
  IS_REACTIVE = "__v_is_reactive",
  IS_READONLY = "__v_is_readonly",
}
export const proxyMap = new WeakMap();
// export const readonlyMap = new WeakMap();
export const reactive = (raw) => {
  return createActiveObject(raw, baseHandlers);
};

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyBaseHandlers);
};

/**
 * 只会做第一层的proxy转换
 * @param raw 源对象
 * @returns 一个proxy
 */
export const shallowReadonly = (raw) => {
  return createActiveObject(raw, shallowReadonlyBaseHandlers);
};

function createActiveObject(raw, Handlers) {
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
