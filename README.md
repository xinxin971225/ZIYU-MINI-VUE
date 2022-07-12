# ZIYU-MINI-VUE

## 响应式数据reactive与依赖搜集effect

- 姿势点：

1. 巧妙的在effect里调用一次函数去触发响应式数据的get操作（黑魔法）
2. 建立响应式数据与对应依赖的方式是通过map的形式，可以直接以对象为key
3. 依赖收集的时候采用set直接去重方便快捷

### 基于effect的拓展，stop、runner、scheduler、onStop

- 姿势点:

1. 首先stop的实现需要一个指代依赖的东西 -> 这里指的就是effect去执行完后应该返回依赖的一个引用即runner
2. stop光拿到runner其实也还不够，需要去deps里面找到runner把它干掉，这个就需要在返回runner方法的属性上添加上原本_effect的引用，在dep添加effect的同时，也把dep挂到effect上去，这样就能在effect上声明一个stop方法去找到两者的关系并且把runner从dep中干掉（一个相对巧妙的循环引用的感觉吧）
3. 依赖收集后其实以一个实例化的形式去初始化，这使得能我们能在这个实例上去拓展很多事情，比如effect的时候传入的第二个参数options，可以直接把没一个值都丢给实例，在它需要的地方去调用，比如scheduler、onStop，不过在没有明确的文档说明下，如果没有深入最深层的代码，是不会发现还提供了这样的功能（虽然单测都写着了）

## 响应式单值->响应式数据ref 与 computed

- 姿势点：

1. 由于一个基本类型是没有办法去做到响应式的，所以只能用ref包成一个对象，并通过.value的形式去做响应式的处理，处理完的形式与reactive其实差不多，不过不需要一个depsMap，所以在ref里声明一个dep set并去复用track与trigger部分逻辑就可以了

2. computed里用到了前面说到的scheduler 并且巧妙的在生产effect实例的时候不去run它等到get的时候去run，把effect函数里的逻辑进行的拆分。通过scheduler去控制computed实例里面是否需要去run一下获取最新的值，实现了缓存

3. ref与computed的大部分相关的功能点，都是在本身实例化的时候定义到实例上的属性去完成的