import { track, trigger } from "./effect";

export const reactive = (raw) => {
  return new Proxy(raw, {
    get(target, key) {
      const value = Reflect.get(target, key);
      // 收集
      track(target, key);
      return value;
    },
    set(target, key, newVal) {
      const value = Reflect.set(target, key, newVal);
      // 触发调用
      trigger(target, key);
      return value;
    },
  });
};
