import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { componentPublicInstanceHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
let currentInstance = null;
export function createComponentInstance(vnode: any) {
  const component: any = {
    vnode,
    type: vnode.type,
    proxy: null,
    props: {},
    setupState: {},
    emit: () => {},
    slots: [],
  };
  // 小技巧，通过bind返回的函数第一个参数就是component，在传入的都往后排
  component.emit = emit.bind(null, component);
  return component;
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);

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
    setCurrentInstance(instance);
    const { props, emit } = instance;
    const setupResult = setup(shallowReadonly(props), {
      emit,
    });
    setCurrentInstance(null);
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

export function getCurrentInstance() {
  return currentInstance;
}
function setCurrentInstance(instance) {
  currentInstance = instance;
}
