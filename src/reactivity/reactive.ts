import { baseHandlers, readonlyBaseHandlers } from "./baseHandlers";

export enum activeTypeFlags {
  IS_REACTIVE = "__v_is_reactive",
  IS_READONLY = "__v_is_readonly",
}

export const reactive = (raw) => {
  return createActiveObject(raw, baseHandlers);
};

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyBaseHandlers);
};

function createActiveObject(raw, Handlers) {
  return new Proxy(raw, Handlers);
}

// 判断是不是为我们代理过的对象，只需要去触发对应代理的getter，如果没有那就不算代理
export const isReactive = (obj) => {
  return !!obj[activeTypeFlags.IS_REACTIVE];
};

export const isReadonly = (obj) => {
  return !!obj[activeTypeFlags.IS_READONLY];
};
