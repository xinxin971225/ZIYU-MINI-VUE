import { isObject } from "../share";
import { track, trigger } from "./effect";
import { activeTypeFlags, reactive, readonly } from "./reactive";
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
  return function get(target, key) {
    // 采用离谱命名的自定义字段进行判断是否能get到，这样其实会有被覆盖的风险

    if (key === activeTypeFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === activeTypeFlags.IS_READONLY) {
      return isReadonly;
    }
    // 收集
    if (!isReadonly) {
      track(target, key);
    }
    let value = Reflect.get(target, key);

    // reactive与readonly是支持嵌套结构的 ，所以这里如果是复杂类型就给她进行转为reactive
    if (isObject(value)) {
      return isReadonly ? readonly(value) : reactive(value);
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
