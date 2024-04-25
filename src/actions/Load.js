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
