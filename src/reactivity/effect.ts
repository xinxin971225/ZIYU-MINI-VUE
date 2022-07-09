class ReactiveEffect {
  private _fn;
  deps = [];
  onStop: Function | undefined;
  active: Boolean = true;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    const fnData = this._fn();
    activeEffect = null;
    return fnData;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  if (effect.onStop) {
    effect.onStop();
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
  if (!activeEffect) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
};

export const trigger = (target, key) => {
  let depsMap = targetMaps.get(target);
  let dep = depsMap.get(key);
  dep.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
};
let activeEffect;

// 收集依赖，找个地给存喽
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn);
  // 这里存起来跑一下触发reactive的get
  _effect.run();
  Object.assign(_effect, options);
  const runner: any = _effect.run.bind(_effect);
  runner.effects = _effect;
  return runner;
}

export function stop(runner) {
  runner.effects.stop();
}
