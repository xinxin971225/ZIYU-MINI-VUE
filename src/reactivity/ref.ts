import { isObject } from "../share";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value;
  public deps = new Set();
  public __v_isRef = true;
  constructor(value) {
    this._value = convert(value);
  }
  get value() {
    if (isTracking()) {
      trackEffects(this.deps);
    }
    return this._value;
  }
  set value(newValue) {
    if (newValue === this._value) return;
    this._value = convert(newValue);
    triggerEffects(this.deps);
  }
}

export function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export const ref = (value) => {
  return new RefImpl(value);
};

export const isRef = (ref) => {
  return !!ref.__v_isRef;
};

export const unRef = (ref) => {
  return isRef(ref) ? ref.value : ref;
};

export function proxysRefs(obj) {
  return new Proxy(obj, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, newValue) {
      // 如果原始属性是一个ref，新属性不是ref，那么应该对原始属性的.value赋值
      if (!isRef(newValue) && isRef(target[key])) {
        return Reflect.set(target[key], "value", newValue);
      }
      // 如果原始属性是一个ref，新属性是ref，那么需要对属性做直接替换。
      // 如果原始属性不是一个ref，新属性不是ref，那么应该对原始属性赋值
      return Reflect.set(target, key, newValue);
    },
  });
}
