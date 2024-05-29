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
  const [priorBox, setPriorBox] = useState(null);

  useSave({
    x: [x, (v) => setTimeout(() => setX(v), 50)],
    y: [y, (v) => setTimeout(() => setY(v), 50)],
    zone: [zone, setZone],
  });

  // Reset position when map changes
  useEffect(() => {
    setBump(null);
    setX(defaultX);
    setY(defaultY);
  }, [defaultX, defaultY]);

  // Player movement & bump detection
  useEffect(() => {
    const keydown = (e) => {
      let [newY, newX] = [y, x];
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
    };

    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [map, walls, zones, x, y, bump, keyMap, interactions]);

  // Detect current zone
  useEffect(() => {
    let newZone = null;
    for (const data of zones) {
      const [r, c, r2, c2] = data.box.map((v) => v - 1);
      if (y >= r && y <= r2 && x >= c && x <= c2) {
        newZone = data;
      }
    }
    if (priorBox !== newZone?.box) {
      setZone(newZone);
      setPriorBox(newZone?.box || null);
    }
  }, [zones, x, y]);

  // Try to change weather zones
  useEffect(() => {
    const ranges = Object.entries(zone?.attributes || {}).map(([name, newZone]) => {
      const { min, max } = /(?<min>\d+)-(?<max>\d+)/.exec(name)?.groups || {};
      if (min === undefined) return false;
      return [Number(min), Number(max), newZone];
    }).filter(Boolean);

    if (ranges.length) {
      // get max value from ranges arrays
      const [, max] = ranges.reduce((a, b) => a[1] > b[1] ? a : b);
      // pick a random number from 0 to max
      const value = Math.floor(Math.random() * max) + 1;
      // find the range that includes the random number
      const [,,nextZone] = ranges.find(([min, max]) => value >= min && value <= max) || [];
      if (nextZone) {
        setZone(zones.find(({ dataFile }) => dataFile === nextZone));
      }
    }
  });

  // Respond to movement-based interaction events
  useEffect(() => {
    if (!bump) return;
    const climb = function() {
      setX(bump[1]);
      setY(bump[0]);
    };
    window.addEventListener('Climb.player', climb);
    return () => window.removeEventListener('Climb.player', climb);
  }, [bump]);

  return { marker, bump, zone, x, y };
}
