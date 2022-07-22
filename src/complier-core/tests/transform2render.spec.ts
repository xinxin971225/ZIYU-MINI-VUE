import { generate } from "../src/codegenerate";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("ast -> render ", () => {
  it("happy path simple str", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});
