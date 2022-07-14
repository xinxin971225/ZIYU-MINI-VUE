import { ShapeFlags } from "../share/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;
  function render(vnode, container) {
    // patch
    // 方便递归

    patch(vnode, container, null);
  }
  function patch(vnode, container, parentsInstance) {
    // 处理组件
    // 判断 是不是element -》 去processElement
    //  如果是一个element那么type =》string
    const { shapeFlag, type } = vnode;
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentsInstance);
        break;
      case Text:
        processText(vnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentsInstance);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentsInstance);
        }
        break;
    }
  }

  function processText(vnode: any, container: any) {
    const textNode = (vnode.el = document.createTextNode(vnode.children));
    container.append(textNode);
  }

  function processFragment(vnode: any, container: any, parentsInstance) {
    mountChildren(vnode, container, parentsInstance);
  }

  function processElement(vnode: any, container: any, parentsInstance) {
    // 挂载
    mountElement(vnode, container, parentsInstance);
    // TODO更新
  }

  function mountElement(vnode, container, parentsInstance) {
    // Dom正常流程
    // const el = document.createElement('div')
    // el.textContent = 'hi'
    // el.setAttribute('id','root')
    // document.body.append(el)
    // 这里是实现custom render的关键，主要流程都在这里
    // 所以把所有特定类型API换成获取形式
    // const el = (vnode.el = document.createElement(vnode.type));
    const el = (vnode.el = createElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentsInstance);
    }
    // props
    for (let key in props) {
      const val = props[key];
      // if (/^on[A-Z]/.test(key)) {
      //   const event = key.slice(2).toLocaleLowerCase();
      //   el.addEventListener(event, val);
      // } else {
      //   el.setAttribute(key, val);
      // }
      patchProp(el, key, val);
    }
    insert(el, container);
    // container.append(el);
  }

  function mountChildren(vnode, container, parentsInstance) {
    vnode.children.forEach((vnode) => {
      patch(vnode, container, parentsInstance);
    });
  }
  /**
   * 处理组件
   * @param vnode
   * @param container
   */
  function processComponent(vnode, container, parentsInstance) {
    // 挂载
    mountComponent(vnode, container, parentsInstance);
    // TODO更新
  }
  /**
   * 挂在组件
   * 所有方法公用一个instance
   */
  function mountComponent(initialVNode, container, parentsInstance) {
    const instance = createComponentInstance(initialVNode, parentsInstance);

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);

    // initialVNode ->patch
    // initialVNode ->element ->mountElement
    patch(subTree, container, instance);
    //$el读取的是当前组件的dom 也就是说patch到element到时候直接内部的el挂到当前的instance上就ok鸟
    // instance.el = subTree.el;
    // 如果说每个组件都需要一个div做根，那这个做发一定能在每个组件都访问到divel；
    // 但是vue3不需要根div，所以能不能拿到还得再测

    // 崔大推荐赋值到initialVNode上
    // 初始化的时候el就是放在vnode的这个数据体上，所以保持一致的话还是赋值到instance的vnode上而不是instance上
    initialVNode.el = subTree.el;
  }
  return {
    createApp: createAppApi(render),
    render,
  };
}
