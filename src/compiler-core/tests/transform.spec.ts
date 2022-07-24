import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("transform", () => {
  it("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    const pluginA = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += "ziyu";
      }
    };
    transform(ast, {
      nodeTransforms: [pluginA],
    });
    const textNode = ast.children[0].children[0];
    expect(textNode.content).toBe("hi,ziyu");
  });
});
