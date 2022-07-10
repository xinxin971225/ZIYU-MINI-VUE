import { track, trigger } from "./effect";
import { activeTypeFlags } from "./reactive";
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(readonly = false) {
  return function get(target, key) {
    const value = Reflect.get(target, key);
    // 采用离谱命名的自定义字段进行判断是否能get到，这样其实会有被覆盖的风险
    if (key === activeTypeFlags.IS_REACTIVE) {
      return !readonly;
    } else if (key === activeTypeFlags.IS_READONLY) {
      return readonly;
    }
    // 收集
    if (!readonly) {
      track(target, key);
    }
    return value;
  };
}
function createSetter() {
  return function set(target, key, newVal) {
    const value = Reflect.set(target, key, newVal);
    // 触发调用
    trigger(target, key);
    return value;
  };
}

export const baseHandlers = {
  // 这里不需要每次创建baseHandlers的时候都去生成一个，所以在外部先定义好
  get,
  set,
};

export const readonlyBaseHandlers = {
  get: readonlyGet,
  set: (target, key, value) => {
    console.warn(`${target} is readonly can't set key: ${key}`);
    return true;
  },
};
