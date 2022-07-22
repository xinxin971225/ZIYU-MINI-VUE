export function generate(ast) {
  const context = createGenerateContext();
  const { push } = context;
  push("export ");
  getFunctionNameAndArgs(context);
  getTextCode(context, ast);
  push(" }");
  return {
    code: context.code,
  };
}

function createGenerateContext() {
  const context: any = {
    code: "",
    push: (str) => {
      context.code += str;
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

function getTextCode(context, ast) {
  const { push } = context;

  const text = ast.genCodeNode.content;
  push(` "${text}"`);
}
