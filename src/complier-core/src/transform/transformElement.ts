import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_BLOCK, OPEN_BLOCK } from "../runtimeHelper";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { getHelperName } = context;
      context.addHelper(getHelperName(OPEN_BLOCK));
      context.addHelper(getHelperName(CREATE_ELEMENT_BLOCK));
      let nodeProps;
      node.props = nodeProps;
      node.tag = `"${node.tag}"`;
      let vnodeChildren = node.children[0];
      if (vnodeChildren.type === NodeTypes.COMPOUND_EXPRESSION) {
        node.genCodeNode = vnodeChildren;
      }
    };
  }
}
