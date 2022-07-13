'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const ShapeFlags = {
    ELEMENT: 1,
    STATEFUL_COMPONENT: 1 << 1,
    TEXT_CHILDREN: 1 << 2,
    ARRAY_CHILDREN: 1 << 3,
    SLOTS_CHILDREN: 1 << 4, //1000
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

const isObject = (data) => {
    return data !== null && typeof data === "object";
};
const extend = Object.assign;
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
function camelize(str) {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toLocaleUpperCase() : "";
    });
}
function capitalize(str) {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
}
function toHandlerKey(str) {
    return str ? "on" + capitalize(str) : "";
}

const targetMaps = new Map();
const trigger = (target, key) => {
    let depsMap = targetMaps.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    triggerEffects(dep);
};
function triggerEffects(dep) {
    (dep || []).forEach((effect) => {
        if (effect.scheduler) {
            // 因为trigger在第一次获取effect时并不会执行，所以这里的效果算是替换掉原本fn
            // 不过如果不说或者没看到这里的逻辑，并不会知道有这么一个配置项
            effect.scheduler();
        }
        else {
            effect.run();
        }
    });
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallowReadonly = false) {
    return function get(target, key) {
        // 采用离谱命名的自定义字段进行判断是否能get到，这样其实会有被覆盖的风险
        if (key === activeTypeFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === activeTypeFlags.IS_READONLY) {
            return isReadonly;
        }
        let value = Reflect.get(target, key);
        if (isShallowReadonly) {
            return value;
        }
        // reactive与readonly是支持嵌套结构的 ，所以这里如果是复杂类型就给她进行转为reactive
        if (isObject(value)) {
            return isReadonly ? readonly(value) : reactive(value);
        }
        return value;
    };
}
function createSetter() {
    return function set(target, key, newVal) {
        const oldVal = target[key];
        if (oldVal === newVal)
            return true;
        const value = Reflect.set(target, key, newVal);
        // 触发调用
        trigger(target, key);
        return value;
    };
}
const baseHandlers = {
    // 这里不需要每次创建baseHandlers的时候都去生成一个，所以在外部先定义好
    get,
    set,
};
const readonlyBaseHandlers = {
    get: readonlyGet,
    set: (target, key, value) => {
        console.warn(`${target} is readonly can't set key: ${key}`);
        return true;
    },
};
const shallowReadonlyBaseHandlers = extend({}, readonlyBaseHandlers, {
    get: shallowReadonlyGet,
});

var activeTypeFlags;
(function (activeTypeFlags) {
    activeTypeFlags["IS_REACTIVE"] = "__v_is_reactive";
    activeTypeFlags["IS_READONLY"] = "__v_is_readonly";
})(activeTypeFlags || (activeTypeFlags = {}));
const proxyMap = new WeakMap();
// export const readonlyMap = new WeakMap();
const reactive = (raw) => {
    return createActiveObject(raw, baseHandlers);
};
const readonly = (raw) => {
    return createActiveObject(raw, readonlyBaseHandlers);
};
/**
 * 只会做第一层的proxy转换
 * @param raw 源对象
 * @returns 一个proxy
 */
const shallowReadonly = (raw) => {
    return createActiveObject(raw, shallowReadonlyBaseHandlers);
};
function createActiveObject(raw, Handlers) {
    // 每次创建一个复杂对象的proxy的时候进行一次缓存，以源对象作为key
    // 不会在每次都创建一个新的，丢失上一次创建好的proxy与它所搜集的各种依赖
    const cacheProxy = proxyMap.get(raw);
    if (cacheProxy) {
        return cacheProxy;
    }
    const newProxy = new Proxy(raw, Handlers);
    proxyMap.set(raw, newProxy);
    return newProxy;
}

function emit(instance, event, ...args) {
    // 写死 小步实现-> 往通用了写
    const handlerName = toHandlerKey(event);
    const handler = instance.props[camelize(handlerName)];
    handler && handler(...args);
}

function initProps(instance, props) {
    instance.props = props || {};
}

const publicFuncMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const componentPublicInstanceHandlers = {
    get({ proxyInstance: instance }, key) {
        // 这里只是一个初始化proxy的方法，实际的setupState还没有挂载，但是handleSetupResult后会有
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicFuncMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    // instance.slots = Array.isArray(children) ? children : [children];
    // 1.基于简单的slot只需要将children赋值给instance的slots并且在子组件通过render里的this去读取$slots，并且所有children都当数组处理
    // 2. 为了实现具名slot，数据结构转变为对象，将整个对象内部的value都当作数组处理，到对应的位置去读取对应的值，然后创建一个vnode
    // 3. 为了实现作用域插槽,所有的children都变成函数的形式可以接受参数，同时返回vnode并最后统一处理为数组
    if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        // 在type是slot之后才处理
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (let key in children) {
        const slot = children[key];
        slots[key] = (props) => normalizeSlotValue(slot(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        proxy: null,
        props: {},
        setupState: {},
        emit: () => { },
        slots: [],
    };
    // 小技巧，通过bind返回的函数第一个参数就是component，在传入的都往后排
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
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
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

// import { isObject } from "../share/index";
const Fragment = Symbol("Fragment");
const Text = Symbol("text");
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
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof vnode.children === "object") {
            vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
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
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container);
            }
            else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                processComponent(vnode, container);
            }
            break;
    }
}
function processText(vnode, container) {
    const textNode = document.createTextNode(vnode.children);
    container.append(textNode);
}
function processFragment(vnode, container) {
    mountChildren(vnode, container);
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

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            // 这里的div可以去实现为没有dom的fragment
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.renderSlots = renderSlots;
