import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("simple Parse", () => {
  it(" simple interpolation", () => {
    const ast = baseParse("{{ message }}");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.INTERPOLATION,
      content: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: "message",
      },
    });
  });
  it("simple element div", () => {
    const ast = baseParse("<div></div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [],
    });
  });
  it("simple text", () => {
    const ast = baseParse("some text");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.TEXT,
      content: "some text",
    });
  });
});

describe("parse template happy path", () => {
  it("parse simple union ", () => {
    const ast = baseParse("<div>hi,{{ message }}</div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "hi,",
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  it("tags happy path", () => {
    const ast = baseParse("<div><p>hi</p>{{ message }}</div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeTypes.TEXT,
              content: "hi",
            },
          ],
        },

        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "message",
          },
        },
      ],
    });
  });

  it("no close tag should throw error", () => {
    expect(() => {
      const ast = baseParse("<div><p></div>");
    }).toThrowError("缺失闭合标签：p");
  });
});
