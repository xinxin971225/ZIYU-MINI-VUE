import { h } from "../../lib/ziyu-mini-vue.esm.js";

export const propsComponent = {
  setup() {},
  render() {
    return h("div", { class: "yellow" }, "children    " + this.$props.msg);
  },
};
