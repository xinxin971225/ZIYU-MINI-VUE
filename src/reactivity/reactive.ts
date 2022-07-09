import { baseHandlers, readonlyBaseHandlers } from "./baseHandlers";

export const reactive = (raw) => {
  return createActiveObject(raw, baseHandlers);
};

export const readonly = (raw) => {
  return createActiveObject(raw, readonlyBaseHandlers);
};

function createActiveObject(raw, Handlers) {
  return new Proxy(raw, Handlers);
}
