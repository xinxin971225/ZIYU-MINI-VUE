import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
}

function parseChildren(context, elementStack) {
  const nodes: any[] = [];
  while (!isEnd(context, elementStack)) {
    const s = context.source;
    let node;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (/^<[a-z]/i.test(s)) {
      node = parseElement(context, elementStack);
    }
    // default
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}
function isEnd(context, elementStack) {
  const s = context.source;
  if (s.startsWith("</")) {
    for (let i = elementStack.length - 1; i >= 0; i--) {
      const tag = elementStack[i];
      if (endTagToEqualStartTag(s, tag)) {
        return true;
      }
    }
  }

  return !s;
}

function parseText(context) {
  let endIndex = context.source.length;
  let endStrs = ["</", "{{"];
  for (let i = endStrs.length - 1; i >= 0; i--) {
    const findIndex = context.source.indexOf(endStrs[i]);
    if (findIndex !== -1 && findIndex < endIndex) {
      endIndex = findIndex;
    }
  }

  const content = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}
function parseElement(context, elementStack) {
  const element: any = parseTag(context);
  elementStack.push(element.tag);
  element.children = parseChildren(context, elementStack);
  elementStack.pop();
  if (endTagToEqualStartTag(context.source, element.tag)) {
    parseTag(context);
  } else {
    throw new Error(`缺失闭合标签：${element.tag}`);
  }

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
function endTagToEqualStartTag(context, startTag) {
  return context.substr(2, startTag.length) === startTag;
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
