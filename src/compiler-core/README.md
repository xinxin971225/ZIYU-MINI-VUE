# ZIYU-MINI-VUE - compiler-core

## 工具网

[template 转 render](https://vue-next-template-explorer.netlify.app/#eyJzcmMiOiI8ZGl2PkhlbGxvIFdvcmxkPC9kaXY+Iiwib3B0aW9ucyI6e319)

### 编译模块

我们在正常开发 vue 应用的时候经常使用的模板语法，并不能直接给到 vue 的方法去使用，这个过程需要通过运行时的编译，将模板语法编译为 vue 方法能够识别的格式，也就是 render 方法的样子。

> 一般的编译流程

1.  首先会将模板以字符串的形式进行读取，并解析(parse)成一个 ast 树，描述模板的 dom 结构。并且解析掉一段就截取掉一段。

2.  根据 ast 树的内容，对特定特征的数据进行修饰，中间可以加入 n 个插件对 ast 进行不同程度的修改，同时插件会根据加入顺序进行执行，并注入退出时需要执行的方法，在执行完一轮后反向执行退出方法。

3.  最后根据修饰完成的 ast 树进行编译，形成一个 render 函数的函数体字符串，通过 new Function 进行调用
