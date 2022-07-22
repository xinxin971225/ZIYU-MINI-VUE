import { NodeTypes } from "./ast";
import { helpersNameMap, TO_DISPLAY_STRING } from "./runtimeHelper";

export function generate(ast) {
  const context = createGenerateContext();
  const { push } = context;
  getFunctionPreamble(context, ast);
  push("export ");
  getFunctionNameAndArgs(context);
  getNode(context, ast.genCodeNode);
  push(" }");
  return {
    code: context.code,
  };
}

function getFunctionPreamble(context, ast) {
  const { push } = context;
  const VueBinging = "vue";
  const aliasHelper = (s) => `${s} as _${s}`;
  if (ast.helpers.length) {
    push(
      `import { ${ast.helpers
        .map(aliasHelper)
        .join(", ")} } from "${VueBinging}"`
    );
  }
  push("\n");
}

function createGenerateContext() {
  const context: any = {
    code: "",
    push: (str) => {
      context.code += str;
    },
    getHelperName: (key) => {
      return helpersNameMap[key];
    },
  };
  return context;
}

function getFunctionNameAndArgs(context) {
  const { push } = context;
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const argStr = args.join(", ");
  push(`function ${functionName}(${argStr}){`);
  push(" return");
}
function getNode(context, node) {
  switch (node.type) {
    case NodeTypes.TEXT:
      getTextCode(context, node);
      break;
    case NodeTypes.INTERPOLATION:
      getInterpolation(context, node);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      getExpression(context, node);
      break;
    default:
      break;
  }
}
function getTextCode(context, node) {
  const { push } = context;

  const text = node.content;
  push(` "${text}"`);
}
function getInterpolation(context: any, node: any) {
  const { push, getHelperName } = context;
  const rawContent = node.content;
  push(` _${getHelperName(TO_DISPLAY_STRING)}(`);
  getNode(context, rawContent);
  push(")");
}
function getExpression(context: any, node: any) {
  const { push } = context;
  // 这里的ctx属于半业务了，应该交给transform 这里只负责拼接字符串
  // push(`_ctx.${node.content}`);
  push(`${node.content}`);
}
