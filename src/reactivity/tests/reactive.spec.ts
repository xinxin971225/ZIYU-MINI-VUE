import { reactive } from "../reactive";
describe("reactive", () => {
  it("happy path", () => {
    const originalVal = { foo: 1 };
    const reactiveObj = reactive(originalVal);
    expect(originalVal).not.toBe(reactiveObj);
    expect(reactiveObj.foo).toBe(1);
  });
});
