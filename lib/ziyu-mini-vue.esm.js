const isObject = (data) => {
    return data !== null && typeof data === "object";
};
const extend = Object.assign;
const hasChangeed = (val1, val2) => {
    return !Object.is(val1, val2);
};
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

let activeEffect;
/**
 * 靓仔依赖收集工厂
 * 如果说不用这种形式的话，每次收集到依赖的方法effect内部逻辑会非常复杂且不好建立联系
 */
class ReactiveEffect {
    constructor(fn) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        const fnData = this._fn();
        activeEffect = null;
        return fnData;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            this.active = false;
        }
    }
}
/**
 * 清楚依赖组内的自己，如果有回调onStop时，调用
 * @param effect 调用方法的被收集到的依赖
 */
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    if (effect.onStop) {
        effect.onStop();
    }
}
const isTracking = () => {
    return !!activeEffect;
};
const targetMaps = new Map();
const track = (target, key) => {
    if (!isTracking())
        return;
    // 需要通过target去找到对应的key所对应的effect
    // effect需要进行去重所以采用set =》es6
    // target上不希望被修改到，但是又需要target与key直接建立联系，这里可以采用map
    let depsMap = targetMaps.get(target);
    // 考虑到初始化没有对应map所以需要有异常处理
    if (!depsMap) {
        depsMap = new Map();
        targetMaps.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    // dep与map的处理是类似的
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
};
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    // 这里建立起dep对activeEffect的引用，用于trigger
    dep.add(activeEffect);
    // 这里建立起activeEffect对dep的引用，用于stop掉它
    activeEffect.deps.push(dep);
}
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
// 收集依赖，找个地给存喽
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    // 这里存起来跑一下触发reactive的get
    _effect.run();
    extend(_effect, options); //将所有配置项都存在当前effect方便建立与effect的联系后读取到配置
    const runner = _effect.run.bind(_effect);
    // 这里建立起runner与_effect的关联，而不是runner与stop的关联去实现stop功能可以更好的应对后面对effect的拓展在runner那里读取得到
    runner.effect = _effect;
    return runner;
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
        // 收集
        if (!isReadonly) {
            track(target, key);
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

class RefImpl {
    constructor(value) {
        this.deps = new Set();
        this.__v_isRef = true;
        this._value = convert(value);
    }
    get value() {
        if (isTracking()) {
            trackEffects(this.deps);
        }
        return this._value;
    }
    set value(newValue) {
        if (hasChangeed(newValue, this._value)) {
            this._value = convert(newValue);
            triggerEffects(this.deps);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
const ref = (value) => {
    return new RefImpl(value);
};
const isRef = (ref) => {
    return !!ref.__v_isRef;
};
const unRef = (ref) => {
    return isRef(ref) ? ref.value : ref;
};
function proxysRefs(obj) {
    return new Proxy(obj, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newValue) {
            // 如果原始属性是一个ref，新属性不是ref，那么应该对原始属性的.value赋值
            if (!isRef(newValue) && isRef(target[key])) {
                return Reflect.set(target[key], "value", newValue);
            }
            // 如果原始属性是一个ref，新属性是ref，那么需要对属性做直接替换。
            // 如果原始属性不是一个ref，新属性不是ref，那么应该对原始属性赋值
            return Reflect.set(target, key, newValue);
        },
    });
}

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
    $props: (i) => i.props,
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
function createComponentInstance(vnode, parentsInstance) {
    const component = {
        vnode,
        type: vnode.type,
        proxy: null,
        props: {},
        updateRunner: () => { },
        setupState: {},
        emit: () => { },
        slots: [],
        isMonuted: false,
        subTree: {},
        // 这里虽然采用结构能够实现一样的功能，但是十分的消耗内存
        provides: parentsInstance ? parentsInstance.provides : {},
        parents: parentsInstance,
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

function needUpdateProps(preVnode, nextVnode) {
    const { props: preProps } = preVnode;
    const { props: nextProps } = nextVnode;
    for (const key in nextProps) {
        if (nextProps[key] !== preProps[key]) {
            return true;
        }
    }
    return false;
}

// import { isObject } from "../share/index";
const Fragment = Symbol("Fragment");
const Text = Symbol("text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        shapeFlag: getShapeFlag(type),
        key: props && props.key,
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

/**
 * 由于createRenderer将所有vnode处理方法封装了一层，原本的createApp内部需要的render已经读取不到
 * 所以这里对默认createApp 封装一层去获取到对应的render，并返回createApp
 * @param render
 * @returns
 */
function createAppApi(render) {
    /**
     * @param rootComponent 根组件
     */
    return function createApp(rootComponent) {
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
    };
}

/**
 * 暴露给用户自定义渲染器的接口，由于区别只在挂载element的时候。
 * 所以这里直接将整个流程封装起来，并提供配置参数修改对应的方法
 * 同时暴露生成的createApp跟render方法给用户
 * @param options 生成renderer的配置
 * @returns
 */
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setElementText: hostSetElementText, removeChildren: hostRemoveChildren, } = options;
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
                }
                else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, parentsInstance, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const textNode = (n2.el = document.createTextNode(n2.children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentsInstance) {
        mountChildren(n2.children, container, parentsInstance);
    }
    function processElement(n1, n2, container, parentsInstance, anchor) {
        if (!n1) {
            // 挂载
            mountElement(n2, container, parentsInstance, anchor);
        }
        else {
            patchElement(n1, n2, parentsInstance);
        }
        // TODO更新
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
        }
        else if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                // 因为mountChildren只会append，所以需要把之前的节点清掉
                hostSetElementText("", container);
                mountChildren(c2, container, parentsInstance);
            }
            else {
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
                }
                else {
                    headPatched = true;
                }
            }
            if (!tailPatched) {
                if (isSomeVNodeType(n1, n2)) {
                    // 从右往左找出相同的 这里小于等于为了找出右边第一个不同的index
                    patch(n1, n2, container, parentsInstance, null);
                    e1--;
                    e2--;
                }
                else {
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
        }
        else if (i > e2) {
            // 旧的比新的长去删除
            while (i <= e1) {
                hostRemoveChildren(c1[i].el);
                i++;
            }
        }
        else {
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
                }
                else {
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
                }
                else {
                    // 当发现映射到新素组的位置变小了，说明有需要移动的元素，这时候就要整体去计算increasingNewIndexSequence
                    if (!needComputeSquenceAndMove && nextIndex < maxComputeIndex) {
                        maxComputeIndex = nextIndex;
                    }
                    else {
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
                }
                else if (needComputeSquenceAndMove) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 说明不是序列内的需要去移动它
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
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
        }
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
        }
        else {
            patchComponent(n1, n2);
        }
    }
    function patchComponent(n1, n2) {
        if (needUpdateProps(n1, n2)) {
            // 1. 需要去更新props
            const instance = (n2.component = n1.component);
            instance.props = n2.props;
            // 2. 需要去重新调用render
            instance.updateRunner();
        }
    }
    /**
     * 挂在组件
     * 所有方法公用一个instance
     */
    function mountComponent(initialVNode, container, parentsInstance, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentsInstance));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 将runner丢给instance，在更新时可以调用
        instance.updateRunner = effect(() => {
            const { proxy } = instance;
            if (!instance.isMonuted) {
                const subTree = (instance.subTree = instance.render.call(proxysRefs(proxy)));
                patch(null, subTree, container, instance, anchor);
                // $el读取的是当前组件的dom 也就是说patch到element到时候直接内部的el挂到当前的instance上就ok鸟
                // instance.el = subTree.el;
                // 如果说每个组件都需要一个div做根，那这个做发一定能在每个组件都访问到div el；
                // 但是vue3不需要根div，所以能不能拿到还得再测
                // 崔大推荐赋值到initialVNode上
                // 初始化的时候el就是放在vnode的这个数据体上，所以保持一致的话还是赋值到instance的vnode上而不是instance上
                initialVNode.el = subTree.el;
                instance.isMonuted = true;
            }
            else {
                const preSubTree = instance.subTree;
                const subTree = (instance.subTree = instance.render.call(proxysRefs(proxy)));
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
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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

function provide(key, val) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides, parents } = currentInstance;
        const parentsProvides = (parents === null || parents === void 0 ? void 0 : parents.provides) || {};
        if (provides === parentsProvides) {
            // 这里通过修改原型链的形式比在给provides初始化时去结构父级provides来的节省很多内存
            currentInstance.provides = Object.create(parentsProvides);
        }
        currentInstance.provides[key] = val;
    }
}
function inject(key, defaultVal) {
    const currentInstance = getCurrentInstance();
    const parentsProvides = currentInstance.parents.provides;
    const value = parentsProvides[key];
    if (value) {
        return value;
    }
    else if (defaultVal) {
        if (typeof defaultVal === "function") {
            return defaultVal();
        }
        return defaultVal;
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

// Dom正常流程
// const el = document.createElement('div')
// el.textContent = 'hi'
// el.setAttribute('id','root')
// document.body.append(el)
function createElement(type) {
    // console.log("createElement");
    return document.createElement(type);
}
function patchProp(el, key, val) {
    if (/^on[A-Z]/.test(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, val);
    }
    else {
        if (val === undefined || val === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, val);
        }
    }
}
function insert(children, parent, anchor) {
    // console.log("insert");
    // 这个api只会往后面塞元素，如果在前面就挂了
    // parent.append(el);
    // insertBefore 可以在anchor（锚点）前面append children，默认给null时就往后塞
    parent.insertBefore(children, anchor || null);
}
function setElementText(text, el) {
    // 这里会直接覆盖元素内部的所有内容所有无需在前面去清楚children
    el.textContent = text;
}
function removeChildren(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    setElementText,
    removeChildren,
});
/**
 * 这里由于暴露一个默认的createApp（dom），所以需要我们通过createRenderer生成一个默认的renderer，
 * 并把createApp给出去，但是createApp在renderer，所以为它包一层名为createApp的方法
 * @param args 用户的参数
 * @returns
 */
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createTextVNode, getCurrentInstance, h, inject, provide, proxysRefs, ref, renderSlots };
