import { generate } from "./codegenerate";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transform/transformElement";
import { transformElementChildren } from "./transform/transformElementChildren";
import { transformExpression } from "./transform/transformExpression";

export function baseCompiler(template) {
  const ast = baseParse(template);
  transform(ast, {
    nodeTransforms: [
      transformExpression,
      transformElement,
      transformElementChildren,
    ],
  });
  return generate(ast);
}
