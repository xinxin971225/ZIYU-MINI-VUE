import { h, ref } from "../../lib/ziyu-mini-vue.esm.js";

export const App = {
  name: "App",
  setup() {
    const count = ref(0);
    const onClick = () => {
      console.log("click");
      count.value++;
    };
    const propsData = ref({
      foo: "foo",
      bar: "bar",
    });
    const updataFoo2NewFoo = () => {
      propsData.value.foo = "newFoo";
    };
    const updataFoo2Null = () => {
      propsData.value.foo = null;
    };
    const deleteBar = () => {
      propsData.value = {
        foo: "deleteBar",
      };
    };
    return {
      count,
      onClick,
      propsData,
      updataFoo2NewFoo,
      updataFoo2Null,
      deleteBar,
    };
  },
  render() {
    return h(
      "div",
      {
        ...this.propsData,
      },
      [
        h("div", { class: ["blue"] }, "count    " + this.count),
        h(
          "button",
          {
            onClick: this.onClick,
          },
          "点我count++"
        ),
        h(
          "button",
          {
            onClick: this.updataFoo2NewFoo,
          },
          "点我updataFoo2NewFoo -> foo -> newFoo"
        ),
        h(
          "button",
          {
            onClick: this.updataFoo2Null,
          },
          "点我updataFoo2Null-> foo -> null"
        ),
        h(
          "button",
          {
            onClick: this.deleteBar,
          },
          "点我deleteBar bar ->    "
        ),
      ]
    );
  },
};
