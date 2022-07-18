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
    setElementText: hostSetElementText,
    removeChildren: hostRemoveChildren,
  } = options;
  function render(vnode, container) {
    // patch
    // 方便递归

    patch(null, vnode, container, null, null);
  }
  function patch(n1, n2, container, parentsInstance, anchor) {
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
          processElement(n1, n2, container, parentsInstance, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentsInstance, anchor);
        }
        break;
    }
  }

  function processText(n1, n2: any, container: any) {
    const textNode = (n2.el = document.createTextNode(n2.children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentsInstance) {
    mountChildren(n2.children, container, parentsInstance);
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentsInstance,
    anchor
  ) {
    if (!n1) {
      // 挂载
      mountElement(n2, container, parentsInstance, anchor);
    } else {
      patchElement(n1, n2, parentsInstance);
    }
    // TODO更新
  }
  const defaultProps = {};
  function patchElement(n1, n2, parentsInstance) {
    console.log("patchElement");
    console.log("pre", n1);
    console.log("cur", n2);
    const oldProps = n1.props || defaultProps;
    const newProps = n2.props || defaultProps;
    // 这里在第二次更新的时候由于el 只有在mountElement 的时候挂到vnode上所以这里需要为后面更新的vnode挂上前面的el
    const el = (n2.el = n1.el);
    patchChildren(n1, n2, el, parentsInstance);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentsInstance) {
    const { shapeFlag: oldShapeFlag } = n1;
    const { shapeFlag: newShapeFlag } = n2;
    const c1 = n1.children;
    const c2 = n2.children;
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (c1 !== c2) {
        hostSetElementText(c2, container);
      }
    } else if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 因为mountChildren只会append，所以需要把之前的节点清掉
        hostSetElementText("", container);
        mountChildren(c2, container, parentsInstance);
      } else {
        patchKeyedChildren(c1, c2, container, parentsInstance);
      }
    }
  }
  function patchKeyedChildren(c1, c2, container, parentsInstance) {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    function isSomeVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }
    // 从左往右找出相同的 这里小于等于为了找出左边第一个不同的index
    while (i <= e2 && i <= e1) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentsInstance, null);
      } else {
        break;
      }
      i++;
    }
    // 从右往左找出相同的 这里小于等于为了找出右边第一个不同的index
    while (i <= e2 && i <= e1) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentsInstance, null);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 新的比旧的长去添加
    if (i > e1) {
      while (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        patch(null, c2[i], container, parentsInstance, anchor);
        i++;
      }
    }
    // 旧的比新的长去删除
    if (i > e2) {
      while (i <= e1) {
        hostRemoveChildren(c1[i].el);
        i++;
      }
    }
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

  function mountElement(vnode, container, parentsInstance, anchor) {
    // 这里是实现custom render的关键，主要流程都在这里
    // 所以把所有特定类型API换成获取形式
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentsInstance);
    }
    // props
    for (let key in props) {
      const val = props[key];
      hostPatchProp(el, key, val);
    }
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentsInstance) {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentsInstance, null);
    });
  }
  /**
   * 处理组件
   * @param vnode
   * @param container
   */
  function processComponent(n1, n2, container, parentsInstance, anchor) {
    if (!n1) {
      // 挂载
      mountComponent(n2, container, parentsInstance, anchor);
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
  function mountComponent(initialVNode, container, parentsInstance, anchor) {
    const instance = createComponentInstance(initialVNode, parentsInstance);

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    effect(() => {
      const { proxy } = instance;
      if (!instance.isMonuted) {
        const subTree = (instance.subTree = instance.render.call(
          proxysRefs(proxy)
        ));
        patch(null, subTree, container, instance, anchor);
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
        patch(preSubTree, subTree, container, instance, anchor);
        initialVNode.el = subTree.el;
      }
    });
  }
  return {
    createApp: createAppApi(render),
    render,
  };
}
