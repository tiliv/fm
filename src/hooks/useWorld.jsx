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
        const [loadedMap, zoneKey, objects] = text.trim().split('---\n');
        const rows = loadedMap.trim().split('\n');
        setMap(rows.map((row) => row.split('')));
        setSize({ width: rows[0].length, height: rows.length });
        setWalls(zoneKey.split('\n').map((line) => line[0]));
        setInteractions(Object.fromEntries(
          objects.split('\n').map((line) => {
            const [location, info] = line.split(':');
            const [label, dataFile] = info.split('/');
            const [coordinate, destination] = location.split('=');
            const [r, c] = coordinate.split(',').map(Number);
            const [dr, dc] = !destination ? [] : destination.split(',').map(Number);
            return [coordinate, {
              label,
              dataFile,
              coordinates: [r, c],
              sprite: rows[r - 1][c - 1],
              destination: dr === undefined ? null : [dr, dc],
            }];
          })
        ));
      });
  }, [world]);

  return { map, size, walls, interactions };
}
