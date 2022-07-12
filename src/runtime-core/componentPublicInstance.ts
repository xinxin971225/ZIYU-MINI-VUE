import { hasOwn } from "../share/index";

const publicFuncMap = {
  $el: (i) => i.vnode.el,
};

export const componentPublicInstanceHandlers = {
  get({ proxyInstance: instance }, key) {
    // 这里只是一个初始化proxy的方法，实际的setupState还没有挂载，但是handleSetupResult后会有
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    const publicGetter = publicFuncMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
