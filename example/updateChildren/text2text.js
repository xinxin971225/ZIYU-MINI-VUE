import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";

const newText = "newChildren textToText";
const oldText = "oldChildren textToText";

export const text2text = {
  name: "textToText",
  setup() {
    const textToText = ref(false);
    window.textToText = textToText;
    return {
      textToText,
    };
  },
  render() {
    return h(
      "div",
      { class: [this.textToText ? "red" : "blue"] },
      this.textToText ? newText : oldText
    );
  },
};
