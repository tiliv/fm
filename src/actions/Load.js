const IGNORE = [undefined, null];

export function load(slot, vars) {
  const loadHandler = (e) => {
    const specificSlot = e.detail?.name;
    console.log('specificSlot', specificSlot);
    Object.entries(vars).forEach(([key, [_, setter]]) => {
      const v = JSON.parse(localStorage.getItem(`${specificSlot || slot}/${key}`));
      if (!IGNORE.includes(v)) {
        setter(v);
      }
    });
  };
  window.addEventListener('load', loadHandler);
  return () => window.removeEventListener('load', loadHandler);
}

export function list() {
  const slotNames = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const [name] = key.split('/', 1);
    if (name !== 'latest' && !slotNames.includes(name)) {
      slotNames.push(name);
    }
  }
  return slotNames;
}
