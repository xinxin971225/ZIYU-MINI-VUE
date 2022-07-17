import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";

const newText = "newChildren array2text";
const oldText = [
  h("div", {}, "oldFoo array2text"),
  h("div", {}, "oldBar array2text"),
];

export const array2text = {
  name: "arrayToText",
  setup() {
    const arrayToText = ref(false);
    window.arrayToText = arrayToText;
    return {
      arrayToText,
    };
  },
  render() {
    return h(
      "div",
      { class: [this.arrayToText ? "red" : "blue"] },
      this.arrayToText ? newText : oldText
    );
  },
};
