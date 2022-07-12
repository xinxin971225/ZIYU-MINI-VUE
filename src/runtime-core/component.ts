import { componentPublicInstanceHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode: any) {
  const component = {
    vnode,
    type: vnode.type,
    proxy: null,
  };
  return component;
}

export function setupComponent(instance) {
  // TODO
  // initProps()
  // initSlots()

  setupStatefulComponent(instance);
}

/**
 * 这里会初始化一个proxy挂到实例上
 * @param instance 组件实例
 */
function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  instance.proxy = new Proxy(
    { proxyInstance: instance },
    componentPublicInstanceHandlers
  );
  const { setup } = Component;
  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}
/**
 * 这里会挂载一个setupState 到组件实例上
 * @param instance 组件实例
 * @param setupResult setup的结果
 */
function handleSetupResult(instance, setupResult: any) {
  // setupResult -> function object

  // TODO -》 function

  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

/**
 * 把组件的render挂载到组件实例上
 * @param instance 组件实例
 */
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}
