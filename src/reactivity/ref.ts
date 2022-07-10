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
  if (isRef(ref)) {
    return ref.value;
  }
  return ref;
};
