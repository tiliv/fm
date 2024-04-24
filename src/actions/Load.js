const IGNORE = [undefined, null];

export function load(slot, vars) {
  const loadHandler = () => {
    Object.entries(vars).forEach(([key, [_, setter]]) => {
      const v = JSON.parse(localStorage.getItem(`${slot}/${key}`));
      if (!IGNORE.includes(v)) {
        setter(v);
      }
    });
  };
  window.addEventListener('load', loadHandler);
  return () => window.removeEventListener('load', loadHandler);
}
