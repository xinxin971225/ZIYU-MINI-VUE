import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const onClick = () => {
      console.log("click");
      count.value++;
    };
    return { count, onClick };
  },
  render() {
    return h("div", {}, [
      h("div", { class: ["blue"] }, "count    " + this.count),
      h(
        "button",
        {
          onClick: this.onClick,
        },
        "点我count++"
      ),
    ]);
  },
};
