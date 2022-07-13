import { getCurrentInstance } from "./component";

export function provide(key, val) {
  const currentInstance: any = getCurrentInstance();
  if (currentInstance) {
    let { provides, parents } = currentInstance;
    const parentsProvides = parents?.provides || {};

    if (provides === parentsProvides) {
      // 这里通过修改原型链的形式比在给provides初始化时去结构父级provides来的节省很多内存
      currentInstance.provides = Object.create(parentsProvides);
    }
    currentInstance.provides[key] = val;
  }
}

export function inject(key, defaultVal) {
  const currentInstance: any = getCurrentInstance();
  const parentsProvides = currentInstance.parents.provides;
  const value = parentsProvides[key];
  if (value) {
    return value;
  } else if (defaultVal) {
    if (typeof defaultVal === "function") {
      return defaultVal();
    }
    return defaultVal;
  }
}
