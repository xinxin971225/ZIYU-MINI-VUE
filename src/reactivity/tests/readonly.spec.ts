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

  it("set key should be warn", () => {
    console.warn = jest.fn(() => {});
    const originVal = { foo: "1" };
    const readonlyValue = readonly(originVal);
    readonlyValue.foo = "2";
    expect(console.warn).toBeCalled();
    expect(console.warn).toHaveBeenCalled();
  });
});
