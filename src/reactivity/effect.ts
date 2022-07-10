import { extend } from "../share/index";
let activeEffect;

/**
 * 靓仔依赖收集工厂
 * 如果说不用这种形式的话，每次收集到依赖的方法effect内部逻辑会非常复杂且不好建立联系
 */
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

/**
 * 清楚依赖组内的自己，如果有回调onStop时，调用
 * @param effect 调用方法的被收集到的依赖
 */
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  if (effect.onStop) {
    effect.onStop();
  }
}

export const isTracking = () => {
  return !!activeEffect;
};

const targetMaps = new Map();
export const track = (target, key) => {
  if (!isTracking()) return;

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
  trackEffects(dep);
};
export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;
  // 这里建立起dep对activeEffect的引用，用于trigger
  dep.add(activeEffect);
  // 这里建立起activeEffect对dep的引用，用于stop掉它
  activeEffect.deps.push(dep);
}

export const trigger = (target, key) => {
  let depsMap = targetMaps.get(target);
  if (!depsMap) return;
  let dep = depsMap.get(key);
  triggerEffects(dep);
};

export function triggerEffects(dep) {
  (dep || []).forEach((effect) => {
    if (effect.scheduler) {
      // 因为trigger在第一次获取effect时并不会执行，所以这里的效果算是替换掉原本fn
      // 不过如果不说或者没看到这里的逻辑，并不会知道有这么一个配置项
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}

// 收集依赖，找个地给存喽
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn);
  // 这里存起来跑一下触发reactive的get
  _effect.run();
  extend(_effect, options); //将所有配置项都存在当前effect方便建立与effect的联系后读取到配置
  const runner: any = _effect.run.bind(_effect);
  // 这里建立起runner与_effect的关联，而不是runner与stop的关联去实现stop功能可以更好的应对后面对effect的拓展在runner那里读取得到
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
