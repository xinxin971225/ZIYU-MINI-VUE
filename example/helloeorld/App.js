// 最终结果在页面里面看到hi-minivue - ziyu
import { h } from "../../lib/ziyu-mini-vue.esm.js";
import { foo } from "./foo.js";
window.self = null;
export const App = {
  // .vue
  // <template></template>
  // ⬇️ 编译
  // render
  name: "APP",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["app"],
        onClick: () => {
          console.log("onclick");
        },
        onMouseDown: () => {
          console.log("onMouseDown");
        },
      },
      [
        h("p", { class: ["red"] }, "hello"),
        // setupState
        // $el -> mountElement 时找个能读到的地方存起来
        h("p", { class: ["blue"] }, this.msg),
        h(foo, { count: 1 }),
      ]
    );
  },
  setup() {
    // composition api
    return {
      msg: "ziyu-mini-vue 666",
    };
  },
};
