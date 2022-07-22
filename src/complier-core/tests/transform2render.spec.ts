import { generate } from "../src/codegenerate";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transform/transformExpression";

describe("ast -> render ", () => {
  it("happy path simple str", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
  it("happy path simple interpolation", () => {
    const ast = baseParse("{{message}}");
    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});
