# ZIYU-MINI-VUE - runtime-core

## 整体流程

- 在用户端使用的时候用户需要一个 createApp 创建一个跟容器，然后通过容器的 mount 方法传入一个根节点。就能得到一个简易的 vue 应用

  - 这里的容器就可以是我们的 vue 组件编译完成后的一个 js 对象，必须包含一个 render 函数，vue3 中的 compoition api 会把逻辑都放在 setup 中，所以这个对象中也可以包含一个 setup 方法，这就是一个简单的容器了。
  - 为了能够最终渲染到浏览器页面上，我们不应该直接限死根节点为 body 因为后面实现 customer render 的话会需要自定义一个容器。

- 基于上面的使用方式，我们就需要一个[createApp](./createApp.ts)方法，返回一个对象包含一个 mount 方法，mount 方法内去调用我们整个 runtime 的 render 方法

- [render](./renderer.ts)就是整个模块运行的起点，在这个过程中，所有的 dom 元素与组件对象都会先被转换成虚拟节点 vnode 在进行处理，核心是 patch 方法，在遍历整个虚拟节点 vnode 的时候递归用到 patch 方法。

- 整个 patch 流程主要分为两个大的分支`processElement`处理 element 类型与`processComponent`处理组件类型
  - **processElement**
  - **processComponent**
