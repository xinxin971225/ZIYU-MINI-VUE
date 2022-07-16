import { proxysRefs } from "../reactivity";
import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../share/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

/**
 * 暴露给用户自定义渲染器的接口，由于区别只在挂载element的时候。
 * 所以这里直接将整个流程封装起来，并提供配置参数修改对应的方法
 * 同时暴露生成的createApp跟render方法给用户
 * @param options 生成renderer的配置
 * @returns
 */
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;
  function render(vnode, container) {
    // patch
    // 方便递归

    patch(null, vnode, container, null);
  }
  function patch(n1, n2, container, parentsInstance) {
    // initialVNode ->patch
    // initialVNode ->element ->mountElement
    // 处理组件
    // 判断 是不是element -》 去processElement
    //  如果是一个element那么type =》string
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentsInstance);
        break;
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentsInstance);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentsInstance);
        }
        break;
    }
  }

  function processText(n1, n2: any, container: any) {
    const textNode = (n2.el = document.createTextNode(n2.children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentsInstance) {
    mountChildren(n2, container, parentsInstance);
  }

  function processElement(n1, n2: any, container: any, parentsInstance) {
    if (!n1) {
      // 挂载
      mountElement(n2, container, parentsInstance);
    } else {
      patchElement(n1, n2);
    }
    // TODO更新
  }
  const defaultProps = {};
  function patchElement(n1, n2) {
    console.log("patchElement");
    console.log("pre", n1);
    console.log("cur", n2);
    const oldProps = n1.props || defaultProps;
    const newProps = n2.props || defaultProps;
    // 这里在第二次更新的时候由于el 只有在mountElement 的时候挂到vnode上所以这里需要为后面更新的vnode挂上前面的el
    const el = (n2.el = n1.el);
    patchProps(el, oldProps, newProps);
  }
  function patchProps(el, oldProps, newProps) {
    // 1. 新值，做了有值的变化，应该去修改，否则不管
    // 2. 新值为undefined或者null需要去删除
    for (const key in newProps) {
      const preVal = oldProps[key];
      const newVal = newProps[key];
      if (preVal !== newVal) {
        hostPatchProp(el, key, newVal);
      }
    }
    // 3. 新值没有的需要去删除
    for (const key in oldProps) {
      if (!newProps[key]) {
        hostPatchProp(el, key, null);
      }
    }
  }

  function mountElement(vnode, container, parentsInstance) {
    // 这里是实现custom render的关键，主要流程都在这里
    // 所以把所有特定类型API换成获取形式
    const el = (vnode.el = hostCreateElement(vnode.type));
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
      hostPatchProp(el, key, val);
    }
    hostInsert(el, container);
  }

  function mountChildren(vnode, container, parentsInstance) {
    vnode.children.forEach((vnode) => {
      patch(null, vnode, container, parentsInstance);
    });
  }
  /**
   * 处理组件
   * @param vnode
   * @param container
   */
  function processComponent(n1, n2, container, parentsInstance) {
    if (!n1) {
      // 挂载
      mountComponent(n2, container, parentsInstance);
    } else {
      // TODO更新
      patchComponent(n1, n2, container, parentsInstance);
    }
  }

  function patchComponent(n1, n2, container, parentsInstance) {
    console.log("patchComponent");
    console.log("n1", n1);
    console.log("n2", n2);
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
    effect(() => {
      const { proxy } = instance;
      if (!instance.isMonuted) {
        const subTree = (instance.subTree = instance.render.call(
          proxysRefs(proxy)
        ));
        patch(null, subTree, container, instance);
        // $el读取的是当前组件的dom 也就是说patch到element到时候直接内部的el挂到当前的instance上就ok鸟
        // instance.el = subTree.el;
        // 如果说每个组件都需要一个div做根，那这个做发一定能在每个组件都访问到div el；
        // 但是vue3不需要根div，所以能不能拿到还得再测

        // 崔大推荐赋值到initialVNode上
        // 初始化的时候el就是放在vnode的这个数据体上，所以保持一致的话还是赋值到instance的vnode上而不是instance上
        initialVNode.el = subTree.el;
        instance.isMonuted = true;
      } else {
        const preSubTree = instance.subTree;
        const subTree = (instance.subTree = instance.render.call(
          proxysRefs(proxy)
        ));
        patch(preSubTree, subTree, container, instance);
        initialVNode.el = subTree.el;
      }
    });
  }
  return {
    createApp: createAppApi(render),
    render,
  };
}
