import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any[] = [];
  const node = parseInterpolation(context);
  nodes.push(node);

  return nodes;
}

function parseInterpolation(context) {
  // source -> "{{message}}"
  const startDelimiter = "{{";
  const closeDelimiter = "}}";
  const { source } = context;
  const closeIndex = source.indexOf("}}", startDelimiter.length);
  const content = source.slice(startDelimiter.length, closeIndex);
  context.source = source.slice(closeIndex + closeDelimiter.length);
  console.log(content, context.source);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function createRoot(children) {
  return {
    children,
  };
}

function createParseContext(content: string) {
  return {
    source: content,
  };
}
