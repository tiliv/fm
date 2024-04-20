import { useState, useEffect } from 'react';

export default function usePosition({
  marker='Θ',
  defaultX=0,
  defaultY=0,
  map,
  walls,
}) {
  const [x, setX] = useState(defaultX);
  const [y, setY] = useState(defaultY);
  const [bump, setBump] = useState(null);

  useEffect(() => {
    const keydown = (e) => {
      let newX = x;
      let newY = y;
      switch (e.key) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
      }
      if (!walls.includes(map[newY]?.[newX])) {
        setX(newX);
        setY(newY);
        setBump(null);
      } else {
        setBump([newY, newX]);
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [map, x, y]);

  return { marker, bump, x, y };
}
