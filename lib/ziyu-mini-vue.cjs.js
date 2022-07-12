'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const ShapeFlags = {
    ELEMENT: 1,
    STATEFUL_COMPONENT: 1 << 1,
    TEXT_CHILDREN: 1 << 2,
    ARRAY_CHILDREN: 1 << 3, //1000
};
//  | =>
//  0000
//  0001
//  ----
//  0001
//  & =>
//  0100
//  0101
//  ----
//  0100

const publicFuncMap = {
    $el: (i) => i.vnode.el,
};
const componentPublicInstanceHandlers = {
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        proxy: null,
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
/**
 * 这里会初始化一个proxy挂到实例上
 * @param instance 组件实例
 */
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ proxyInstance: instance }, componentPublicInstanceHandlers);
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
function handleSetupResult(instance, setupResult) {
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
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    // patch
    // 方便递归
    patch(vnode, container);
}
function patch(vnode, container) {
    // 处理组件
    // 判断 是不是element -》 去processElement
    //  如果是一个element那么type =》string
    const { shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
    }
    else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    // 挂载
    mountElement(vnode, container);
    // TODO更新
}
function mountElement(vnode, container) {
    // 正常流程
    // const el = document.createElement('div')
    // el.textContent = 'hi'
    // el.setAttribute('id','root')
    // document.body.append(el)
    const el = (vnode.el = document.createElement(vnode.type));
    const { props, children, shapeFlag } = vnode;
    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(vnode, el);
    }
    // props
    for (let key in props) {
        const val = props[key];
        if (/^on[A-Z]/.test(key)) {
            const event = key.slice(2).toLocaleLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((vnode) => {
        patch(vnode, container);
    });
}
/**
 * 处理组件
 * @param vnode
 * @param container
 */
function processComponent(vnode, container) {
    // 挂载
    mountComponent(vnode, container);
    // TODO更新
}
/**
 * 挂在组件
 * 所有方法公用一个instance
 */
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // initialVNode ->patch
    // initialVNode ->element ->mountElement
    patch(subTree, container);
    //$el读取的是当前组件的dom 也就是说patch到element到时候直接内部的el挂到当前的instance上就ok鸟
    // instance.el = subTree.el;
    // 如果说每个组件都需要一个div做根，那这个做发一定能在每个组件都访问到divel；
    // 但是vue3不需要根div，所以能不能拿到还得再测
    // 崔大推荐赋值到initialVNode上
    // 初始化的时候el就是放在vnode的这个数据体上，所以保持一致的话还是赋值到instance的vnode上而不是instance上
    initialVNode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}

/**
 *
 * @param rootComponent 根组件
 */
function createApp(rootComponent) {
    return {
        /**
         *
         * @param rootContainer 根容器
         */
        mount(rootContainer) {
            // 所有东西先 -> vNode
            // component -> vNode
            // 所有逻辑都基于 vNode 做处理
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
