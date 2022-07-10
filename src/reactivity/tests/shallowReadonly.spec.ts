import { shallowReadonly, isReadonly } from "../reactive";

describe("shallowReadonly", () => {
  it("happy path", () => {
    const origin = { foo: { n: 1 } };
    const shallowData = shallowReadonly(origin);

    expect(isReadonly(shallowData)).toBe(true);
    expect(isReadonly(shallowData.foo)).toBe(false);
  });
});
