import {
  createTextVNode,
  h,
  inject,
  provide,
} from "../../lib/ziyu-mini-vue.esm.js";
window.self = null;

const foo = {
  name: "foo",

  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    // const barze = inject("barze", "abcd");
    const barze = inject("barze", () => "abcd");
    return {
      foo,
      bar,
      barze,
    };
  },
  render() {
    return h(
      "div",
      {
        class: ["blue"],
      },
      `'foo' -> ${this.foo} -> ${this.bar} -> ${this.barze}`
    );
  },
};
const foo2 = {
  name: "foo2",
  setup() {
    provide("foo", "foo2");
    const foo = inject("foo");
    return {
      foo,
    };
  },
  render() {
    return h("div", {}, [createTextVNode(this.foo), h(foo)]);
  },
};
export const App = {
  // .vue
  // <template></template>
  // ⬇️ 编译
  // render
  name: "APP",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "root",
        class: ["app red"],
      },
      [createTextVNode(this.msg), h(foo2)]
    );
  },
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
    // composition api
    return {
      msg: "ziyu-mini-vue 666",
    };
  },
};
