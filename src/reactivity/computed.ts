import { ReactiveEffect } from "./effect";

class ComputedImly {
  private __isDirty: Boolean = true;
  private _value;
  private _effect;
  constructor(getter) {
    // 这里巧妙的利用ReactiveEffect并把执行run搜集的时机放在了get里面
    this._effect = new ReactiveEffect(getter);
    // 如果生成的effect上有scheduler，那么它再次执行的时候不会执行之前的runner fn
    // 并且这里必须是箭头函数，不然this就不会指向当前对象而是_effect
    this._effect.scheduler = () => {
      this.__isDirty = true;
    };
  }
  get value() {
    if (this.__isDirty) {
      this.__isDirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedImly(getter);
}
