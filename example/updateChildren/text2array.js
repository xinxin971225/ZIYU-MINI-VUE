import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";

const newText = [
  h("div", {}, "newFoo text2array"),
  h("div", {}, "newBar text2array"),
];
const oldText = "oldChildren text2array";

export const text2array = {
  name: "textToArray",
  setup() {
    const textToArray = ref(false);
    window.textToArray = textToArray;
    return {
      textToArray,
    };
  },
  render() {
    return h(
      "div",
      { class: [this.textToArray ? "red" : "blue"] },
      this.textToArray ? newText : oldText
    );
  },
};
