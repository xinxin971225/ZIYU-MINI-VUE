export const isObject = (data) => {
  return data !== null && typeof data === "object";
};

export const extend = Object.assign;

export const hasChangeed = (val1, val2) => {
  return !Object.is(val1, val2);
};

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);

export function camelize(str: string) {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toLocaleUpperCase() : "";
  });
}

function capitalize(str: string) {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1);
}

export function toHandlerKey(str: string) {
  return str ? "on" + capitalize(str) : "";
}
