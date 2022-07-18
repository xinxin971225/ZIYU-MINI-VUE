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
    if (val === undefined || val === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, val);
    }
  }
}
function insert(children, parent, anchor) {
  // console.log("insert");
  // 这个api只会往后面塞元素，如果在前面就挂了
  // parent.append(el);
  // insertBefore 可以在anchor（锚点）前面append children，默认给null时就往后塞
  parent.insertBefore(children, anchor || null);
}
function setElementText(text, el) {
  // 这里会直接覆盖元素内部的所有内容所有无需在前面去清楚children
  el.textContent = text;
}

function removeChildren(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  setElementText,
  removeChildren,
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
