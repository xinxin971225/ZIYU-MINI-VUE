import { createRenderer } from "../runtime-core/renderer";

// Dom正常流程
// const el = document.createElement('div')
// el.textContent = 'hi'
// el.setAttribute('id','root')
// document.body.append(el)
function createElement(type) {
  // console.log("createElement");
  return document.createElement(type);
}

function patchProp(el, key, val) {
  if (/^on[A-Z]/.test(key)) {
    const event = key.slice(2).toLocaleLowerCase();
    el.addEventListener(event, val);
  } else {
    el.setAttribute(key, val);
  }
}
function insert(el, container) {
  // console.log("insert");
  container.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

/**
 * 这里由于暴露一个默认的createApp（dom），所以需要我们通过createRenderer生成一个默认的renderer，
 * 并把createApp给出去，但是createApp在renderer，所以为它包一层名为createApp的方法
 * @param args 用户的参数
 * @returns
 */
export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
