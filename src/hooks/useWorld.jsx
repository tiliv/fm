import { useState, useEffect } from 'react';

import { classifyObjectSpec } from '../interactions';

export default function useWorld({ world }) {
  const [walls, setWalls] = useState([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [map, setMap] = useState([]);
  const [interactions, setInteractions] = useState({});

  useEffect(() => {
    fetch(`world/${world}`)
      .then((res) => res.text())
      .then((text) => {
        const [loadedMap, zoneKey, objects] = text.trim().split('---\n');
        const rows = loadedMap.trim().split('\n');
        setMap(rows.map((row) => row.split('')));
        setSize({ width: rows[0].length, height: rows.length });
        setWalls((zoneKey || '').split('\n').map((line) => line[0]));
        setInteractions(Object.fromEntries(
          (objects || '').split('\n').filter(line => line.length).map((line) => {
            const data = classifyObjectSpec(line);
            const [r, c] = data.coordinates;
            data.sprite = rows[r - 1][c - 1];
            return [`${r},${c}`, data];
          })
        ));
      });
  }, [world]);

  return { map, size, walls, interactions };
}
