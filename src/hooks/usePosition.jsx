import { useState, useEffect } from 'react';

import useSave from './useSave';

export default function usePosition({
  marker='Θ',
  defaultX=0,
  defaultY=0,
  map,
  walls,
  interactions,
  zones,
  possesses,
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
  const [zone, setZone] = useState(null);

  useSave({
    x: [x, (v) => setTimeout(() => setX(v), 50)],
    y: [y, (v) => setTimeout(() => setY(v), 50)],
    zone: [zone, setZone],
  });

  useEffect(() => {
    setBump(null);
    setX(defaultX);
    setY(defaultY);
  }, [defaultX, defaultY]);

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
      if (!walls[map[newY]?.[newX]] && !interactions[`${newY + 1},${newX + 1}`]) {
        setX(newX);
        setY(newY);
        setBump(null);
        window.dispatchEvent(new CustomEvent('interaction', { detail: null }));
      } else if (`${bump}` === `${newY},${newX}`) {  // same bump twice in a row
        const interaction = interactions[`${newY + 1},${newX + 1}`];
        if (interaction?.destination) {
          const { key } = interaction.attributes || {};
          if (!key || possesses('ring', key)) {
            const event = new CustomEvent('destination', { detail: interaction });
            window.dispatchEvent(event);
          }
        }
      } else {
        setBump([newY, newX]);
      }

      Object.entries(zones).forEach(([box, data]) => {
        const [r, c, r2, c2] = box.split(',').map(Number);
        if (newY >= r && newY < r2 && newX >= c && newX < c2) {
          setZone(data);
        } else {
          setZone(null);
        }
      });
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [map, zones, x, y, bump, keyMap]);

  return { marker, bump, zone, x, y };
}
