// 最终结果在页面里面看到hi-minivue - ziyu
import { h } from "../../lib/ziyu-mini-vue.esm.js";
window.self = null;
export const App = {
  // .vue
  // <template></template>
  // ⬇️ 编译
  // render
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
