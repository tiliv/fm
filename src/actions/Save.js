export function save(slot, vars) {
  const saveHandler = () => {
    Object.entries(vars).forEach(([key, [value, _]]) => {
      localStorage.setItem(`${slot}/${key}`, JSON.stringify(value));
    });
  };
  window.addEventListener('Save', saveHandler);
  return () => {
    window.removeEventListener('Save', saveHandler);
  };
}
