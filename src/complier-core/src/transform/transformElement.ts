import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_BLOCK, OPEN_BLOCK } from "../runtimeHelper";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    const { getHelperName } = context;
    context.addHelper(getHelperName(OPEN_BLOCK));
    context.addHelper(getHelperName(CREATE_ELEMENT_BLOCK));
  }
}
