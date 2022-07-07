let activeEffect;
class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}

const targetMaps = new Map();
export const track = (target, key) => {
  // 需要通过target去找到对应的key所对应的effect
  // effect需要进行去重所以采用set =》es6
  // target上不希望被修改到，但是又需要target与key直接建立联系，这里可以采用map
  let depsMap = targetMaps.get(target);
  // 考虑到初始化没有对应map所以需要有异常处理
  if (!depsMap) {
    depsMap = new Map();
    targetMaps.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  // dep与map的处理是类似的
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
};

export const trigger = (target, key) => {
  let depsMap = targetMaps.get(target);
  let dep = depsMap.get(key);
  dep.forEach((effect) => {
    effect.run();
  });
};

// 收集依赖，找个地给存喽
export const effect = (fn) => {
  const _effects = new ReactiveEffect(fn);
  // 这里存起来跑一下触发reactive的get
  _effects.run();
};
