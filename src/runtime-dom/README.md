# ZIYU-MINI-VUE - runtime-dom

## 运行时 dom 相关操作

因为 vue3 提供了一个 coustom render 的接口，可以让用户自定义渲染器，所以这里将有关 element 的 dom 操作完全抽离出来一个模块，并且将 core 中的 render 封装一层变成一个生成函数，提供给用户自定义元素的创建，设置属性与插入。这让原本与 dom 耦合的 render 方法变成更为强大的用户自定义渲染并且能够复用已经相对完善的 patch 与 diff 算法。

默认情况下用户使用的 createApp 是通过当前模块调用 core 模块的 createRenderer 并传入对应 dom 操作生成的方法。
