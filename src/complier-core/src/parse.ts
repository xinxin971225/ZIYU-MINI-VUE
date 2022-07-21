import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any[] = [];
  const s = context.source;
  if (s.startsWith("{{")) {
    const node = parseInterpolation(context);
    nodes.push(node);
  } else if (/^<[a-z]/i.test(s)) {
    const node = parseElement(context);
    nodes.push(node);
  }

  return nodes;
}
function parseElement(context) {
  const element = parseTag(context);
  parseTag(context);

  return element;
}
function parseTag(context) {
  // 解析出div
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  // 删掉解析过的东西
  advanceBy(context, match[0].length + 1);
  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
  };
}
function parseInterpolation(context) {
  // source -> "{{message}}"
  const startDelimiter = "{{";
  const closeDelimiter = "}}";
  const { source } = context;
  const closeIndex = source.indexOf(closeDelimiter, startDelimiter.length);
  const rawContent = source.slice(startDelimiter.length, closeIndex);
  const content = rawContent.trim();
  advanceBy(context, closeIndex + closeDelimiter.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}
function advanceBy(context, length) {
  context.source = context.source.slice(length);
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
