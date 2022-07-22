export function transform(root, options = {}) {
  const context = createRootContext(root, options);
  traverseNode(root, context);
  createGenCode(root);
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
  return {
    root,
    nodeTransforms: options.nodeTransforms || [],
  };
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
  const { nodeTransforms } = context;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transformFn = nodeTransforms[i];
    transformFn(node);
  }
  traverseNodeChildren(node, context);
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
