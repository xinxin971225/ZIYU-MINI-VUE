import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any[] = [];
  const s = context.source;
  let node;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (/^<[a-z]/i.test(s)) {
    node = parseElement(context);
  }
  // default
  if (!node) {
    node = parseText(context);
  }
  nodes.push(node);

  return nodes;
}

function parseText(context) {
  const content = context.source;
  advanceBy(context, content.length);
  return {
    type: NodeTypes.TEXT,
    content,
  };
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
    tag,
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
