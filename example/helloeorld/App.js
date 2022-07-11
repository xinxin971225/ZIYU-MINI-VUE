// 最终结果在页面里面看到hi-minivue - ziyu

export const App = {
  // .vue
  // <template></template>
  // ⬇️ 编译
  // render
  render() {
    return h("div", "hi-minivue - " + this.msg);
  },
  setuo() {
    // composition api
    return {
      msg: "ziyu",
    };
  },
};
