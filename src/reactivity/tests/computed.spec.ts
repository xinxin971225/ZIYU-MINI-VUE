import { computed } from "../computed";
import { reactive } from "../reactive";

describe("computed", () => {
  it("happy path", () => {
    const user = reactive({
      age: 1,
    });
    const computedAge = computed(() => {
      return user.age;
    });
    expect(computedAge.value).toBe(1);
  });

  it("computed 应该被cache", () => {
    const user = reactive({
      age: 1,
    });
    const getter = jest.fn(() => {
      return user.age;
    });
    const computedVal = computed(getter);
    // 没有读取的时候不应该执行 laszy
    expect(getter).not.toBeCalled();
    expect(computedVal.value).toBe(1);
    // 应该被执行一次
    expect(getter).toBeCalledTimes(1);
    //  cache 一次
    computedVal.value;
    expect(getter).toBeCalledTimes(1);
    // 不需要去计算
    user.age = 2;
    expect(getter).toBeCalledTimes(1);
    // 需要去计算了
    expect(computedVal.value).toBe(2);
    expect(getter).toBeCalledTimes(2);
    // 又不需要去计算了
    computedVal.value;
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
