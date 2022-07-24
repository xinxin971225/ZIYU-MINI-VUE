// 最终结果在页面里面看到hi-minivue - ziyu
import { ref } from "../../lib/ziyu-mini-vue.esm.js";

export const App = {
  // .vue
  template: "<div>hi,{{message}}{{count}}</div>",
  // ⬇️ 编译
  // render
  name: "APP",
  setup() {
    // composition api
    const count = ref(0);
    window.count = count;
    return {
      message: "ziyu-mini-vue",
      count,
    };
  },
};
