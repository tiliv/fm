import { useState, useEffect } from 'react';

import { classifyObjectSpec, TYPES } from '../interactions';

export default function useWorld({ world }) {
  const [walls, setWalls] = useState({});
  const [size, setSize] = useState([0, 0]);
  const [map, setMap] = useState([]);
  const [interactions, setInteractions] = useState({});
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetch(`world/${world}`)
      .then((res) => res.text())
      .then((text) => {
        const [loadedMap, objects] = text.trim().split('---\n');
        const rows = loadedMap.trim().split('\n');
        setMap(rows.map((row) => row.split('')));
        const size = [rows.length, rows[0].length];
        setSize(size);

        const lines = (objects || '').split('\n').map((line) => {
          if (!line.length) return false;
          try {
            return classifyObjectSpec(line);
          } catch (e) {
            console.error(e);
            return false;
          }
        }).filter(Boolean);

        setWalls(Object.fromEntries(
          lines
            .filter(({ type }) => type === TYPES.SPRITE)
            .map((data) => [data.sprite, data])
        ));

        const points = lines.filter((data) => data.coordinates);
        const boxGroups = lines.filter((data) => data.boxes);
        setInteractions(Object.fromEntries(
          points.map((data) => {
            const { coordinates: [r, c] } = data;
            data.sprite = rows[r - 1][c - 1];
            return [`${r},${c}`, data];
          }
        )));

        return [size, boxGroups];
      }).then(async ([size, boxGroups]) => {
        const zones = [];
        await Promise.all(boxGroups.map(async (data) => {
          const { boxes, dataFile } = data;
          const overlay = await fetch(`overlays/${dataFile}`).then((res) => res.text());
          data.buffer = overlay.replace(/\n+$/, '').split('\n');
          if (!boxes.length) {
            zones.push({ ...data, box: [1, 1, ...size] })
          } else {
            boxes.forEach((box) => {
              zones.push({ ...data, box });
            });
          }
        }));
        setZones(zones);
      });
  }, [world]);

  return { map, size, walls, interactions, zones };
}
