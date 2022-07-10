import { effect } from "../effect";
import { ref } from "../ref";

describe("ref", () => {
  it("happy path", () => {
    const refValue = ref(1);
    expect(refValue.value).toBe(1);
  });

  it("ref 的value 改变应该去触发effect的依赖", () => {
    const refValue = ref(1);
    let dummy;
    let effectTime = 0;
    effect(() => {
      effectTime++;
      dummy = refValue.value;
    });
    expect(effectTime).toBe(1);
    expect(dummy).toBe(1);
    refValue.value++;
    expect(effectTime).toBe(2);
    expect(dummy).toBe(2);
    refValue.value = 2;
    //  值相同时不应该去更新
    expect(effectTime).toBe(2);
    expect(dummy).toBe(2);
  });

  it("如果ref的受参是复杂结构，那应该相当于调用reactive", () => {
    const refValue = ref({
      count: 0,
    });
    let dummy;
    expect(refValue.value.count).toBe(0);
    effect(() => {
      dummy = refValue.value.count;
    });
    expect(dummy).toBe(0);
    refValue.value.count++;
    expect(dummy).toBe(1);
    refValue.value.count = 2;
    expect(dummy).toBe(2);
  });
});
