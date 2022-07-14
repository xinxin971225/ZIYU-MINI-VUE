import { createRenderer } from "../runtime-core/renderer";

function createElement(type) {
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
  container.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
