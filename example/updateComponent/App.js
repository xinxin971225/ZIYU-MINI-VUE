import {
  getCurrentInstance,
  h,
  ref,
  nextTick,
} from "../../lib/ziyu-mini-vue.esm.js";
import { propsComponent } from "./propsComponent.js";
export const App = {
  name: "App",
  setup() {
    const instance = getCurrentInstance();

    const count = ref(0);
    const onClick = () => {
      for (let i = 1; i < 100; i++) {
        console.log("update");
        count.value = i;
      }
      console.log("instance", instance);
      nextTick(() => {
        console.log("instance", instance);
      });
    };

    const propsData = ref("123321");
    window.propsData = propsData;
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
