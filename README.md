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




## diff算法

- 姿势点

1. 首先是建立新旧数组尾部索引各一个e1 e2 ; 在声明一个头部索引i =0

2. 通过i++的形式在i比e1或者e2大之前去patch相同的vnode当第一个新旧不同节点出现时确实从前往后第一个差异点i

   通过e1e2--的形式与上面相同的做法确认从后往前的第一个差一点 这里就能得到新旧数组的差异区间

3. 因为最终要渲染的是e2数组
    - 如果i已经大于e2说明需要去删除久的数组里面多出来的元素
    - 如果i已经大于e1说明要去创建新的元素
    - 不满足上面两种情况说明需要进行中间数组的增删移动

4. ***删除逻辑要点*** :建立一个e2数组内部key与index的 keyToIndexMap ，减少去遍历e2数组的时间复杂度；同时遍历e1数组，查找keyToIndexMap有无对应的key，没有的话再去e2里面遍历对比，获取到久元素在新数组中的新下标，如果没有下标，说明要去删掉它。否则就继续patch下去【小优化点：记录e2数组 toBePatch 的长度，当已经patch的个数等于toBePatch时，剩下的就只需要删掉它了】

   ***移动逻辑要点***：需要构建一个相同元素新旧索引的映射 newChildIndexToOldChildIndexMap ,默认都为0，表示没对应的需要创建；采用前面记录的 toBePatch 生成一个等长的数组，在上一步patch的同时将新下标减去i（起始位置）去拿到数组对应的index，把当前老节点的oldIndex赋值给index。有了 newChildIndexToOldChildIndexMap 后就可以计算出不需要移动的最长递增子序列。**采用倒序遍历**从后往前遍历新的diffChildren,如果在最长递增子序列内有当前遍历到的i，说明这个节点不需要管，如果不在而且`newChildIndexToOldChildIndexMap[i]`的值不等于0，说明是需要移动的。去hostInsert它

   ***新增逻辑要点***：在处理移动的时候，如果`newChildIndexToOldChildIndexMap[i] === 0` 说明需要去新增一个
   