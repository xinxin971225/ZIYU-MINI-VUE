import { h } from "../../lib/ziyu-mini-vue.esm.js";

export const foo = {
  setup(props) {
    //1.setup 要能读取到
    console.log(props);
    //2. shallow readonly
    props.count++;
    console.log(props);
  },
  render() {
    //3. render 能直接通过this去读取props
    return h("div", {}, "foo:" + this.count);
  },
};
