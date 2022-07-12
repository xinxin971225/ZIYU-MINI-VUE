const publicFuncMap = {
  $el: (i) => i.vnode.el,
};

export const componentPublicInstanceHandlers = {
  get({ proxyInstance: instance }, key) {
    // 这里只是一个初始化proxy的方法，实际的setupState还没有挂载，但是handleSetupResult后会有
    const { setupState } = instance;
    if (key in setupState) {
      return setupState[key];
    }
    const publicGetter = publicFuncMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
