import { NodeTypes } from "./ast";
import { helpersNameMap, TO_DISPLAY_STRING } from "./runtimeHelper";

export function transform(root, options = {}) {
  const context = createRootContext(root, options);
  traverseNode(root, context);
  createGenCode(root);
  createHelpers(root, context);
}

function createHelpers(root, context) {
  root.helpers = [...context.helpers.keys()];
}

function createGenCode(root) {
  root.genCodeNode = root.children[0];
}

/**
 * 创建一个全局上下文对象
 * @param root
 * @param options
 * @returns
 */
function createRootContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    addHelper: (key) => {
      context.helpers.set(key, 1);
    },
    getHelperName: (key) => {
      return helpersNameMap[key];
    },
  };
  return context;
}

/**
 * 处理每个节点的方法
 * @param node
 */
function traverseNode(node, context) {
  // // 这块逻辑不应该写在for循环中
  // if (node.type === NodeTypes.TEXT) {
  //   node.content += "ziyu";
  // }
  const { nodeTransforms, addHelper, getHelperName } = context;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transformFn = nodeTransforms[i];
    transformFn(node);
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      addHelper(getHelperName(TO_DISPLAY_STRING));
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseNodeChildren(node, context);
      break;
    default:
      break;
  }
}

function traverseNodeChildren(node, context) {
  // 相对固定的深度优先遍历
  const children = node.children;
  if (children) {
    // 深度优先遍历
    for (let i = 0; i < children.length; i++) {
      const nodeChildren = children[i];
      traverseNode(nodeChildren, context);
    }
  }
}
