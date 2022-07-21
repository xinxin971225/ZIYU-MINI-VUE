const queue = new Set();
let isFlushPending = false;
const p = Promise.resolve();
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}
export function queueJobs(job) {
  queue.add(job);
  queueFlush();
}
export function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(() => {
    queue.forEach((job: any) => job && job());
    queue.clear();
    isFlushPending = false;
  });
}
