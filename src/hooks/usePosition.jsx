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
  const [facing, setFacing] = useState([0, 0]);

  useEffect(() => {
    const keydown = (e) => {
      let newX = x;
      let newY = y;
      switch (e.key) {
        case 'ArrowUp': newY--; setFacing([-1, 0]); break;
        case 'ArrowDown': newY++; setFacing([1, 0]); break;
        case 'ArrowLeft': newX--; setFacing([0, -1]); break;
        case 'ArrowRight': newX++; setFacing([0, 1]); break;
      }
      if (!walls.includes(map[newY]?.[newX])) {
        setX(newX);
        setY(newY);
      }
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [map, x, y]);

  return { marker, facing, x, y };
}
