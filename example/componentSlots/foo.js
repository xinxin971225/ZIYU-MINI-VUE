import {
  h,
  renderSlots,
  getCurrentInstance,
} from "../../lib/ziyu-mini-vue.esm.js";

export const foo = {
  name: "Foo",
  setup() {
    const instance = getCurrentInstance();
    console.log("Foo", instance);
  },
  render() {
    //3. render 能直接通过this去读取props
    console.log(this.$slots);
    return h("div", {}, [
      renderSlots(this.$slots, "headers", { count: 123 }),
      "foo:" + this.count,
      h("p", {}, "foo"),
      renderSlots(this.$slots, "default", { count: 996 }),
    ]);
  },
};
