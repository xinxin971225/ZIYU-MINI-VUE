import { reactive, isReactive } from "../reactive";
describe("reactive", () => {
  it("happy path", () => {
    const originalVal = { foo: 1 };
    const reactiveObj = reactive(originalVal);
    expect(originalVal).not.toBe(reactiveObj);
    expect(reactiveObj.foo).toBe(1);
    expect(isReactive(reactiveObj)).toBe(true);
    expect(isReactive(originalVal)).toBe(false);
  });
  it("嵌套复杂对象的reactive", () => {
    const originalVal = { foo: { bar: 1 }, arr: [{ foo: "2" }] };
    const reactiveObj = reactive(originalVal);
    expect(reactiveObj.foo.bar).toBe(1);
    reactiveObj.foo.bar = reactiveObj.foo.bar + 1;
    expect(reactiveObj.foo.bar).toBe(2);
    expect(isReactive(reactiveObj.foo)).toBe(true);
    expect(isReactive(reactiveObj.arr)).toBe(true);
    expect(isReactive(reactiveObj.arr[0])).toBe(true);
  });
});
