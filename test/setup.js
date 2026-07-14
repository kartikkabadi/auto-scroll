// jsdom does not provide requestAnimationFrame/cancelAnimationFrame.
// Use window.setTimeout/clearTimeout so Vitest fake timers can drive them.
window.requestAnimationFrame = (callback) => window.setTimeout(callback, 16);
window.cancelAnimationFrame = (id) => window.clearTimeout(id);

// jsdom also does not implement window.scrollTo, but scroll.js sets scrollTop.
window.scrollTo = () => {};
