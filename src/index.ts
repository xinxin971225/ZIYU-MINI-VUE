import { baseCompiler } from "./compiler-core";

// mini-vue 入口
export * from "./runtime-dom";
export * from "./reactivity";
import * as vue from "./runtime-dom";
import { generateCompiler } from "./runtime-dom";

//"<div>hi,{{message}}</div>"
// `
// "import { toDisplayString as _toDisplayString, openBlock as _openBlock, createElementBlock as _createElementBlock } from \\"vue\\"
// return function render(_ctx, _cache){
//  return (_openBlock(), _createElementBlock( \\"div\\", null, \\"hi,\\" + _toDisplayString(_ctx.message), 1 /* TEXT */))
// }"
// `
function compileToFunction(template) {
  const { code } = baseCompiler(template);
  const render = new Function("vue", code)(vue);
  return render;
}
generateCompiler(compileToFunction);
