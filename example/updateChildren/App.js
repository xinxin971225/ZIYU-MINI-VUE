import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";
import { array2text } from "./array2text.js";
import { text2array } from "./text2array.js";
import { text2text } from "./text2text.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    return {
      count,
    };
  },
  render() {
    return h("div", {}, [
      h("div", { class: ["blue"] }, "hello ziyu   " + this.count),
      h(text2text),
      h(text2array),
      h(array2text),
    ]);
  },
};
