import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";
import { propsComponent } from "./propsComponent.js";
export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const onClick = () => {
      count.value++;
    };
    const propsData = ref("123321");
    const updataPropsData = () => {
      propsData.value += "2";
    };
    return {
      count,
      onClick,
      propsData,
      updataPropsData,
    };
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
      h(propsComponent, {
        msg: this.propsData,
      }),
      h(
        "button",
        {
          onClick: this.updataPropsData,
        },
        "点我updataPropsData -> 123321 -> 1233212"
      ),
    ]);
  },
};
