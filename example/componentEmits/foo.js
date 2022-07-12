import { h } from "../../lib/ziyu-mini-vue.esm.js";

export const foo = {
  setup(props, ctx) {
    const { emit } = ctx;
    const onAdd = () => {
      console.log("emit event:add");
      emit("add", 1, 3);
    };
    const onAddFoo = () => {
      console.log("emit event:add-foo");
      emit("add-foo", 2, 33);
    };
    return {
      onAdd,
      onAddFoo,
    };
  },
  render() {
    //3. render 能直接通过this去读取props
    return h("div", {}, [
      "foo:" + this.count,
      h(
        "button",
        {
          onClick: () => {
            this.onAdd();
            this.onAddFoo();
          },
        },
        "点我去emit"
      ),
    ]);
  },
};
