import { reactive } from "../reactive";
import { effect } from "../effect";

describe("effect", () => {
  it("happy path", () => {
    // 生成一个响应式对象，在对应获取与设置的时候出发我们收集到的依赖
    const user = reactive({
      age: 10,
    });

    let nextAge;
    // 依赖搜集会先去执行一遍，才能够出发依赖搜集
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });
});
