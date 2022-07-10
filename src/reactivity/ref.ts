import { isObject } from "../share";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value;
  public deps = new Set();
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
