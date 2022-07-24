import { NodeTypes } from "../ast";
import { isTextOrInterpolation } from "../utils";

export function transformElementChildren(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const children = node.children;
      // 对原有元素children 除了element外的其他节点做转换-》添加一个+号 -》收集为一个新的节点类型
      let currentChild;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isTextOrInterpolation(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const nextChild = children[j];
            if (isTextOrInterpolation(child)) {
              if (!currentChild) {
                currentChild = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentChild.children.push(" + ");
              currentChild.children.push(nextChild);
              // 删除元素时，数组的内容会移位，所以j要保持上一次的位置
              children.splice(j, 1);
              j--;
            } else {
              currentChild = null;
            }
          }
        }
      }
    };
  }
}
