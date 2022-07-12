export const isObject = (data) => {
  return data !== null && typeof data === "object";
};

export const extend = Object.assign;

export const hasChangeed = (val1, val2) => {
  return !Object.is(val1, val2);
};

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);
