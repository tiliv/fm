import { useState, useEffect } from 'react';

export default function useWorld({ defaultWorld='overworld.txt' }) {
  const [world, setWorld] = useState(defaultWorld);
  const [walls, setWalls] = useState([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [map, setMap] = useState([]);
  const [interactions, setInteractions] = useState({});

  useEffect(() => {
    fetch(`/world/${world}`)
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n');
        const divIndex = lines.findIndex((row) => row === '---');
        const loadedMap = lines.slice(0, divIndex);
        setMap(loadedMap.map((row) => row.split('')));
        setSize({ width: loadedMap[0].length, height: loadedMap.length });
        setWalls(lines[divIndex + 1].split(''));
        setInteractions(Object.fromEntries(
          lines.slice(divIndex + 2, -1).map((line) => {
            const [location, label] = line.split(':');
            const [r, c] = location.split(',').map(Number);
            return [location, { label, sprite: loadedMap[r - 1][c - 1] }];
          })
        ));
      });
  }, [world]);

  return { map, size, walls, interactions };
}
