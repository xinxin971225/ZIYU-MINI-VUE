import { proxysRefs } from "../reactivity";
import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../share/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { needUpdateProps } from "./componentUpdatePropsUtils";
import { createAppApi } from "./createApp";
import { queueJobs } from "./scheduler";
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
  }
  const defaultProps = {};
  function patchElement(n1, n2, parentsInstance) {
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
  /**
   * diff
   * @param c1 oldChildren
   * @param c2 newChildren
   * @param container element容器
   * @param parentsInstance 父容器
   */
  function patchKeyedChildren(c1, c2, container, parentsInstance) {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    function isSomeVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }
    let headPatched = false;
    let tailPatched = false;
    while (i <= e2 && i <= e1) {
      const p1 = c1[i];
      const p2 = c2[i];
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (!headPatched) {
        if (isSomeVNodeType(p1, p2)) {
          // 从左往右找出相同的 这里小于等于为了找出左边第一个不同的index
          patch(p1, p2, container, parentsInstance, null);
          i++;
        } else {
          headPatched = true;
        }
      }
      if (!tailPatched) {
        if (isSomeVNodeType(n1, n2)) {
          // 从右往左找出相同的 这里小于等于为了找出右边第一个不同的index

          patch(n1, n2, container, parentsInstance, null);
          e1--;
          e2--;
        } else {
          tailPatched = true;
        }
      }
      if (headPatched && tailPatched) {
        break;
      }
    }
    // 新的比旧的长去添加
    if (i > e1) {
      while (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        patch(null, c2[i], container, parentsInstance, anchor);
        i++;
      }
    } else if (i > e2) {
      // 旧的比新的长去删除
      while (i <= e1) {
        hostRemoveChildren(c1[i].el);
        i++;
      }
    } else {
      // 这里i比e1小也比e2小说明中间的都不同-> 中间对比
      const nextChildMap = new Map();
      let s1 = i;
      let s2 = i;
      const toBePatched = e2 - s2 + 1; // 这里两个索引相减，实际个数是+1的
      const newChildIndexToOldChildIndexMap = new Array(toBePatched); // 构件一个新diff数组对久diff数组的索引关系
      // 遍历久数组时，如果每次映射到新数组的下标是递增的话，就不需要去计算最长的序列了
      let needComputeSquenceAndMove = false;
      let maxComputeIndex = 0;
      // 这里默认先填充0 表示还没去对过
      for (let i = 0; i < toBePatched; i++)
        newChildIndexToOldChildIndexMap[i] = 0;

      let patched = 0;
      // 建立新的children key 与index 的map
      for (let i = s2; i <= e2; i++) {
        const { key } = c2[i];
        nextChildMap.set(key, i);
      }
      // 遍历久的children -》有key去map里拿，没key 去遍历新的children -》把没有在新数组里面的值删掉
      for (let i = s1; i <= e1; i++) {
        const preChild = c1[i];
        if (patched === toBePatched) {
          hostRemoveChildren(preChild.el);
          continue;
        }
        let nextIndex;
        if (preChild.key) {
          nextIndex = nextChildMap.get(preChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            const nextchild = c2[j];
            if (isSomeVNodeType(preChild, nextchild)) {
              nextIndex = j;
              break;
            }
          }
        }
        if (!nextIndex) {
          hostRemoveChildren(preChild.el);
        } else {
          // 当发现映射到新素组的位置变小了，说明有需要移动的元素，这时候就要整体去计算increasingNewIndexSequence
          if (!needComputeSquenceAndMove && nextIndex < maxComputeIndex) {
            maxComputeIndex = nextIndex;
          } else {
            needComputeSquenceAndMove = true;
          }

          // 每次patch到新旧相同的节点是，将他们的对应关系保存到newChildIndexToOldChildIndexMap 中
          // newChildIndexToOldChildIndexMap的索引针对到是diff的那一截，所以需要用nextIndex - s2
          newChildIndexToOldChildIndexMap[nextIndex - s2] =
            /**对应的久的数组的索引 */ i + 1;

          patch(preChild, c2[nextIndex], container, parentsInstance, null);
          patched++;
        }
      }
      // 如果前面都是的久数组到新数组依旧是递增到那么只需要去创建没有到节点
      const increasingNewIndexSequence = needComputeSquenceAndMove
        ? getSequence(newChildIndexToOldChildIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;
      // 这里从前往后遍历可能出现下一个元素位置不确定的情况，所以采用一个从后往前遍历
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2; // 为了拿到对应的child 需要把前面计算索引减去的s2加回去
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newChildIndexToOldChildIndexMap[i] === 0) {
          // 对应的
          patch(null, c2[nextIndex], container, parentsInstance, anchor);
        } else if (needComputeSquenceAndMove) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // 说明不是序列内的需要去移动它
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 如果已经对比过的值说明已经不用管他也不用再次去对比了
            j--;
          }
        }
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
      patchComponent(n1, n2);
    }
  }

  function patchComponent(n1, n2) {
    const instance = (n2.component = n1.component);

    if (needUpdateProps(n1, n2)) {
      // 1. 需要去更新props
      instance.props = n2.props;
      // 2. 需要去重新调用render
      instance.updateRunner();
    }
    n2.el = n1.el; //这一句解决组件获取el的问题
    instance.vnode = n2; //这一句暂且不知道解决什么问题
  }
  /**
   * 挂在组件
   * 所有方法公用一个instance
   */
  function mountComponent(initialVNode, container, parentsInstance, anchor) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentsInstance
    ));

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    // 将runner丢给instance，在更新时可以调用
    instance.updateRunner = effect(
      () => {
        const proxy = proxysRefs(instance.proxy);
        if (!instance.isMonuted) {
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
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
            proxy,
            proxy
          ));
          patch(preSubTree, subTree, container, instance, anchor);
          initialVNode.el = subTree.el;
        }
      },
      {
        // 由于响应式变量的变更总会触发重新render，但实际上我们只关注最后一次变更的结果，所以采用一个异步更新的方式
        // 采用scheduler的形式原因 -> 首屏加载需要有一个内容加载一个内容所以是同步去进行的，而更新只需要结果
        scheduler: () => {
          console.log("update");
          queueJobs(instance.updateRunner);
        },
      }
    );
  }
  return {
    createApp: createAppApi(render),
    render,
  };
}
function getSequence(arr) {
  const p = arr.slice(); //拷贝一份arr ->用于储存在对应元素在res中前面元素的位置
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1]; //取result的最后一个的值 -> 对应arr里面的index
      if (arr[j] < arrI) {
        //拿出目前序列的最大值去与当前的值做对比
        p[i] = j; //记录res位置
        result.push(i); // 添加大的值
        continue;
      }

      // 二分查找 -> 当前元素在res中对应的最接近的位置
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;

        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      // 贪心直接把对应的最接近的位置给替换掉
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  // 计算完最大长度后对应的下标在最后一次替换完会有一个错误 -> 通过p的回溯，倒序把下标还原
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
