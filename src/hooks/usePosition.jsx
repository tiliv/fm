import { useState, useEffect } from 'react';

export default function usePosition({
  marker='Θ',
  defaultX=0,
  defaultY=0,
  map,
  walls,
  interactions,
  keyMap={
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
  },
}) {

  const [x, setX] = useState(defaultX);
  const [y, setY] = useState(defaultY);
  const [bump, setBump] = useState(null);

  useEffect(() => {
    const keydown = (e) => {
      let newX = x;
      let newY = y;
      switch (e.key) {
        case keyMap.up: newY--; break;
        case keyMap.down: newY++; break;
        case keyMap.left: newX--; break;
        case keyMap.right: newX++; break;
        default: return;
      }
      if (!walls.includes(map[newY]?.[newX])) {
        setX(newX);
        setY(newY);
        setBump(null);
      } else {
        if (`${bump}` === `${newY},${newX}`) {
          const { destination } = interactions[`${newY + 1},${newX + 1}`] || {};
          if (destination) {
            setY(destination[0] - 1);
            setX(destination[1] - 1);
            setBump(null);
          }
        } else {
          setBump([newY, newX]);
        }
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [map, x, y, bump, keyMap]);

  return { marker, bump, x, y };
}
