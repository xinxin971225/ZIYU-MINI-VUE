import { readonly, isReadonly } from "../reactive";
describe("readonly", () => {
  it("happy path", () => {
    const originVal = { foo: "1" };
    const readonlyValue = readonly(originVal);
    expect(readonlyValue).not.toBe(originVal);
    expect(readonlyValue.foo).toBe("1");
    expect(isReadonly(readonlyValue)).toBe(true);
    expect(isReadonly(originVal)).toBe(false);
  });
  it("支持嵌套复杂数据类型的 readonly", () => {
    const originVal = { foo: { bar: { data: "1" } }, arr: [{ foo: 666 }] };
    const readonlyValue = readonly(originVal);
    expect(isReadonly(readonlyValue.foo)).toBe(true);
    expect(isReadonly(readonlyValue.foo.bar)).toBe(true);
    expect(isReadonly(readonlyValue.arr)).toBe(true);
    expect(isReadonly(readonlyValue.arr[0])).toBe(true);
  });
  it("set key should be warn", () => {
    console.warn = jest.fn(() => {});
    const originVal = { foo: "1" };
    const readonlyValue = readonly(originVal);
    readonlyValue.foo = "2";
    expect(console.warn).toBeCalled();
    expect(console.warn).toHaveBeenCalled();
  });
});
