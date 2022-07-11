// 最终结果在页面里面看到hi-minivue - ziyu
import { h } from "../../lib/ziyu-mini-vue.esm.js";
export const App = {
  // .vue
  // <template></template>
  // ⬇️ 编译
  // render
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["app"],
      },
      [
        h("p", { class: ["red"] }, "hello"),
        h("p", { class: ["blue"] }, "ziyu-mini-vue"),
      ]
    );
  },
  setup() {
    // composition api
    return {
      msg: "ziyu",
    };
  },
};
