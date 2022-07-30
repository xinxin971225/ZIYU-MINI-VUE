# ZIYU-MINI-VUE - reactivity

## 响应式数据 reactive 与依赖搜集 effect

- 姿势点：

1. 巧妙的在 [effect](effect.ts) 里调用一次函数去触发响应式数据的 get 操作（黑魔法）
2. 建立响应式数据与对应依赖的方式是通过 map 的形式，可以直接以对象为 key
3. 依赖收集的时候采用 set 直接去重方便快捷

### 基于 effect 的拓展，stop、runner、scheduler、onStop

- 姿势点:

1. 首先 stop 的实现需要一个指代依赖的东西 -> 这里指的就是 effect 去执行完后应该返回依赖的一个引用即 runner
2. stop 光拿到 runner 其实也还不够，需要去 deps 里面找到 runner 把它干掉，这个就需要在返回 runner 方法的属性上添加上原本\_effect 的引用，在 dep 添加 effect 的同时，也把 dep 挂到 effect 上去，这样就能在 effect 上声明一个 stop 方法去找到两者的关系并且把 runner 从 dep 中干掉（一个相对巧妙的循环引用的感觉吧）
3. 依赖收集后其实以一个实例化的形式去初始化，这使得能我们能在这个实例上去拓展很多事情，比如 effect 的时候传入的第二个参数 options，可以直接把没一个值都丢给实例，在它需要的地方去调用，比如 scheduler、onStop，不过在没有明确的文档说明下，如果没有深入最深层的代码，是不会发现还提供了这样的功能（虽然单测都写着了）

## 响应式单值->响应式数据 ref 与 computed

- 姿势点：

1. 由于一个基本类型是没有办法去做到响应式的，所以只能用 ref 包成一个对象，并通过.value 的形式去做响应式的处理，处理完的形式与 reactive 其实差不多，不过不需要一个 depsMap，所以在 ref 里声明一个 dep set 并去复用 track 与 trigger 部分逻辑就可以了

2. computed 里用到了前面说到的 scheduler 并且巧妙的在生产 effect 实例的时候不去 run 它等到 get 的时候去 run，把 effect 函数里的逻辑进行的拆分。通过 scheduler 去控制 computed 实例里面是否需要去 run 一下获取最新的值，实现了缓存

3. ref 与 computed 的大部分相关的功能点，都是在本身实例化的时候定义到实例上的属性去完成的
