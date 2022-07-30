# ZIYU-MINI-VUE

- [reactive](./src/reactivity/README.md)
- [runtime-core](./src//runtime-core/README.md)

## diff 算法

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
