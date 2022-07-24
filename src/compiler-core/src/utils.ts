import { NodeTypes } from "./ast";

export function isTextOrInterpolation(node) {
  const { type } = node;

  return type === NodeTypes.INTERPOLATION || type === NodeTypes.TEXT;
}
