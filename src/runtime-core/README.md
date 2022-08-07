# ZIYU-MINI-VUE - runtime-core

## 整体流程

- 在用户端使用的时候用户需要一个 createApp 创建一个跟容器，然后通过容器的 mount 方法传入一个根节点。就能得到一个简易的 vue 应用

  - 这里的容器就可以是我们的 vue 组件编译完成后的一个 js 对象，必须包含一个 render 函数，vue3 中的 compoition api 会把逻辑都放在 setup 中，所以这个对象中也可以包含一个 setup 方法，这就是一个简单的容器了。
  - 为了能够最终渲染到浏览器页面上，我们不应该直接限死根节点为 body 因为后面实现 customer render 的话会需要自定义一个容器。

- 基于上面的使用方式，我们就需要一个[createApp](./createApp.ts)方法，返回一个对象包含一个 mount 方法，mount 方法内去调用我们整个 runtime 的 render 方法

- [render](./renderer.ts)就是整个模块运行的起点，在这个过程中，所有的 dom 元素与组件对象都会先被转换成虚拟节点 vnode 在进行处理，核心是 patch 方法，在遍历整个虚拟节点 vnode 的时候递归用到 patch 方法。

- 整个 patch 流程主要分为两个大的分支`processElement`处理 element 类型与`processComponent`处理组件类型

  > **processElement**

  - element 类型处理分两种情况

    1. 初始化挂在元素 mountElement

       初始化的时候主要做 3 件事

       1. 创建 node 节点，
       2. 设置对于属性，
       3. 插入容器当中

       在这个过程中，如果遇到 children 会去递归调用 patch，重复上面过程初始化 children 的元素

    2. 更新元素 patchelement

       对比更新，采用 diff 算法，最小程度调用 dom api 更新页面

  > **processComponent**

  - component 类型处理分两种情况

    1. 初始化挂在组件 mountComponent

       初始化组件主要做 3 件事

       1. 将组件包装为一个容器 instance->并调用组件中定义的 setup
       2. 根据 setup 返回值传给组件定义的 render 方法生成 vNodeTree
       3. 通过 render 返回的 vNode 去调用 patch 方法

    2. 更新组件 patchComponent

       更新组件与初始化组件的区别在于会有一个新老 instance 的对比你过程，只需要更新到新的 instance 然后去重新调用 render 方法去获取新的 vNodeTree 与 oldvNodeTree 进行 patch 即可

### diff 算法

- 姿势点

1. 首先是建立新旧数组尾部索引各一个 e1 e2 ; 在声明一个头部索引 i =0

2. 通过 i++的形式在 i 比 e1 或者 e2 大之前去 patch 相同的 vnode 当第一个新旧不同节点出现时确实从前往后第一个差异点 i

   通过 e1e2--的形式与上面相同的做法确认从后往前的第一个差一点 这里就能得到新旧数组的差异区间

3. 因为最终要渲染的是 e2 数组

   - 如果 i 已经大于 e2 说明需要去删除久的数组里面多出来的元素
   - 如果 i 已经大于 e1 说明要去创建新的元素
   - 不满足上面两种情况说明需要进行中间数组的增删移动

4. **_删除逻辑要点_** :建立一个 e2 数组内部 key 与 index 的 keyToIndexMap ，减少去遍历 e2 数组的时间复杂度；同时遍历 e1 数组，查找 keyToIndexMap 有无对应的 key，没有的话再去 e2 里面遍历对比，获取到久元素在新数组中的新下标，如果没有下标，说明要去删掉它。否则就继续 patch 下去【小优化点：记录 e2 数组 toBePatch 的长度，当已经 patch 的个数等于 toBePatch 时，剩下的就只需要删掉它了】

   **_移动逻辑要点_**：需要构建一个相同元素新旧索引的映射 newChildIndexToOldChildIndexMap ,默认都为 0，表示没对应的需要创建；采用前面记录的 toBePatch 生成一个等长的数组，在上一步 patch 的同时将新下标减去 i（起始位置）去拿到数组对应的 index，把当前老节点的 oldIndex 赋值给 index。有了 newChildIndexToOldChildIndexMap 后就可以计算出不需要移动的最长递增子序列。**采用倒序遍历**从后往前遍历新的 diffChildren,如果在最长递增子序列内有当前遍历到的 i，说明这个节点不需要管，如果不在而且`newChildIndexToOldChildIndexMap[i]`的值不等于 0，说明是需要移动的。去 hostInsert 它

   **_新增逻辑要点_**：在处理移动的时候，如果`newChildIndexToOldChildIndexMap[i] === 0` 说明需要去新增一个
