import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";

// diff 对比
// 从左往右 尾部不同
// (AB)CD
// (AB)
// true -> 添加 false -> 删除
// const newArr = [
//   h("div", { key: "A", id: "AAA" }, "A"),
//   h("div", { key: "B" }, "B"),
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
// ];
// const oldArr = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];

// 从右往左 头部不同
// CD(AB)
//   (AB)
// true -> 添加 false -> 删除
// const newArr = [
//   h("div", { key: "C" }, "C"),
//   h("div", { key: "D" }, "D"),
//   h("div", { key: "A" }, "A"),
//   h("div", { key: "B" }, "B"),
// ];
// const oldArr = [h("div", { key: "A" }, "A"), h("div", { key: "B" }, "B")];

// 过滤完左右对比中间
// (AB)EFG(CD)
// (AB)FEXN(CD)
const newArr = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "E", id: "next E" }, "E"),
  h("div", { key: "F", id: "next F" }, "F"),
  h("div", { key: "G" }, "G"),
  h("div", { key: "C" }, "C"),
  h("div", { key: "D" }, "D"),
];
const oldArr = [
  h("div", { key: "A" }, "A"),
  h("div", { key: "B" }, "B"),
  h("div", { key: "F", id: "pre F" }, "F"),
  h("div", { key: "E", id: "pre E" }, "E"),
  h("div", { key: "X" }, "X"),

  h("div", { key: "N" }, "N"),
  h("div", { key: "C" }, "C"),
  h("div", { key: "D" }, "D"),
];

export const array2array = {
  setup() {
    const arrayToArray = ref(false);
    window.arrayToArray = arrayToArray;
    return { arrayToArray };
  },
  render() {
    return h(
      "div",
      { class: [this.arrayToArray ? "red" : "blue"] },
      this.arrayToArray ? newArr : oldArr
    );
  },
};
